from datetime import timedelta
from http import HTTPStatus

from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.db.models import When, Value, Case
from django.db.models.fields import PositiveIntegerField
from django.db.models.query import Prefetch
from django.http.request import HttpRequest
from django.utils.translation import gettext as _, activate
from ninja import Router
from ninja.errors import HttpError

from apps.commons.tokens import optional_auth
from apps.models import Event, Ticket, User
from apps.schema import MessageSchema, OrderItemInSchema, EventCardSchema

router = Router()
EXPIRE_SECONDS: int = int(timedelta(minutes=15).total_seconds())
CACHE_KEY: str = "order_item:"


@router.post("/cards/", response={HTTPStatus.CREATED: MessageSchema}, auth=optional_auth)
async def card_create(request: HttpRequest, payload: OrderItemInSchema):
    auth_user: User | AnonymousUser = request.auth

    is_ticket: bool = await Ticket.objects.filter(pk=payload.ticket_id).aexists()
    if not is_ticket:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Ticket does not exist"))

    if auth_user and getattr(auth_user, "is_authenticated", False):
        cache_key = f"{CACHE_KEY}user:{auth_user.pk}"
    else:
        if not request.session.session_key:
            await request.session.acreate()
        cache_key = f"{CACHE_KEY}session:{request.session.session_key}"

    cached_data = await cache.aget(cache_key)
    if not cached_data:
        ticket_items: list[dict[str, int]] = []
    elif isinstance(cached_data, list):
        ticket_items = cached_data
    else:
        ticket_items = [cached_data]

    item_found = False
    for item in ticket_items:
        if item.get("ticket_id") == payload.ticket_id:
            item["count"] = payload.count
            item_found = True
            break

    if not item_found:
        ticket_items.append({
            "ticket_id": payload.ticket_id,
            "count": payload.count
        })

    await cache.aset(cache_key, ticket_items, timeout=EXPIRE_SECONDS)
    return HTTPStatus.CREATED, MessageSchema(status=True, message=_("Card is save successfully"))


async def get_ticket(request: HttpRequest, user: User | AnonymousUser) -> tuple[
    list[dict[str, int]], str]:
    if user and getattr(user, "is_authenticated", False):
        cache_key = f"{CACHE_KEY}user:{user.pk}"
    else:
        session_key = request.session.session_key
        if not session_key:
            return [], ""
        cache_key = f"{CACHE_KEY}session:{request.session.session_key}"

    cached_data = await cache.aget(cache_key)
    if not cached_data:
        return [], cache_key

    if isinstance(cached_data, list):
        ticket_ids: list[dict[str, int]] = cached_data
    else:
        ticket_ids = [cached_data]

    return ticket_ids, cache_key


@router.get("/cards/", response={HTTPStatus.OK: list[EventCardSchema]}, auth=optional_auth)
async def card_get(request: HttpRequest, lang: str = "uz"):
    activate(lang)
    user = request.auth
    ticket_items, _ = await get_ticket(request, user)

    if not ticket_items:
        return HTTPStatus.OK, []

    # 1. Ticket ID va count xaritasini olamiz
    count_map = {item["ticket_id"]: item["count"] for item in ticket_items}
    ticket_ids = list(count_map.keys())

    when_clauses = [
        When(pk=t_id, then=Value(count))
        for t_id, count in count_map.items()
    ]

    ticket_query = (
        Ticket.objects.filter(pk__in=ticket_ids)
        .annotate(
            purchase_count=Case(
                *when_clauses,
                default=Value(1),
                output_field=PositiveIntegerField()
            )
        )
        .prefetch_related("translations")
    )

    events_query = Event.objects.filter(tickets__id__in=ticket_ids).select_related(
        "place",
        "category"
    ).prefetch_related(
        "translations",
        "category__translations",
        "place__translations",
        Prefetch("tickets", queryset=ticket_query)
    ).distinct()

    events = [event async for event in events_query.aiterator(chunk_size=100)]
    return HTTPStatus.OK, events


@router.delete("/cards/{pk}", response={HTTPStatus.NO_CONTENT: None, HTTPStatus.OK: MessageSchema}, auth=optional_auth)
async def card_delete(request: HttpRequest, pk: int):
    user = request.auth
    ticket_items, cache_key = await get_ticket(request, user)
    initial_length = len(ticket_items)
    updated_items = [item for item in ticket_items if item.get("ticket_id") != pk]

    if len(updated_items) < initial_length:
        if updated_items:
            await cache.aset(cache_key, updated_items, timeout=EXPIRE_SECONDS)
        else:
            await cache.adelete(cache_key)

        return HTTPStatus.NO_CONTENT, None

    return HTTPStatus.OK, MessageSchema(status=True, message=_("Card does not exist"))

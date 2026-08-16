from datetime import timedelta
from http import HTTPStatus

from django.core.cache import cache
from django.db.models.query import Prefetch
from django.http.request import HttpRequest
from django.utils.translation import gettext as _, activate
from ninja import Router
from ninja.errors import HttpError

from apps.commons.tokens import OptionalJWTAuth
from apps.models import Event, Ticket
from apps.schema import MessageSchema, OrderItemSchema, EventSchema

router = Router()
CACHE_KEY = "order_item:"

optional_jwt = OptionalJWTAuth()


@router.post("/cards/", response={HTTPStatus.CREATED: MessageSchema}, auth=optional_jwt)
async def card_create(request: HttpRequest, payload: OrderItemSchema):
    auth_user = request.auth
    expire_seconds = int(timedelta(minutes=15).total_seconds())
    is_ticket = await Ticket.objects.filter(pk=payload.ticked_id).aexists()
    if not is_ticket:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Ticket does not exist"))
    if auth_user.is_authenticated:
        cache_key = f"{CACHE_KEY}user:{auth_user.pk}"
    else:
        session_key = request.session.session_key
        if not session_key:
            session_key = request.session.session_key
        cache_key = f"{CACHE_KEY}session:{session_key}"
    cached_data = await cache.aget(cache_key)
    if not cached_data:
        ticket_ids = []
    elif isinstance(cached_data, list):
        ticket_ids = cached_data
    else:
        ticket_ids = [cached_data]
    if payload.ticked_id not in ticket_ids:
        ticket_ids.append(payload.ticked_id)
    await cache.aset(cache_key, ticket_ids, timeout=expire_seconds)
    return HTTPStatus.CREATED, MessageSchema(message=_("Card is save successfully"))


@router.get("/cards/", response={HTTPStatus.OK: list[EventSchema]}, auth=optional_jwt)
async def card_get(request: HttpRequest, lang: str = "uz"):
    activate(lang)
    user = request.auth
    if user.is_authenticated:
        cache_key = f"{CACHE_KEY}user:{user.pk}"
    else:
        session_key = request.session.session_key
        cache_key = f"{CACHE_KEY}session:{session_key}"
    ticket_ids = await cache.aget(cache_key)
    if not ticket_ids:
        return HTTPStatus.OK, []
    if not isinstance(ticket_ids, list):
        ticket_ids = [ticket_ids]
    ticket_query = Ticket.objects.filter(pk__in=ticket_ids).prefetch_related("translations")
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


@router.delete("/cards/{pk}", response={HTTPStatus.NO_CONTENT: None, HTTPStatus.OK: MessageSchema}, auth=optional_jwt)
async def card_delete(request: HttpRequest, pk: int):
    user = request.auth
    if user.is_authenticated:
        cache_key = f"{CACHE_KEY}user:{user.pk}"
    else:
        session_key = request.session.session_key
        cache_key = f"{CACHE_KEY}session:{session_key}"
    ticket_ids = await cache.aget(cache_key)
    if not ticket_ids:
        return HTTPStatus.OK, MessageSchema(message=_("Card does not exist"))
    ticket_ids = await cache.aget(cache_key)
    if not isinstance(ticket_ids, list):
        ticket_ids = [ticket_ids]
    if pk in ticket_ids:
        ticket_ids.remove(pk)
        expire_seconds = int(timedelta(minutes=15).total_seconds())
        if ticket_ids:
            await cache.aset(cache_key, ticket_ids, timeout=expire_seconds)
        else:
            await cache.adelete(cache_key)
        return HTTPStatus.NO_CONTENT, None
    return HTTPStatus.OK, MessageSchema(message=_("Card does not exist"))

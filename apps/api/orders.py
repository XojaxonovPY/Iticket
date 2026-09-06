import secrets
from http import HTTPStatus

from asgiref.sync import sync_to_async
from django.db import transaction
from django.db.models import Q, F, Case, PositiveIntegerField, When, Value, Prefetch
from django.db.utils import IntegrityError
from django.http import HttpRequest
from django.utils.translation import activate
from django.utils.translation import gettext as _
from ninja import Router
from ninja.errors import HttpError

from apps.commons.exceptions import logger
from apps.models import User, Ticket, OrderItem, Order
from apps.schema import OrderInSchema, MessageSchema, OrderOutSchema

router = Router()


def create_order_transaction(payload: OrderInSchema, user: User | None = None) -> Order:
    payload_map = {item.ticket_id: item.count for item in payload.ticket}
    ticket_ids: list[int] = list(payload_map.keys())
    user_data: dict[str, str] = {
        "phone_number": payload.phone_number,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "email": payload.email,
        "password": str(secrets.token_urlsafe(32))
    }
    try:
        with transaction.atomic():
            tickets = Ticket.objects.select_for_update().filter(pk__in=ticket_ids).all()

            if len(tickets) != len(payload_map):
                raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Tickets not found"))

            total_amount = 0
            ticket_dict = {}
            for ticket in tickets:
                requested_count = payload_map[ticket.id]

                if ticket.count < requested_count:
                    raise HttpError(
                        status_code=HTTPStatus.BAD_REQUEST,
                        message=_(f"Not enough tickets available for {ticket.id}")
                    )

                total_amount += ticket.price * requested_count
                ticket_dict[ticket.id] = ticket

            if not user:
                user = User.objects.create_user(user_data)

            order = Order.objects.create(
                user=user,
                total_amount=total_amount,
            )

            order_items = []
            when_clauses = []

            for t_id, count in payload_map.items():
                ticket = ticket_dict[t_id]
                order_items.append(OrderItem(
                    order=order, ticket=ticket, count=count, price_at_purchase=ticket.price
                ))
                when_clauses.append(
                    When(id=t_id, then=F("count") - Value(count))
                )

            Ticket.objects.filter(id__in=ticket_ids).update(
                count=Case(*when_clauses, default=F("count"), output_field=PositiveIntegerField())
            )
    except IntegrityError as e:
        logger.error(e)
        raise HttpError(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, message=_("Server has problem"))
    return {"message": _("Order created successfully")}


@router.post("/orders/", response={HTTPStatus.CREATED: MessageSchema}, auth=None)
async def create_order(request: HttpRequest, payload: OrderInSchema):
    user: User | None = await User.objects.filter(
        Q(phone_number=payload.phone_number) | Q(email=payload.email)
    ).afirst()
    message = await sync_to_async(create_order_transaction)(payload, user)
    return HTTPStatus.CREATED, message


@router.get("/orders/", response=list[OrderOutSchema])
async def get_orders(request: HttpRequest, lang: str = "uz"):
    activate(lang)
    item_qs = OrderItem.objects.select_related("ticket").prefetch_related("ticket__translations")
    order_object = (Order.objects.filter(user=request.auth)
    .select_related("user").prefetch_related(
        Prefetch("order_item", queryset=item_qs))
    ).distinct().order_by("-created_at")
    orders = [order async for order in order_object.aiterator(chunk_size=100)]
    return orders

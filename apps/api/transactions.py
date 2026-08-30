from http import HTTPStatus

from asgiref.sync import sync_to_async
from django.db import transaction
from django.db.models import Prefetch, Q
from django.http.request import HttpRequest
from ninja import Router, Query
from ninja.errors import HttpError

from apps.commons.exceptions import logger
from apps.filters import TransactionEnumFilter
from apps.models import Order, Payment, Transaction, User, OrderItem
from apps.schema import MessageSchema, PaymentInSchema, PaymentOutSchema, OrderOutSchema, AllTransactionsSchema

router = Router()


def create_payment_transaction(payload: PaymentInSchema, user: User) -> dict[str, str]:
    try:
        with transaction.atomic():
            order = (
                Order.objects.select_for_update()
                .filter(pk=payload.order_id, user=user)
                .first()
            )
            if not order:
                raise HttpError(HTTPStatus.NOT_FOUND, "Order not found")

            if order.status in [Order.StatusTextChoices.CANCELLED, Order.StatusTextChoices.FAILED]:
                raise HttpError(HTTPStatus.BAD_REQUEST, "Order is already cancelled or failed")
            payment_filter = {"order": order, "user": user, "status": Payment.StatusTextChoices.PENDING}
            payment, _ = Payment.objects.select_for_update().get_or_create(
                **payment_filter,
                defaults={"total_amount": 0, "status": Payment.StatusTextChoices.PENDING}
            )

            if payment.status == Payment.StatusTextChoices.COMPLETED:
                raise HttpError(HTTPStatus.BAD_REQUEST, "Payment already completed")

            order_required_amount = order.total_amount
            paid_amount = payload.total_amount

            if paid_amount >= order_required_amount:
                extra_money = paid_amount - order_required_amount
                Payment.objects.filter(**payment_filter).update(
                    total_amount=order_required_amount, status=Payment.StatusTextChoices.COMPLETED
                )
                Order.objects.filter(pk=order.pk, user=user).update(total_paid=order_required_amount)
                transactions = [
                    Transaction(
                        payment=payment,
                        amount=order_required_amount,
                        status=Transaction.StatusTextChoices.SUCCESS
                    )
                ]

                if extra_money > 0:
                    transactions.append(
                        Transaction(
                            payment=payment,
                            amount=extra_money,
                            status=Transaction.StatusTextChoices.FAILED
                        )
                    )

                Transaction.objects.bulk_create(transactions)
                return {"message": "Payment completed successfully"}

            else:
                Payment.objects.filter(**payment_filter).update(
                    total_amount=payment.total_amount + paid_amount
                )
                Order.objects.filter(pk=order.pk, user=user).update(total_paid=order.total_paid + paid_amount)
                Transaction.objects.create(
                    payment=payment,
                    amount=paid_amount,
                    status=Transaction.StatusTextChoices.SUCCESS
                )
                return {"message": "Partial payment accepted"}
    except HttpError:
        raise
    except Exception as e:
        logger.error(f"Payment error: {e}", exc_info=True)
        raise HttpError(HTTPStatus.INTERNAL_SERVER_ERROR, "Payment processing failed")


@router.post("/payment/", response={HTTPStatus.CREATED: MessageSchema})
async def create_payment(request: HttpRequest, payload: PaymentInSchema):
    message = await sync_to_async(create_payment_transaction)(payload, request.auth)
    return HTTPStatus.CREATED, message


def _get_orders_queryset(user):
    item_qs = OrderItem.objects.select_related("ticket").prefetch_related("ticket__translations")
    return (
        Order.objects.filter(~Q(status=Order.StatusTextChoices.CANCELLED), user=user)
        .select_related("user")
        .prefetch_related(Prefetch("order_item", queryset=item_qs))
        .distinct()
        .order_by("-created_at")
    )


def _get_payments_queryset(user):
    return (
        Payment.objects.filter(user=user)
        .select_related("order", "user")
        .prefetch_related("transactions")
        .order_by("-created_at")
    )


@router.get("/transactions/", response=list[PaymentOutSchema] | list[OrderOutSchema] | AllTransactionsSchema)
async def get_payments_transactions(
        request: HttpRequest,
        filters: TransactionEnumFilter = Query(TransactionEnumFilter.all)
):
    user = request.auth
    chunk_size = 100
    if filters == TransactionEnumFilter.send:
        payments_qs = _get_payments_queryset(user)
        return [payment async for payment in payments_qs.aiterator(chunk_size=chunk_size)]

    if filters == TransactionEnumFilter.pending:
        orders_qs = _get_orders_queryset(user).filter(total_paid=0)
        return [order async for order in orders_qs.aiterator(chunk_size=chunk_size)]

    if filters == TransactionEnumFilter.receive:
        orders_qs = _get_orders_queryset(user).filter(total_paid__gt=0)
        return [order async for order in orders_qs.aiterator(chunk_size=chunk_size)]

    payments_qs = _get_payments_queryset(user)
    orders_qs = _get_orders_queryset(user)

    payments = [payment async for payment in payments_qs.aiterator(chunk_size=chunk_size)]
    orders = [order async for order in orders_qs.aiterator(chunk_size=chunk_size)]

    return {"payments": payments, "orders": orders}

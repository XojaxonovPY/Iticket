from http import HTTPStatus

from asgiref.sync import sync_to_async
from django.db import transaction
from django.http.request import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from apps.commons.exceptions import logger
from apps.models import Order, Payment, Transaction, User
from apps.schema import MessageSchema, PaymentInSchema, PaymentOutSchema

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

            payment, _ = Payment.objects.select_for_update().get_or_create(
                order=order,
                user=user,
                defaults={"total_amount": 0, "status": Payment.StatusTextChoices.PENDING}
            )

            if payment.status == Payment.StatusTextChoices.COMPLETED:
                raise HttpError(HTTPStatus.BAD_REQUEST, "Payment already completed")

            order_required_amount = order.total_amount
            paid_amount = payload.total_amount

            if paid_amount >= order_required_amount:
                extra_money = paid_amount - order_required_amount
                Payment.objects.filter(order=order, user=user).update(
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
                Payment.objects.filter(order=order, user=user).update(
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


@router.get("/transactions/", response={HTTPStatus.OK: list[PaymentOutSchema]})
async def get_payments_transactions(request: HttpRequest):
    transactions_qs = Payment.objects.select_related("order").prefetch_related("transactions").filter(
        user=request.auth
    )
    transactions = [transaction async for transaction in transactions_qs.aiterator()]
    return transactions

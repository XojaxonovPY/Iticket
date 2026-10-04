from decimal import Decimal

from ninja import Schema, ModelSchema

from apps.models import Transaction, Payment
from apps.schema import OrderOutSchema


class PaymentInSchema(Schema):
    order_id: int
    total_amount: Decimal


class TransactionSchema(ModelSchema):
    class Meta:
        model = Transaction
        fields = "__all__"


class PaymentOutSchema(ModelSchema):
    transactions: list[TransactionSchema]

    class Meta:
        model = Payment
        fields = "__all__"
        exclude = ["user"]


class AllTransactionsSchema(Schema):
    payments: list[PaymentOutSchema]
    orders: list[OrderOutSchema]

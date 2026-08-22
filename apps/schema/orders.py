import re

from django.utils.translation import gettext_lazy as _
from ninja import Schema, ModelSchema
from pydantic import EmailStr, Field, field_validator

from apps.models import Order, OrderItem
from apps.schema import TicketSchema


class OrderItemInSchema(Schema):
    ticket_id: int
    count: int = Field(gt=0)


class OrderInSchema(Schema):
    ticket: list[OrderItemInSchema]
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str = Field(max_length=20, min_length=6)

    @field_validator("phone_number")
    @classmethod
    def phone_number_validator(cls, value: str) -> str:
        cleaned = re.sub(r"\D", "", value)
        if not cleaned or len(cleaned) < 7:
            raise ValueError(_("Phone number must contain digits"))
        return cleaned


class OrderItemOutSchema(ModelSchema):
    ticket: TicketSchema

    class Meta:
        model = OrderItem
        exclude = ("order",)


class OrderOutSchema(ModelSchema):
    order_item: list[OrderItemOutSchema]

    class Meta:
        model = Order
        exclude = ("user",)

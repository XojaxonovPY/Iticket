from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from ninja import FilterSchema, FilterLookup


class EventFilterSchema(FilterSchema):
    title: Annotated[Optional[str], FilterLookup("translations__title__icontains")] = None
    category_id: int | None = None
    start_date: Annotated[Optional[datetime], FilterLookup("start_datetime__gte")] = None
    end_date: Annotated[Optional[datetime], FilterLookup("end_datetime_lte")] = None
    min_price: Annotated[Optional[int], FilterLookup("tickets__price__gte")] = None
    max_price: Annotated[Optional[int], FilterLookup("tickets__price__lte")] = None


class TransactionEnumFilter(str, Enum):
    all = "all"
    send = "send"
    receive = "receive"
    pending = "pending"

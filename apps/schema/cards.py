from apps.schema import EventSchema, TicketSchema


class TicketCardSchema(TicketSchema):
    purchase_count: int


class EventCardSchema(EventSchema):
    tickets: list[TicketCardSchema]
    expires_at: int | None = None
    remaining_seconds: int | None = None

from django.utils.translation import get_language
from ninja import ModelSchema, Schema

from apps.models import Category, Event, Ticket
from apps.schema.system import PlaceSchema


class CategorySchema(ModelSchema):
    name: str

    class Meta:
        model = Category
        fields = "__all__"

    @staticmethod
    def resolve_name(obj):
        return obj.safe_translation_getter("name", language_code=get_language(), any_language=False, default="")


class TicketSchema(ModelSchema):
    title: str
    description: str

    class Meta:
        model = Ticket
        fields = "__all__"

    @staticmethod
    def resolve_title(obj):
        return obj.safe_translation_getter("title", language_code=get_language(), any_language=False, default="")

    @staticmethod
    def resolve_description(obj):
        return obj.safe_translation_getter("description", language_code=get_language(), any_language=False, default="")


class EventSchema(ModelSchema):
    title: str
    description: str
    place: PlaceSchema
    category: CategorySchema
    tickets: list[TicketSchema]

    class Meta:
        model = Event
        fields = "__all__"

    @staticmethod
    def resolve_title(obj):
        return obj.safe_translation_getter("title", language_code=get_language(), any_language=False, default="")

    @staticmethod
    def resolve_description(obj):
        return obj.safe_translation_getter("description", language_code=get_language(), any_language=False, default="")


class WishlistSchema(Schema):
    event_id: int

from django.utils.translation import get_language
from ninja import ModelSchema

from apps.models import SalesOutlets, Questions, Place


class PlaceSchema(ModelSchema):
    name: str
    title: str

    class Meta:
        model = Place
        fields = "__all__"

    @staticmethod
    def resolve_name(obj):
        return obj.safe_translation_getter("name", language_code=get_language(), default="", any_language=True)
    @staticmethod
    def resolve_title(obj):
        return obj.safe_translation_getter("title", language_code=get_language(), default="", any_language=True)


class SalesOutletsSchema(ModelSchema):
    place : PlaceSchema

    class Meta:
        model = SalesOutlets
        fields = "__all__"




class QuestionsSchema(ModelSchema):
    class Meta:
        model = Questions
        fields = "__all__"
        exclude = ("is_visible",)

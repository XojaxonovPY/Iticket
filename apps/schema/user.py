from django.contrib.auth.hashers import make_password
from django.utils.translation import get_language
from django.utils.translation import gettext_lazy as _
from ninja import ModelSchema, Schema
from pydantic import model_validator, Field

from apps.models import User, Country, Address


class UserOutSchema(ModelSchema):
    class Meta:
        model = User
        fields = (
            "id", "first_name", "last_name", "phone_number", "email", "last_login", "gender", "birth_date", "country"
        )


class UserInSchema(ModelSchema):
    gender: User.GenderTextChoices | None = None

    class Meta:
        model = User
        fields = ("first_name", "last_name", "birth_date", "country")
        fields_optional = "__all__"


class PasswordSchema(Schema):
    old_password: str = Field(min_length=3, max_length=10)
    new_password: str = Field(min_length=3, max_length=10)
    confirm_password: str = Field(min_length=3, max_length=10)

    @model_validator(mode="after")
    def validate_password(self):
        if self.new_password != self.confirm_password:
            raise ValueError(_("Password is not equal to confirm_password"))
        return self


class CountrySchema(ModelSchema):
    name: str

    class Meta:
        model = Country
        fields = ("id",)

    @staticmethod
    def resolve_name(obj):
        return obj.safe_translation_getter("name", language_code=get_language(), default="", any_language=True)


class AddressInSchema(ModelSchema):
    country_id: int

    class Meta:
        model = Address
        exclude = ("id", "user", "country")


class AddressInUpSchema(ModelSchema):
    country_id: int | None = None

    class Meta:
        model = Address
        exclude = ("id", "user", "country")
        fields_optional = "__all__"


class AddressOutSchema(ModelSchema):
    class Meta:
        model = Address
        fields = "__all__"

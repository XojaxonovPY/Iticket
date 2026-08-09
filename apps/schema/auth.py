from django.utils.translation import gettext_lazy as _
from ninja import Schema
from pydantic import Field, model_validator, EmailStr


class RegisterSchema(Schema):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str = Field(max_length=20, min_length=5)
    confirm_password: str = Field(min_length=3, max_length=10, exclude=True)
    password: str = Field(min_length=3, max_length=10)

    @model_validator(mode="after")
    def validate_password(self):
        if self.password != self.confirm_password:
            raise ValueError(_("Password is not equal to confirm_password"))
        return self


class MessageSchema(Schema):
    message: str


class LoginSchema(Schema):
    email: EmailStr | None = None
    phone_number: str | None = None
    password: str = Field(min_length=3, max_length=10)


class TokenSchema(Schema):
    access_token: str
    refresh_token: str
    type: str = Field(default="Bearer")


class RefreshTokenSchema(Schema):
    refresh_token: str

from http import HTTPStatus

from django.db.models import Q
from django.db.utils import IntegrityError
from django.http.request import HttpRequest
from django.utils.timezone import now
from django.utils.translation import gettext as _
from ninja import Router
from ninja.errors import HttpError

from apps.commons.exceptions import logger
from apps.commons.tokens import create_access_token, create_refresh_token, verify_token
from apps.models import User
from apps.schema import RegisterSchema, MessageSchema, LoginSchema, TokenSchema, RefreshTokenSchema

router = Router()


@router.post("/register/", response={HTTPStatus.CREATED: MessageSchema}, auth=None)
async def register(request: HttpRequest, payload: RegisterSchema):
    try:
        await User.objects.acreate_user(**payload.dict())
    except IntegrityError as e:
        logger.error(e)
        raise HttpError(status_code=HTTPStatus.CONFLICT, message=_("User already exists"))
    return MessageSchema(status=True, message=_("User is registered"))


@router.post("/login/", response={HTTPStatus.OK: TokenSchema}, auth=None)
async def login(request: HttpRequest, payload: LoginSchema):
    user: User = await User.objects.filter(
        Q(email=payload.email) | Q(phone_number=payload.phone_number)
    ).afirst()

    if not user:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("User does not exist"))

    if not await user.acheck_password(payload.password):
        raise HttpError(message=_("Incorrect password"), status_code=HTTPStatus.BAD_REQUEST)
    user.last_login = now()
    await user.asave()
    access_token: str = create_access_token(str(user.pk))
    refresh_token: str = create_refresh_token(str(user.pk))
    return TokenSchema(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh/token/", response={HTTPStatus.OK: TokenSchema}, auth=None)
async def get_refresh_token(request: HttpRequest, payload: RefreshTokenSchema):
    token: dict[str, str] = verify_token(payload)
    if not token and token.get("type") != "refresh":
        raise HttpError(status_code=HTTPStatus.BAD_REQUEST, message=_("Invalid token"))
    subject = token.get("sub")
    access_token = create_access_token(subject)
    refresh_token = create_refresh_token(subject)
    return TokenSchema(access_token=access_token, refresh_token=refresh_token)

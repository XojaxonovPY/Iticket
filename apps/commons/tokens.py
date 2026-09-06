from datetime import timedelta
from http import HTTPStatus
from typing import Optional

import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.http import HttpRequest
from django.utils.timezone import now
from django.utils.translation import gettext as _
from ninja.security import HttpBearer

from apps.commons.exceptions import TokenError
from apps.models import User

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 5
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_token(payload: dict, expires_delta: timedelta) -> str:
    """Token yaratish uchun markazlashgan xavfsiz funksiya"""
    to_encode = payload.copy()
    expire = now() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(subject: str) -> str:
    """
    subject: Foydalanuvchining ID si bo'ladi
    """
    delta = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return create_token({"sub": str(subject), "type": "access"}, delta)


def create_refresh_token(subject: str) -> str:
    delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return create_token({"sub": str(subject), "type": "refresh"}, delta)


def verify_token(token: str) -> dict[str, str]:
    """Tokenni tekshirish va dekod qilish"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return {}


class JWTAuth(HttpBearer):
    async def authenticate(self, request: HttpRequest, token: str) -> Optional[User]:
        payload: dict[str, str] = verify_token(token)
        if not payload or payload.get("type") != "access":
            raise TokenError(_("Token is invalid"), HTTPStatus.UNAUTHORIZED)
        user_id = payload.get("sub")
        if not user_id:
            raise TokenError(_("User is not found"), HTTPStatus.NOT_FOUND)
        try:
            user = await User.objects.aget(id=int(user_id))
            return user
        except User.DoesNotExist:
            raise TokenError(_("User is not found or deleted"), HTTPStatus.UNAUTHORIZED)


class OptionalJWTAuth(JWTAuth):
    async def __call__(self, request: HttpRequest) -> Optional[object]:
        headers = request.headers
        auth_header = headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")

        if not auth_header or not auth_header.startswith("Bearer "):
            request.user = AnonymousUser()
            return AnonymousUser()

        parts = auth_header.split(" ")
        if len(parts) != 2 or not parts[1]:
            request.user = AnonymousUser()
            return AnonymousUser()
        token = parts[1]
        try:
            user = await self.authenticate(request, token)
            if user:
                request.user = user
                return user
        except TokenError:
            pass

        request.user = AnonymousUser()
        return AnonymousUser()


optional_auth: OptionalJWTAuth = OptionalJWTAuth()

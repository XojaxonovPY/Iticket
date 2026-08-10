import asyncio
from datetime import timedelta
from http import HTTPStatus
from typing import Optional, Any

import jwt
from django.conf import settings
from django.utils.timezone import now
from ninja.security import HttpBearer

from apps.commons.exceptions import TokenError
from apps.models import User

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 5
REFRESH_TOKEN_EXPIRE_DAYS = 7


async def create_token(payload: dict, expires_delta: timedelta) -> str:
    """Token yaratish uchun markazlashgan xavfsiz funksiya"""
    to_encode = payload.copy()
    expire = now() + expires_delta
    to_encode.update({"exp": expire})
    return await asyncio.to_thread(jwt.encode, to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """
    subject: Foydalanuvchining ID si bo'ladi
    """
    delta = expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_MINUTES)
    return await create_token({"sub": str(subject), "type": "access"}, delta)


async def create_refresh_token(subject: Any) -> str:
    delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return await create_token({"sub": str(subject), "type": "refresh"}, delta)


async def verify_token(token: str) -> dict | None:
    """Tokenni tekshirish va dekod qilish"""
    try:
        return await asyncio.to_thread(jwt.decode, token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


class JWTAuth(HttpBearer):
    async def authenticate(self, request, token: str):
        payload: dict = await verify_token(token)
        if not payload and payload.get("type") != "access":
            raise TokenError("Token invalid", HTTPStatus.UNAUTHORIZED)
        user_id = payload.get("sub")
        if not user_id:
            raise TokenError("User not found", HTTPStatus.NOT_FOUND)
        user = await User.objects.aget(id=user_id)
        return user

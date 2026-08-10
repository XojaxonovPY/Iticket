import asyncio
from functools import wraps

from django.core.cache import cache
from django.http import HttpRequest
from django.utils.translation import get_language


def cache_page_ninja(timeout: int = 300):
    """
    Django Ninja Paginated va Oddiy Endpoint'lar uchun mos kesh dekoratori.
    """

    def decorator(func):
        @wraps(func)
        async def async_wrapper(request: HttpRequest, *args, **kwargs):
            # 1. Tilni aniqlash
            header_lang = request.headers.get("Accept-Language")
            if header_lang:
                header_lang = header_lang.split(",")[0].split("-")[0].strip()

            # lang = request.GET.get("lang") or header_lang or get_language() or "uz"
            lang = get_language() or "uz"

            # 2. Unikal kesh kaliti (Query Params va Page hisobga olinadi)
            cache_key = f"ninja_cache:{lang}:{request.get_full_path()}"

            # 3. Keshni tekshiramiz
            cached_data = await cache.aget(cache_key)
            if cached_data is not None:
                return cached_data

            # 4. Funksiyani bajaramiz
            if asyncio.iscoroutinefunction(func):
                response = await func(request, *args, **kwargs)
            else:
                response = func(request, *args, **kwargs)

            # 5. Keshga yozamiz va qaytaramiz
            await cache.aset(cache_key, response, timeout=timeout)
            return response

        return async_wrapper

    return decorator

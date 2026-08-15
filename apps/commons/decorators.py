import functools
import inspect

from django.core.cache import cache
from django.http import HttpRequest
from django.utils.translation import activate


def cache_page_ninja(timeout: int = 60 * 15, key_prefix: str = "ninja_cache"):
    def decorator(func):

        def _get_lang_from_request(request: HttpRequest, kwargs: dict) -> str:
            lang = kwargs.get("lang") or request.GET.get("lang")
            if not lang and hasattr(request, "headers"):
                lang = request.headers.get("Accept-Language")
            return lang or "uz"

        def _make_cache_key(request: HttpRequest, lang: str) -> str:
            return f"{key_prefix}:{request.path}:{lang}"

        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(request: HttpRequest, *args, **kwargs):
                lang = _get_lang_from_request(request, kwargs)
                activate(lang)
                cache_key = _make_cache_key(request, lang)
                response_data = await cache.aget(cache_key)
                if response_data is not None:
                    return response_data
                response_data = await func(request, *args, **kwargs)
                await cache.aset(cache_key, response_data, timeout)
                return response_data

            return async_wrapper

        else:

            @functools.wraps(func)
            def sync_wrapper(request: HttpRequest, *args, **kwargs):
                lang = _get_lang_from_request(request, kwargs)
                activate(lang)
                cache_key = _make_cache_key(request, lang)

                response_data = cache.get(cache_key)
                if response_data is not None:
                    return response_data

                response_data = func(request, *args, **kwargs)
                cache.set(cache_key, response_data, timeout)
                return response_data

            return sync_wrapper

    return decorator

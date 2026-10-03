from http import HTTPStatus

from django.db.utils import IntegrityError
from django.http import HttpRequest
from django.utils.translation import activate
from django.utils.translation import gettext as _
from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate, PageNumberPagination

from apps.commons.decorators import cache_page_ninja
from apps.commons.exceptions import logger
from apps.filters import EventFilterSchema
from apps.models import Category, Event, Wishlist
from apps.schema import MessageSchema, CategorySchema, EventSchema, WishlistSchema

router = Router()


@router.get("/categories/", response=list[CategorySchema], auth=None)
@cache_page_ninja(timeout=60 * 5)
@paginate(PageNumberPagination, page=1, page_size=20)
async def get_all_categories(request: HttpRequest, lang: str = "uz"):
    activate(lang)
    return Category.objects.prefetch_related("translations")


@router.get("/events/", response=list[EventSchema], auth=None)
@cache_page_ninja(timeout=60 * 5)
@paginate(PageNumberPagination, page=1, page_size=20)
async def get_all_events(request: HttpRequest, filters: Query[EventFilterSchema], lang: str = "uz"):
    activate(lang)
    prefetch_related = [
        "translations", "category__translations", "place__translations", "tickets", "tickets__translations"
    ]
    events_obj: Event = Event.objects.select_related("place", "category").prefetch_related(*prefetch_related).distinct()
    events = filters.filter(events_obj)
    return events


@router.get("/event/{pk}/", response=EventSchema, auth=None)
async def get_one_event(request: HttpRequest, pk: int, lang: str = "uz"):
    activate(lang)
    prefetch_related = [
        "translations", "category__translations", "place__translations", "tickets", "tickets__translations"
    ]
    event: Event | None = await (
        Event.objects.select_related("place", "category").prefetch_related(*prefetch_related).filter(pk=pk).afirst()
    )
    if not event:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Event not found"))
    return event


@router.post("/wishlist/", response={HTTPStatus.CREATED: MessageSchema, HTTPStatus.NO_CONTENT: None})
async def create_or_delete_wishlist(request: HttpRequest, payload: WishlistSchema, lang: str = "uz"):
    activate(lang)
    user = request.auth
    event_id = payload.event_id
    event: bool = await Event.objects.filter(pk=event_id).aexists()
    wishlist_delete_count, __ = await Wishlist.objects.filter(event_id=event_id, user=user).adelete()
    if not event:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Event not found"))
    if wishlist_delete_count > 0:
        return HTTPStatus.NO_CONTENT, None
    try:
        await Wishlist.objects.acreate(user=user, event_id=event_id)
    except IntegrityError as e:
        logger.error(e)
        raise HttpError(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, message=_("Something went wrong"))
    return HTTPStatus.CREATED, MessageSchema(status=True, message=_("Wishlist is created"))


@router.get("/wishlist/", response=list[EventSchema])
@paginate(PageNumberPagination, page=1, page_size=20)
async def get_wishlist_events(request: HttpRequest, filters: Query[EventFilterSchema], lang: str = "uz"):
    activate(lang)
    events_obj = Event.objects.filter(
        wishlists__user=request.auth
    ).select_related(
        "place",
        "category"
    ).prefetch_related(
        "translations",
        "category__translations",
        "place__translations",
        "tickets",
        "tickets__translations"
    ).distinct()
    events = filters.filter(events_obj)
    return events

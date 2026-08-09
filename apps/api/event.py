from http import HTTPStatus

from django.http import HttpRequest
from django.utils.translation import activate
from django.utils.translation import gettext_lazy as _
from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate, PageNumberPagination

from apps.filters import EventFilterSchema
from apps.models import Category, Event
from apps.schema.event import CategorySchema, EventSchema

router = Router()


@router.get("/categories/", response=list[CategorySchema], auth=None)
@paginate(PageNumberPagination, page=1, page_size=20)
async def get_categories(request: HttpRequest, lang: str = "uz"):
    activate(lang)
    return Category.objects.prefetch_related("translations").all()


@router.get("/events/", response=list[EventSchema], auth=None)
@paginate(PageNumberPagination, page=1, page_size=20)
async def get_events(request: HttpRequest, filters: EventFilterSchema = Query(), lang: str = "uz"):
    activate(lang)
    prefetch_related = [
        "translations", "category__translations", "place__translations", "tickets", "tickets__translations"
    ]
    events_obj = (
        Event.objects
        .select_related("place", "category")
        .prefetch_related(prefetch_related)
    )
    events = filters.filter(events_obj)
    return events


@router.get("/event/{pk}/", response=EventSchema, auth=None)
async def get_event(request: HttpRequest, pk: int, lang: str = "uz"):
    activate(lang)
    prefetch_related = [
        "translations", "category__translations", "place__translations", "tickets", "tickets__translations"
    ]
    event = await (
        Event.objects.select_related("place", "category").prefetch_related(*prefetch_related).filter(pk=pk).afirst()
    )
    if not event:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Event not found"))
    return event

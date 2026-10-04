from urllib.request import Request

from asgiref.sync import sync_to_async
from django.utils.translation.trans_real import activate
from ninja import Router

from apps.commons.decorators import cache_page_ninja
from apps.models import SalesOutlets, Question
from apps.schema import SalesOutletsSchema, QuestionsSchema

router = Router()


@router.get("/salet/outlets/", response=list[SalesOutletsSchema], auth=None)
@cache_page_ninja(60 * 10)
async def get_sales_outlets(request: Request, lang: str = "uz"):
    activate(lang)
    sales_outlets = SalesOutlets.objects.select_related("place").prefetch_related("place__translations")
    return sales_outlets


@router.get("/questions/", response=list[QuestionsSchema], auth=None)
async def get_questions(request: Request):
    questions = Question.objects.filter(is_visible=True)
    return await sync_to_async(list)(questions)

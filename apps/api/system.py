from urllib.request import Request

from django.utils.translation.trans_real import activate
from ninja import Router

from apps.models import SalesOutlets, Questions
from apps.schema.system import SalesOutletsSchema, QuestionsSchema

router = Router()


@router.get("/salet/outlets/", response=list[SalesOutletsSchema], auth=None)
async def get_sales_outlets(request: Request, lang: str = "uz"):
    activate(lang)
    sales_outlets = [
        sales async for sales in
        SalesOutlets.objects.select_related("place").prefetch_related("place__translations").all()
    ]
    return sales_outlets


@router.get("/questions/", response=list[QuestionsSchema], auth=None)
async def get_questions(request: Request):
    questions = [question async for question in Questions.objects.filter(is_visible=True).all()]
    return questions

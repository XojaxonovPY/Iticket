from http import HTTPStatus

from asgiref.sync import sync_to_async
from django.contrib.auth.hashers import make_password
from django.http import HttpRequest
from django.utils.translation import activate
from django.utils.translation import gettext as _
from ninja import Router
from ninja.errors import HttpError

from apps.commons.decorators import cache_page_ninja
from apps.models import Country, Address
from apps.models import User
from apps.schema import AddressInUpSchema, MessageSchema, PasswordSchema
from apps.schema import UserOutSchema, UserInSchema, CountrySchema, AddressOutSchema, AddressInSchema

router = Router()


@router.get("/profile/", response=UserOutSchema)
async def get_user(request: HttpRequest):
    user = request.auth
    return user


@router.patch("/profile/", response=UserOutSchema)
async def update_user(request: HttpRequest, payload: UserInSchema):
    user: User = request.auth
    update_count = await User.objects.filter(pk=user.pk).aupdate(**payload.model_dump(exclude_unset=True))
    if not update_count:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("User not found"))
    for attr, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, attr, value)

    return user


@router.put("/update/password/", response=MessageSchema)
async def update_password(request: HttpRequest, payload: PasswordSchema):
    user: User = request.auth
    if not await user.acheck_password(payload.old_password):
        raise HttpError(status_code=HTTPStatus.BAD_REQUEST, message=_("Password not match"))
    hash_password = await sync_to_async(make_password)(payload.new_password)
    await User.objects.filter(pk=user.pk).aupdate(password=hash_password)
    return {"message": _("Password is successfully updated")}


@router.get("/country/", response=list[CountrySchema], auth=None)
@cache_page_ninja(60 * 7)
async def get_country(request: HttpRequest, lang: str = "uz"):
    activate(lang)
    countries = [country async for country in Country.objects.prefetch_related("translations").all()]
    return countries


@router.post("/address/", response={HTTPStatus.CREATED: AddressOutSchema})
async def create_address(request: HttpRequest, payload: AddressInSchema):
    address = await Address.objects.acreate(**payload.dict(), user=request.auth)
    return HTTPStatus.CREATED, address


@router.get("/address/", response=list[AddressOutSchema])
async def get_address(request: HttpRequest):
    addresses = []
    filter_ = {"user": request.auth}
    async for address in Address.objects.select_related("user").select_related("country").filter(**filter_).all():
        addresses.append(address)
    return addresses


@router.patch("/address/{pk}", response=AddressOutSchema)
async def update_address(request: HttpRequest, pk: int, payload: AddressInUpSchema):
    address: Address | None = await Address.objects.filter(id=pk, user=request.auth).afirst()
    if not address:
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Address not found"))
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(address, key, value)
    await address.asave()
    return address


@router.delete("/address/{pk}", response={HTTPStatus.NO_CONTENT: None})
async def delete_address(request: HttpRequest, pk: int):
    address_qs = Address.objects.filter(id=pk, user=request.auth)
    if not await address_qs.aexists():
        raise HttpError(status_code=HTTPStatus.NOT_FOUND, message=_("Address not found"))
    await address_qs.adelete()
    return HTTPStatus.NO_CONTENT, None

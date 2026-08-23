from ninja import NinjaAPI

from apps.api.auth import router as auth_router
from apps.api.cards import router as card_router
from apps.api.event import router as event_router
from apps.api.orders import router as order_router
from apps.api.system import router as system_router
from apps.api.transactions import router as transactions_router
from apps.api.user import router as user_router
from apps.commons.exceptions import exception_handler
from apps.commons.tokens import JWTAuth

api = NinjaAPI(
    title="iTicket API",
    version="1.0.0",
    description="iTicket loyihasi uchun REST API",
    auth=JWTAuth(),
)

api.add_router("", auth_router, tags=["authentication"])
api.add_router("", user_router, tags=["user"])
api.add_router("", system_router, tags=["system"])
api.add_router("", event_router, tags=["dashboard"])
api.add_router("", card_router, tags=["card"])
api.add_router("", order_router, tags=["order"])
api.add_router("", transactions_router, tags=["transactions"])

exception_handler(api)

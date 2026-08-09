import logging

from django.http.request import HttpRequest
from ninja import NinjaAPI

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())
logger.propagate = False


class TokenError(Exception):
    def __init__(self, message: str, code: int) -> None:
        self.message = message
        self.code = code
        super().__init__(message)


def exception_handler(api: NinjaAPI):
    @api.exception_handler(TokenError)
    def token_exception_handler(request: HttpRequest, exc: TokenError) -> NinjaAPI:
        return api.create_response(request, {"message": exc.message}, status=exc.code)

import logging
from http import HTTPStatus

from django.http.request import HttpRequest
from django.utils.translation import gettext as _
from ninja import NinjaAPI
from ninja.errors import HttpError, ValidationError

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

    @api.exception_handler(HttpError)
    def on_http_error(request, exc: HttpError):
        return api.create_response(
            request,
            {
                "status": False,
                "status_code": exc.status_code,
                "message": str(exc.message),
            },
            status=exc.status_code,
        )

    @api.exception_handler(ValidationError)
    def on_validation_error(request, exc: ValidationError):
        formatted_errors = {}
        for err in exc.errors:
            field = ".".join(
                str(loc) for loc in err.get("loc", []) if loc not in ("body", "payload")) or "non_field_errors"
            msg = err.get("msg", "")

            if field not in formatted_errors:
                formatted_errors[field] = []
            formatted_errors[field].append(msg)

        return api.create_response(
            request,
            {
                "status": False,
                "status_code": HTTPStatus.UNPROCESSABLE_ENTITY,
                "message": _("Invalid input data"),
                "errors": formatted_errors,
            },
            status=HTTPStatus.UNPROCESSABLE_ENTITY,
        )

    @api.exception_handler(Exception)
    def on_unhandled_error(request, exc: Exception):
        logger.exception(exc)
        return api.create_response(
            request,
            {
                "status": False,
                "status_code": HTTPStatus.INTERNAL_SERVER_ERROR,
                "message": _("An internal server error occurred."),
                "errors": None,
            },
            status=HTTPStatus.INTERNAL_SERVER_ERROR,
        )

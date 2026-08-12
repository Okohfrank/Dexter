"""Custom exception hierarchy and FastAPI exception handlers."""

from typing import Any
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

class DexterError(Exception):
    """Base exception for all Dexter errors."""
    def __init__(
        self,
        detail: str = "An unexpected error occurred",
        status_code: int = 500,
        headers: dict[str, Any] | None = None
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code
        self.headers = headers


class DexterAuthError(DexterError):
    """Authentication errors (401)."""
    def __init__(self, detail: str = "Authentication failed") -> None:
        super().__init__(detail=detail, status_code=401, headers={"WWW-Authenticate": "Bearer"})


class DexterForbiddenError(DexterError):
    """Authorization errors (403)."""
    def __init__(self, detail: str = "Permission denied") -> None:
        super().__init__(detail=detail, status_code=403)


class DexterNotFoundError(DexterError):
    """Resource not found errors (404)."""
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(detail=detail, status_code=404)


class DexterConflictError(DexterError):
    """Resource conflict errors (409)."""
    def __init__(self, detail: str = "Resource conflict") -> None:
        super().__init__(detail=detail, status_code=409)


class DexterValidationError(DexterError):
    """Validation errors (422)."""
    def __init__(self, detail: str = "Validation failed") -> None:
        super().__init__(detail=detail, status_code=422)


class DexterRateLimitError(DexterError):
    """Rate limiting errors (429)."""
    def __init__(self, detail: str = "Too many requests") -> None:
        super().__init__(detail=detail, status_code=429)


class DexterIntegrationError(DexterError):
    """Third-party integration errors (502)."""
    def __init__(self, detail: str = "Integration failure") -> None:
        super().__init__(detail=detail, status_code=502)


class DexterMemoryError(DexterError):
    """Memory engine errors (500)."""
    def __init__(self, detail: str = "Memory engine failure") -> None:
        super().__init__(detail=detail, status_code=500)


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers on the FastAPI application."""

    @app.exception_handler(DexterError)
    async def dexter_error_handler(request: Request, exc: DexterError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers
        )

__all__ = [
    "DexterError",
    "DexterAuthError",
    "DexterForbiddenError",
    "DexterNotFoundError",
    "DexterConflictError",
    "DexterValidationError",
    "DexterRateLimitError",
    "DexterIntegrationError",
    "DexterMemoryError",
    "register_exception_handlers"
]

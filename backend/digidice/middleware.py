from typing import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.utils.cache import patch_vary_headers

class CorsMiddleware:
    """Middleware that sets CORS headers."""
    #: The allowed HTTP request methods.
    allowed_methods = ['OPTIONS', 'GET', 'POST']

    #: The allowed HTTP request headers.
    allowed_headers = [
        'Accept',
        'Authorization',
        'Content-Type',
        'User-Agent',
        'X-CsrfToken',
        'X-Requested-With'
    ]

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response
        self.allowed_origins = settings.CSRF_TRUSTED_ORIGINS

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        if not request.path.startswith('/api'):
            return response
        patch_vary_headers(response, ('Origin',))
        response.headers['Access-Control-Allow-Origin'] = ', '.join(self.allowed_origins)
        response.headers['Access-Control-Allow-Methods'] = ', '.join(self.allowed_methods)
        response.headers['Access-Control-Allow-Headers'] = ', '.join(self.allowed_headers)
        return response


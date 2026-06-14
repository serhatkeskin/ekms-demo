import os
import time
import hmac
import hashlib
import base64
from urllib.parse import urlencode
from django.conf import settings

SECRET_KEY = None  # lazy-loaded


def _get_secret_key():
    global SECRET_KEY
    if SECRET_KEY is None:
        SECRET_KEY = settings.SECRET_KEY.encode()
    return SECRET_KEY


def generate_presigned_uri(file_uri: str, expiry_seconds: int = 600, authanticator_endpoint="/api/protected-media"):
    expiry = int(time.time()) + expiry_seconds
    string_to_sign = f"{file_uri}:{expiry}"
    signature = base64.urlsafe_b64encode(
        hmac.new(_get_secret_key(), string_to_sign.encode(), hashlib.sha256).digest()
    ).decode()
    return f"{authanticator_endpoint}/?{urlencode({'file': file_uri, 'expiry': expiry, 'signature': signature})}"


def generate_presigned_full_url(file_uri: str, expiry_seconds: int = 600, base_url: str = None):
    presigned_relative_uri = generate_presigned_uri(file_uri, expiry_seconds)
    if base_url is None:
        base_url = getattr(settings, "SITE_BASE_URL", "http://localhost")
    return f"{base_url}{presigned_relative_uri}"

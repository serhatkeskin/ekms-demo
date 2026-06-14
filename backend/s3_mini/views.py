import os
import time
import hmac
import hashlib
import base64
from django.http import HttpResponse, HttpResponseForbidden
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .utils import generate_presigned_full_url


def _get_secret_key():
    return settings.SECRET_KEY.encode()


class ProtectedMediaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        file_uri = request.query_params.get("file")
        expiry = request.query_params.get("expiry")
        signature = request.query_params.get("signature")

        if not file_uri or not expiry or not signature:
            return HttpResponseForbidden("Invalid request")

        try:
            expiry = int(expiry)
        except ValueError:
            return HttpResponseForbidden("Invalid expiry")

        if time.time() > expiry:
            return HttpResponseForbidden("Link expired")

        string_to_sign = f"{file_uri}:{expiry}"
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(_get_secret_key(), string_to_sign.encode(), hashlib.sha256).digest()
        ).decode()

        if not hmac.compare_digest(expected_sig, signature):
            return HttpResponseForbidden("Invalid signature")

        path, file_name = os.path.split(file_uri)
        nginx_uri = f"{settings.MEDIA_URL}{file_uri}"

        response = HttpResponse()
        response["Content-Type"] = ""
        response["Content-Disposition"] = f"attachment; filename={file_name}"
        response["X-Accel-Redirect"] = nginx_uri
        return response


class MediaPresignView(APIView):
    def get(self, request):
        file_path = request.query_params.get("file")
        if not file_path:
            return Response({"error": "file param required"}, status=400)
        url = generate_presigned_full_url(file_path, expiry_seconds=600)
        return Response({"url": url})

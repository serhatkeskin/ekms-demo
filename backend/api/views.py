from datetime import datetime, timedelta, timezone
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import DemoToken


class HealthView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        return JsonResponse({"status": "ok"})


class AdminTokenListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        tokens = DemoToken.objects.all()
        data = [
            {
                "id": str(t.token),
                "label": t.label,
                "is_active": t.is_active,
                "expires_at": t.expires_at.isoformat(),
                "created_at": t.created_at.isoformat(),
            }
            for t in tokens
        ]
        return Response(data)

    def post(self, request):
        label = request.data.get("label", "unnamed")
        days = int(request.data.get("days", 30))
        expires_at = datetime.now(tz=timezone.utc) + timedelta(days=days)
        tok = DemoToken.objects.create(label=label, expires_at=expires_at)
        return Response(
            {
                "id": str(tok.token),
                "label": tok.label,
                "is_active": tok.is_active,
                "expires_at": tok.expires_at.isoformat(),
            },
            status=201,
        )


class AdminTokenDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, token_id):
        try:
            tok = DemoToken.objects.get(token=token_id)
            tok.is_active = False
            tok.save()
            return Response({"detail": "Token revoked"})
        except DemoToken.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

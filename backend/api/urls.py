from django.urls import path
from .views import HealthView, AdminTokenListCreateView, AdminTokenDetailView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("admin/tokens/", AdminTokenListCreateView.as_view(), name="admin-tokens"),
    path("admin/tokens/<uuid:token_id>/", AdminTokenDetailView.as_view(), name="admin-token-detail"),
]

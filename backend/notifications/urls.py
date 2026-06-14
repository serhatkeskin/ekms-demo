from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, MentionViewSet

router = DefaultRouter()
router.register(r"", NotificationViewSet, basename="notification")
router.register(r"mentions", MentionViewSet, basename="mentions")

urlpatterns = [path("", include(router.urls))]

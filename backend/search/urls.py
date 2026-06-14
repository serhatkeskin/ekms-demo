from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import SearchViewSet, UserSearchViewSet

router = DefaultRouter()
router.register(r"", SearchViewSet, basename="search")
router.register(r"user", UserSearchViewSet, basename="user-search")

urlpatterns = [path("", include(router.urls))]

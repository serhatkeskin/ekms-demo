from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import (
    ListUserView,
    RegisterUserView,
    UserProfileViewSet,
    PermissionViewSet,
    AdminChangeUserPasswordView,
)

router = DefaultRouter()
router.register(r"listusers", ListUserView)
router.register(r"profile", UserProfileViewSet, basename="profile")
router.register(r"permissions", PermissionViewSet, basename="permissions")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterUserView.as_view(), name="users-register"),
    path(
        "users/<int:user_id>/change-password/",
        AdminChangeUserPasswordView.as_view(),
        name="admin-change-user-password",
    ),
]

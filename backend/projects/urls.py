from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectRoleViewSet, ProjectMembershipViewSet

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"roles", ProjectRoleViewSet, basename="role")
router.register(r"memberships", ProjectMembershipViewSet, basename="membership")

urlpatterns = [path("", include(router.urls))]

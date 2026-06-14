from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response

from projects.permissions import ProjectPermission
from projects.models import Project, ProjectRole, ProjectMembership
from projects.serializers import (
    ProjectSerializer,
    ProjectRoleSerializer,
    ProjectMembershipSerializer,
)

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, ProjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.filter(is_active=True)

        if not user.is_superuser:
            qs = qs.filter(memberships__user=user).distinct()

        name = self.request.query_params.get("name")
        if name:
            qs = qs.filter(name__icontains=name)

        status_filter = self.request.query_params.get("status")
        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "archived":
            qs = qs.filter(is_active=False)

        return qs

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        role, _ = ProjectRole.objects.get_or_create(
            name="manager",
            defaults={"can_view": True, "can_create": True, "can_edit": True, "can_delete": True, "is_supermanager": True},
        )
        ProjectMembership.objects.create(user=self.request.user, project=project, role=role)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectRoleViewSet(viewsets.ModelViewSet):
    queryset = ProjectRole.objects.all()
    serializer_class = ProjectRoleSerializer
    permission_classes = [permissions.IsAdminUser]


class ProjectMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            qs = ProjectMembership.objects.filter(is_active=True, project__is_active=True)
        else:
            managed_projects = Project.objects.filter(
                is_active=True,
                memberships__user=user,
                memberships__role__name__iexact="manager",
            )
            qs = ProjectMembership.objects.filter(
                is_active=True, project__is_active=True, project__in=managed_projects
            )

        project = self.request.query_params.get("project")
        if project:
            qs = qs.filter(project__id=project)

        username = self.request.query_params.get("user")
        if username == "current":
            qs = qs.filter(user__username=user.username)
        elif username:
            qs = qs.filter(user__username=username)

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

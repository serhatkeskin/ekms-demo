from rest_framework import permissions
from django.contrib.auth import get_user_model
from projects.models import ProjectMembership

User = get_user_model()


class ProjectPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        if view.action in ["list", "retrieve"]:
            return request.user.is_authenticated
        if view.action == "create":
            return request.user.is_staff or request.user.is_superuser
        if view.action in ["update", "partial_update", "destroy"]:
            return request.user.is_authenticated
        return False

    def has_object_permission(self, request, view, obj):
        perms = self.get_user_permissions_for_project(obj, request.user)
        if view.action in ["retrieve", "list"]:
            return perms["can_view"]
        if view.action in ["update", "partial_update"]:
            return perms["can_edit"]
        if view.action == "destroy":
            return perms["can_delete"]
        return False

    def get_user_permissions_for_project(self, project, user):
        perms = {
            "is_superuser": False, "is_staff": False,
            "can_view": False, "can_create": False,
            "can_edit": False, "can_delete": False,
            "is_project_manager": False, "is_project_member": False,
        }

        if user.is_superuser or user.is_staff:
            return {**perms, "is_superuser": user.is_superuser, "is_staff": True,
                    "can_view": True, "can_create": True, "can_edit": True, "can_delete": True}

        if not user.is_authenticated:
            return perms

        try:
            membership = ProjectMembership.objects.get(user=user, project=project)
            role = membership.role
            perms["is_project_member"] = True
            perms["can_view"] = role.can_view
            perms["can_create"] = role.can_create
            perms["can_edit"] = role.can_edit
            perms["can_delete"] = role.can_delete
            perms["is_project_manager"] = role.is_supermanager
        except ProjectMembership.DoesNotExist:
            pass

        return perms

    def is_project_manager(self, user, project):
        if user.is_superuser or user.is_staff:
            return True
        try:
            membership = ProjectMembership.objects.get(user=user, project=project)
            return membership.role.is_supermanager
        except ProjectMembership.DoesNotExist:
            return False

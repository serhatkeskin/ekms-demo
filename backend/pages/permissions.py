from rest_framework import permissions
from django.contrib.auth import get_user_model
from pages.models import Page
from projects.permissions import ProjectPermission
from common.utilities.allow_access import allow_access_to_admins
from common.models import StatusBase

User = get_user_model()


class PagePermissionClass(permissions.BasePermission):
    def has_permission(self, request, view):
        if allow_access_to_admins(request.user):
            return True
        if view.action in ["list", "retrieve"]:
            return request.user.is_authenticated
        if view.action in ["create"]:
            return request.user.is_authenticated
        if view.action in ["update", "partial_update", "reorder", "destroy"]:
            return request.user.is_authenticated
        return True  # allow custom actions (clone, history, snapshots, etc.)

    def has_object_permission(self, request, view, obj):
        if allow_access_to_admins(request.user):
            return True
        user_permissions = self.get_user_permissions_for_page(obj, request.user)
        if view.action in ["retrieve", "list"]:
            return user_permissions["can_view"]
        if view.action in ["update", "partial_update", "reorder"]:
            return user_permissions["can_edit"]
        if view.action == "destroy":
            return user_permissions["can_delete"]
        return True  # custom actions (clone, history, etc.)

    def get_user_permissions_for_page(self, page, user):
        project_permission = ProjectPermission()
        perms = project_permission.get_user_permissions_for_project(page.project, user)
        if page.status == Page.PUBLIC:
            perms["can_view"] = True
        return perms


class BlockPermissionClass(permissions.BasePermission):
    def has_permission(self, request, view):
        if allow_access_to_admins(request.user):
            return True
        if view.action in ["list", "retrieve"]:
            return request.user.is_authenticated
        if view.action in ["create", "update", "partial_update", "reorder", "destroy"]:
            return request.user.is_authenticated
        return False

    def has_object_permission(self, request, view, obj):
        if allow_access_to_admins(request.user):
            return True
        if hasattr(obj, "page") and obj.page and hasattr(obj.page, "project"):
            page_permission = PagePermissionClass()
            user_permissions = page_permission.get_user_permissions_for_page(obj.page, request.user)
            if view.action in ["retrieve", "list"]:
                return user_permissions["can_view"]
            if view.action in ["update", "partial_update", "reorder"]:
                return user_permissions["can_edit"]
            if view.action == "destroy":
                return user_permissions["can_delete"]
        return False


class CommentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        if obj.created_by == request.user:
            return True
        if request.method == "DELETE" and hasattr(obj, "page") and obj.page:
            project = obj.page.project
            if project:
                project_permission = ProjectPermission()
                return project_permission.is_project_manager(request.user, project)
        return False

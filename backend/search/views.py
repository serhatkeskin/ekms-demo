from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from pages.models import Page, Block
from projects.models import Project
from s3_mini.utils import generate_presigned_full_url
from .serializers import SearchResultSerializer

User = get_user_model()


class SearchViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        query = request.query_params.get("q", "")
        if not query or len(query.strip()) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters long"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        types = request.query_params.getlist("types", ["page", "content_block", "project"])
        project_id = request.query_params.get("project_id")
        limit = int(request.query_params.get("limit", 20))
        results = []

        if "page" in types:
            results.extend(self.search_pages(query, project_id, limit))
        if "block" in types:
            results.extend(self.search_blocks(query, project_id, limit))
        if "project" in types:
            results.extend(self.search_projects(query, limit))

        results = results[:limit]
        serializer = SearchResultSerializer(results, many=True)
        return Response(serializer.data)

    def search_pages(self, query, project_id=None, limit=20):
        queryset = Page.objects.filter(
            Q(title__icontains=query) | Q(properties__icontains=query), is_active=True
        )
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        results = []
        for page in queryset[:limit]:
            results.append({
                "id": page.id,
                "type": "page",
                "title": page.title,
                "slug": page.slug,
                "status": page.status,
                "project_id": page.project_id,
                "project_title": page.project.name if page.project else None,
            })
        return results

    def search_blocks(self, query, project_id=None, limit=20):
        queryset = Block.objects.filter(
            Q(content__icontains=query), is_active=True
        )
        if project_id:
            queryset = queryset.filter(page__project_id=project_id)
        results = []
        for block in queryset[:limit]:
            text_content = ""
            if "content" in block.content and isinstance(block.content["content"], list):
                try:
                    text_content = block.content["content"][0]["text"]
                except (IndexError, KeyError):
                    pass
            results.append({
                "id": block.id,
                "block_id": block.block_id,
                "type": "block",
                "content_preview": self.extract_preview(text_content, query, 150),
                "page_id": block.page_id,
                "page_slug": block.page.slug if block.page else None,
                "page_title": block.page.title if block.page else None,
                "block_type": block.block_type,
            })
        return results

    def search_projects(self, query, limit=20):
        queryset = Project.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query), is_active=True
        )[:limit]
        results = []
        for project in queryset:
            results.append({
                "id": project.id,
                "type": "project",
                "title": project.name,
                "description": self.extract_preview(project.description or "", query, 150),
            })
        return results

    def extract_preview(self, text, query, length=150):
        if not text:
            return ""
        index = text.lower().find(query.lower())
        if index == -1:
            return text[:length] + "..." if len(text) > length else text
        start = max(0, index - 50)
        end = min(len(text), index + len(query) + 50)
        if start > 0:
            space_before = text.rfind(" ", 0, start)
            if space_before != -1:
                start = space_before + 1
        if end < len(text):
            space_after = text.find(" ", end)
            if space_after != -1:
                end = space_after
        return ("..." if start > 0 else "") + text[start:end] + ("..." if end < len(text) else "")


class UserSearchViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"])
    def search(self, request):
        query = request.query_params.get("q", "").strip()
        if not query or len(query) < 2:
            return Response([])

        users = User.objects.filter(
            Q(username__icontains=query)
            | Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
        ).distinct()[:10]

        results = []
        for user in users:
            avatar_url = None
            profile = getattr(user, "profile", None)
            if profile and hasattr(profile, "avatar") and profile.avatar:
                try:
                    avatar_url = generate_presigned_full_url(profile.avatar.name)
                except Exception:
                    pass
            results.append({
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar": avatar_url,
                "full_name": f"{user.first_name} {user.last_name}".strip() or None,
            })
        return Response(results)

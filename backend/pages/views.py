import os
import uuid
import copy
import shutil
import logging
from django.shortcuts import get_object_or_404
from django.db import transaction, models
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from pages.permissions import PagePermissionClass, BlockPermissionClass
from pages.models import (
    Page, Block, PagePermission, PageHistory, Comment, MediaContent,
    Thread, ThreadComment, ThreadCommentReaction,
)
from pages.serializers import (
    PageListSerializer, PageDetailSerializer, PageFullSerializer,
    BlockSerializer, PageHistorySerializer,
    CommentListSerializer, CommentDetailSerializer,
    MediaContentListSerializer,
    ThreadSerializer, ThreadCreateSerializer,
    ThreadCommentSerializer, ThreadCommentCreateSerializer,
)
from common.models import StatusBase
from common.mixins import SafeDestroyModelMixin, SafeDestroyWithFileMixin
from s3_mini.utils import generate_presigned_full_url

logger = logging.getLogger(__name__)
User = get_user_model()


class PageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, PagePermissionClass]
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            queryset = Page.objects.filter(is_active=True)
        else:
            queryset = (
                Page.objects.filter(is_active=True)
                .filter(Q(project__memberships__user=user) | Q(status=Page.PUBLIC))
                .distinct()
            )

        project_slug = self.request.query_params.get("project")
        if project_slug:
            queryset = queryset.filter(project__slug=project_slug)

        parent_id = self.request.query_params.get("parent")
        if parent_id:
            if parent_id == "root":
                queryset = queryset.filter(parent=None)
            else:
                queryset = queryset.filter(parent_id=parent_id)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PageFullSerializer
        return PageListSerializer

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user,
            last_edited_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user, last_edited_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.updated_by = request.user
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def clone(self, request, slug=None):
        original_page = self.get_object()
        new_page = Page.objects.create(
            title=f"Copy of {original_page.title}",
            icon=original_page.icon,
            cover_image=original_page.cover_image,
            project=original_page.project,
            parent=original_page.parent,
            status=Page.DRAFT,
            created_by=request.user,
            updated_by=request.user,
            last_edited_by=request.user,
            properties=original_page.properties,
        )
        for block in original_page.blocks.filter(is_active=True):
            Block.objects.create(
                page=new_page,
                block_id=block.block_id,
                block_type=block.block_type,
                content=block.content,
                order=block.order,
                created_by=request.user,
                updated_by=request.user,
            )
        serializer = self.get_serializer(new_page)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def history(self, request, slug=None):
        page = self.get_object()
        history = page.history.all().order_by("-created_at")
        serializer = PageHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def create_snapshot(self, request, slug=None):
        try:
            page = self.get_object()
            snapshot_name = request.data.get("name", "")
            blocks = Block.objects.filter(page=page, is_active=True).order_by("order")
            snapshot = {
                "page": {
                    "id": page.id,
                    "title": page.title,
                    "slug": page.slug,
                    "status": page.status,
                    "icon": page.icon,
                    "created_at": page.created_at.isoformat(),
                    "updated_at": page.updated_at.isoformat(),
                },
                "blocks": [],
            }
            if page.cover_image:
                try:
                    original_image_path = page.cover_image.path
                    filename = os.path.basename(original_image_path)
                    snapshot_filename = f"snapshot_{page.id}_{int(timezone.now().timestamp())}_{filename}"
                    snapshot_dir = os.path.join(settings.MEDIA_ROOT, "snapshots", str(page.id))
                    os.makedirs(snapshot_dir, exist_ok=True)
                    shutil.copy2(original_image_path, os.path.join(snapshot_dir, snapshot_filename))
                    snapshot["page"]["cover_image"] = os.path.join("snapshots", str(page.id), snapshot_filename)
                except Exception:
                    snapshot["page"]["cover_image"] = str(page.cover_image)

            for block in blocks:
                block_data = {
                    "id": block.id,
                    "block_type": block.block_type,
                    "order": block.order,
                    "content": copy.deepcopy(block.content),
                }
                snapshot["blocks"].append(block_data)

            history = PageHistory.objects.create(
                page=page,
                content_snapshot=snapshot,
                created_by=request.user,
                name=snapshot_name,
            )
            return Response(
                {"snapshot_id": history.id, "created_at": history.created_at, "name": history.name},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error creating snapshot: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["post"])
    def restore_snapshot(self, request, slug=None):
        try:
            page = self.get_object()
            snapshot_id = request.data.get("snapshot_id")
            if not snapshot_id:
                return Response({"detail": "Snapshot ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                history = PageHistory.objects.get(id=snapshot_id, page=page)
            except PageHistory.DoesNotExist:
                return Response({"detail": "Snapshot not found"}, status=status.HTTP_404_NOT_FOUND)

            snapshot = history.content_snapshot
            with transaction.atomic():
                page_data = snapshot.get("page", {})
                page.title = page_data.get("title", page.title)
                page.icon = page_data.get("icon", page.icon)
                if "cover_image" in page_data and page_data["cover_image"]:
                    page.cover_image = page_data["cover_image"]
                page.save()

                Block.objects.filter(page=page).delete()
                for idx, block_data in enumerate(snapshot.get("blocks", [])):
                    content = copy.deepcopy(block_data.get("content", {}))
                    Block.objects.create(
                        page=page,
                        block_type=block_data.get("block_type"),
                        content=content,
                        order=block_data.get("order", idx),
                    )
                PageHistory.objects.create(
                    page=page,
                    content_snapshot={"message": "Restored from snapshot", "original_snapshot_id": snapshot_id},
                    created_by=request.user,
                    event_type="restore",
                )
            return Response({"message": "Page restored successfully", "snapshot_id": snapshot_id})
        except Exception as e:
            logger.error(f"Error restoring snapshot: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["get"])
    def snapshots(self, request, slug=None):
        try:
            page = self.get_object()
            snapshots = PageHistory.objects.filter(
                page=page, event_type="snapshot", is_active=True
            ).order_by("-created_at")
            snapshots_data = [
                {
                    "id": s.id,
                    "created_at": s.created_at,
                    "created_by": s.created_by.username if s.created_by else "System",
                    "name": s.name or "",
                }
                for s in snapshots
            ]
            return Response({"snapshots": snapshots_data})
        except Exception as e:
            logger.error(f"Error fetching snapshots: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["put"])
    def update_snapshot(self, request, slug=None):
        try:
            page = self.get_object()
            snapshot_id = request.data.get("snapshot_id")
            name = request.data.get("name", "")
            if not snapshot_id:
                return Response({"detail": "Snapshot ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                history = PageHistory.objects.get(id=snapshot_id, page=page)
            except PageHistory.DoesNotExist:
                return Response({"detail": "Snapshot not found"}, status=status.HTTP_404_NOT_FOUND)
            history.name = name
            history.save()
            return Response({"snapshot_id": history.id, "name": history.name})
        except Exception as e:
            logger.error(f"Error updating snapshot: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["delete"])
    def delete_snapshot(self, request, slug=None):
        try:
            page = self.get_object()
            snapshot_id = request.data.get("snapshot_id")
            if not snapshot_id:
                return Response({"detail": "Snapshot ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                history = PageHistory.objects.get(id=snapshot_id, page=page)
            except PageHistory.DoesNotExist:
                return Response({"detail": "Snapshot not found"}, status=status.HTTP_404_NOT_FOUND)
            if request.user.is_superuser or history.created_by == request.user:
                history.is_active = False
                history.updated_by = request.user
                history.save()
                return Response({"snapshot_id": history.id})
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Error deleting snapshot: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request):
        if "file" not in request.FILES:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]
        file_type = request.data.get("file_type", "file")
        directory = os.path.join(settings.MEDIA_ROOT, "private", "blocks")
        filename = f"{uuid.uuid4()}_{file.name}"
        file_path = os.path.join(directory, filename)
        file_uri = f"private/blocks/{filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "wb+") as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        presigned_url = generate_presigned_full_url(file_uri)
        return Response(
            {
                "presigned_url": presigned_url,
                "file_uri": file_uri,
                "file_path": file_path,
                "fileName": file.name,
                "fileType": file_type,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["delete"], url_path="delete")
    def delete_file(self, request):
        file_path = request.data.get("file_path")
        if not file_path:
            return Response({"detail": "File path is required"}, status=status.HTTP_400_BAD_REQUEST)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path.lstrip("/media/"))
        try:
            if os.path.exists(full_path):
                os.remove(full_path)
                return Response({"detail": "File deleted successfully"})
            return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlockViewSet(viewsets.ModelViewSet):
    serializer_class = BlockSerializer
    permission_classes = [permissions.IsAuthenticated, BlockPermissionClass]
    lookup_field = "block_id"

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            queryset = Block.objects.filter(is_active=True)
        else:
            queryset = Block.objects.filter(
                is_active=True, page__project__memberships__user=user
            )
        page_id = self.request.query_params.get("page")
        if page_id:
            queryset = queryset.filter(page_id=page_id)
        return queryset.order_by("order")

    def perform_create(self, serializer):
        page_id = serializer.validated_data.get("page").id
        if "order" not in serializer.validated_data:
            max_order = (
                Block.objects.filter(page_id=page_id).aggregate(models.Max("order"))["order__max"] or 0
            )
            serializer.save(order=max_order + 1, created_by=self.request.user, updated_by=self.request.user)
        else:
            serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        blocks_order = request.data.get("blocks_order", [])
        if not blocks_order:
            return Response({"detail": "No block order data provided"}, status=status.HTTP_400_BAD_REQUEST)
        for item in blocks_order:
            block_id = item.get("block_id")
            new_order = item.get("order")
            if block_id and new_order is not None:
                try:
                    block = Block.objects.get(block_id=block_id)
                    block.order = new_order
                    block.updated_by = request.user
                    block.save(update_fields=["order", "updated_by", "updated_at"])
                except Block.DoesNotExist:
                    pass
        return Response({"blocks_order": blocks_order})


class CommentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CommentDetailSerializer
        return CommentListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Comment.objects.filter(is_active=True)
        return (
            Comment.objects.filter(is_active=True)
            .filter(
                Q(page__project__memberships__user=user)
                | Q(page__project__status=StatusBase.PUBLIC)
            )
            .distinct()
        )

    @action(detail=False, methods=["get"], url_path=r"by-page/(?P<page_slug>[-\w]+)")
    def comments_by_page(self, request, page_slug=None):
        page = get_object_or_404(Page, slug=page_slug)
        filter_type = request.query_params.get("type")
        comments = self.get_queryset().filter(page=page)
        if filter_type == "page":
            comments = comments.filter(block__isnull=True)
        elif filter_type == "block":
            comments = comments.filter(block__isnull=False)
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path=r"by-block/(?P<block_id>[0-9]+)")
    def comments_by_block(self, request, block_id=None):
        block = get_object_or_404(Block, id=block_id)
        comments = self.get_queryset().filter(block=block)
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="replies")
    def get_replies(self, request, pk=None):
        comment = self.get_object()
        replies = comment.replies.filter(is_active=True)
        serializer = self.get_serializer(replies, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        page_slug = self.request.data.get("page_slug")
        block_id = self.request.data.get("block_id")
        if not page_slug:
            raise serializers.ValidationError({"page_slug": "Page slug is required."})
        page = get_object_or_404(Page, slug=page_slug)
        if block_id:
            block = get_object_or_404(Block, id=block_id)
            serializer.save(created_by=self.request.user, updated_by=self.request.user, page=page, block=block)
        else:
            serializer.save(created_by=self.request.user, updated_by=self.request.user, page=page)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.updated_by = request.user
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request):
        if "file" not in request.FILES:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        file = request.FILES["file"]
        file_type = request.data.get("file_type", "file")
        directory = "private/files"
        filename = f"{uuid.uuid4()}_{file.name}"
        file_path = os.path.join(directory, filename)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb+") as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        presigned_url = generate_presigned_full_url(file_path)
        return Response(
            {"url": presigned_url, "fileName": file.name, "fileType": file_type, "filePath": file_path}
        )

    @action(detail=False, methods=["delete"], url_path="delete")
    def delete_file(self, request):
        file_path = request.data.get("file_path")
        if not file_path:
            return Response({"detail": "File path is required"}, status=status.HTTP_400_BAD_REQUEST)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path.lstrip("/media/"))
        try:
            if os.path.exists(full_path):
                os.remove(full_path)
                return Response({"detail": "File deleted successfully"})
            return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MediaContentViewSet(viewsets.ModelViewSet):
    serializer_class = MediaContentListSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return MediaContent.objects.filter(is_active=True)
        return (
            MediaContent.objects.filter(is_active=True)
            .filter(Q(project__memberships__user=user) | Q(status=StatusBase.PUBLIC))
            .distinct()
        )

    @action(detail=False, methods=["get"], url_path=r"by-page/(?P<page_slug>[-\w]+)")
    def mediacontents_by_page(self, request, page_slug=None):
        page = get_object_or_404(Page, slug=page_slug)
        mediacontents = self.get_queryset().filter(page=page)
        serializer = self.get_serializer(mediacontents, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        page_slug = self.request.data.get("page_slug")
        if not page_slug:
            raise serializers.ValidationError({"page_slug": "Page slug is required."})
        page = get_object_or_404(Page, slug=page_slug)
        serializer.save(created_by=self.request.user, updated_by=self.request.user, page=page)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ThreadViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Thread.objects.filter(is_active=True)
        return Thread.objects.filter(
            is_active=True, page__project__memberships__user=user
        ).distinct()

    @action(detail=False, methods=["get"], url_path=r"by-page/(?P<page_slug>[-\w]+)")
    def threads_by_page(self, request, page_slug=None):
        page = get_object_or_404(Page, slug=page_slug)
        threads = self.get_queryset().filter(page=page)
        serializer = ThreadSerializer(threads, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = ThreadCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()
        return Response(ThreadSerializer(thread).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        thread = get_object_or_404(Thread, thread_id=pk, is_active=True)
        return Response(ThreadSerializer(thread).data)

    def destroy(self, request, pk=None):
        thread = get_object_or_404(Thread, thread_id=pk)
        thread.is_active = False
        thread.updated_by = request.user
        thread.save()
        return Response({"detail": "Thread deleted successfully"})

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request, pk=None):
        thread = get_object_or_404(Thread, thread_id=pk)
        thread.resolved = True
        thread.resolved_at = timezone.now()
        thread.resolved_by = request.user
        thread.updated_by = request.user
        thread.save()
        return Response(ThreadSerializer(thread).data)

    @action(detail=True, methods=["post"], url_path="unresolve")
    def unresolve(self, request, pk=None):
        thread = get_object_or_404(Thread, thread_id=pk)
        thread.resolved = False
        thread.resolved_at = None
        thread.resolved_by = None
        thread.updated_by = request.user
        thread.save()
        return Response(ThreadSerializer(thread).data)

    @action(detail=True, methods=["post"], url_path="comments")
    def add_comment(self, request, pk=None):
        thread = get_object_or_404(Thread, thread_id=pk)
        serializer = ThreadCommentCreateSerializer(
            data=request.data, context={"request": request, "thread": thread}
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(ThreadCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path=r"comments/(?P<comment_id>[-\w]+)")
    def update_comment(self, request, pk=None, comment_id=None):
        thread = get_object_or_404(Thread, thread_id=pk)
        comment = get_object_or_404(ThreadComment, thread=thread, comment_id=comment_id)
        if comment.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        comment.text = request.data.get("text", comment.text)
        comment.body = request.data.get("body", comment.body)
        comment.metadata = request.data.get("metadata", comment.metadata)
        comment.updated_by = request.user
        comment.save()
        return Response(ThreadCommentSerializer(comment).data)

    @action(detail=True, methods=["delete"], url_path=r"comments/(?P<comment_id>[-\w]+)")
    def delete_comment(self, request, pk=None, comment_id=None):
        thread = get_object_or_404(Thread, thread_id=pk)
        comment = get_object_or_404(ThreadComment, thread=thread, comment_id=comment_id)
        if comment.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        comment.is_active = False
        comment.deleted_at = timezone.now()
        comment.updated_by = request.user
        comment.save()
        if not thread.comments.filter(is_active=True).exists():
            thread.is_active = False
            thread.updated_by = request.user
            thread.save()
        return Response({"detail": "Comment deleted successfully"})

    @action(
        detail=True, methods=["post", "delete"],
        url_path=r"comments/(?P<comment_id>[-\w]+)/reactions",
    )
    def manage_reaction(self, request, pk=None, comment_id=None):
        thread = get_object_or_404(Thread, thread_id=pk)
        comment = get_object_or_404(ThreadComment, thread=thread, comment_id=comment_id)
        emoji = request.data.get("emoji")
        if not emoji:
            return Response({"detail": "Emoji is required"}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == "POST":
            reaction, created = ThreadCommentReaction.objects.get_or_create(
                comment=comment, emoji=emoji, user=request.user,
                defaults={"created_by": request.user, "updated_by": request.user},
            )
            return Response(
                {"detail": "Reaction added"},
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )
        else:
            deleted, _ = ThreadCommentReaction.objects.filter(
                comment=comment, emoji=emoji, user=request.user
            ).delete()
            if deleted:
                return Response({"detail": "Reaction removed"})
            return Response({"detail": "Reaction not found"}, status=status.HTTP_404_NOT_FOUND)

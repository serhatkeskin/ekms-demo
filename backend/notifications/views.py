import json
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from .websocket_utils import send_notification_to_user

User = get_user_model()


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        after_id = self.request.query_params.get("after_id")
        if after_id:
            try:
                qs = qs.filter(id__gt=int(after_id))
            except (ValueError, TypeError):
                pass
        read_status = self.request.query_params.get("is_read")
        if read_status is not None:
            qs = qs.filter(is_read=read_status.lower() == "true")
        return qs

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "notification marked as read"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success", "notifications_updated": updated})


class MentionViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    BLOCK = "block"
    BLOCK_COMMENT = "block_comment"
    COMMENT_SECTION = "comment_section"

    @action(detail=False, methods=["post"])
    def process(self, request):
        mentioned_usernames = request.data.get("mentioned_usernames", [])
        source_type = request.data.get("source_type", "")
        page_slug = request.data.get("page_slug")
        page_title = request.data.get("page_title", "a page")
        block_id = request.data.get("block_id")
        message_data = request.data.get("message_data", "")
        parent_comment_id = request.data.get("parent_comment_id")
        mentioner_username = request.user.username

        if not mentioned_usernames or not source_type:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        mentioned_users = [
            u for username in mentioned_usernames
            if (u := User.objects.filter(username=username).first())
        ]

        if not mentioned_users:
            return Response({"message": "No valid users mentioned"})

        for user in mentioned_users:
            try:
                if not message_data:
                    navigate_url = f"/pages/{page_slug}"
                    if source_type == self.BLOCK:
                        message = f"{mentioner_username} mentioned you in a page: {page_title}"
                        navigate_url += f"#{block_id}"
                    elif source_type == self.BLOCK_COMMENT:
                        message = f"{mentioner_username} mentioned you in a comment on: {page_title}"
                        navigate_url += f"#{block_id}"
                    else:
                        message = f"{mentioner_username} mentioned you"
                    message_data = json.dumps({"message": message, "navigate_url": navigate_url})

                notification = Notification.objects.create(
                    user=user,
                    header="New Mention",
                    message=message_data,
                    severity="info",
                )
                send_notification_to_user(user.id, {
                    "id": notification.id,
                    "header": notification.header,
                    "message": notification.message,
                    "severity": notification.severity,
                    "created_at": notification.created_at.isoformat(),
                    "is_read": False,
                })
            except Exception as e:
                import traceback
                traceback.print_exc()

        return Response({"message": f"Notifications sent to {len(mentioned_users)} users"})

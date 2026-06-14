from datetime import datetime, timedelta
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Notification


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    MESSAGE_RATE_LIMIT = 30

    async def connect(self):
        self.user = self.scope.get("user")
        if isinstance(self.user, AnonymousUser) or not self.user:
            await self.close(code=4001)
            return

        self.room_group_name = f"notifications_user_{self.user.id}"
        self.message_timestamps = []

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send_json({
            "type": "connection_established",
            "message": "Connected to notification service",
            "user_id": self.user.id,
            "username": self.user.username,
        })

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content):
        if not isinstance(content, dict):
            await self.close(code=4003)
            return

        now = datetime.now()
        self.message_timestamps = [ts for ts in self.message_timestamps if now - ts < timedelta(minutes=1)]
        if len(self.message_timestamps) >= self.MESSAGE_RATE_LIMIT:
            await self.send_json({"type": "error", "message": "Rate limit exceeded."})
            return
        self.message_timestamps.append(now)

        message_type = content.get("type")
        if not isinstance(message_type, str):
            return

        if message_type == "mark_read":
            notification_id = content.get("notification_id")
            if notification_id is not None and isinstance(notification_id, int):
                success = await self.mark_notification_read(notification_id)
                await self.send_json({"type": "read_confirmation", "notification_id": notification_id, "success": success})

        elif message_type == "mark_all_read":
            count = await self.mark_all_notifications_read()
            await self.send_json({"type": "all_read_confirmation", "notifications_updated": count, "success": True})

        elif message_type == "ping":
            await self.send_json({"type": "pong", "timestamp": content.get("timestamp")})

        elif message_type == "get_unread_count":
            count = await self.get_unread_count()
            await self.send_json({"type": "unread_count", "count": count})

    async def notification_message(self, event):
        await self.send_json({"type": "new_notification", "notification": event["notification"]})

    async def notification_read(self, event):
        await self.send_json({"type": "notification_read", "notification_id": event["notification_id"]})

    async def all_notifications_read(self, event):
        await self.send_json({"type": "all_notifications_read"})

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_all_notifications_read(self):
        return Notification.objects.filter(user=self.user, is_read=False).update(is_read=True)

    @database_sync_to_async
    def get_unread_count(self):
        return Notification.objects.filter(user=self.user, is_read=False).count()

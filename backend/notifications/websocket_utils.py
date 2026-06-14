from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

User = get_user_model()


def send_notification_to_user(user_id, notification_data):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        f"notifications_user_{user_id}",
        {"type": "notification_message", "notification": notification_data},
    )


def send_notification_to_username(username, notification_data):
    try:
        user = User.objects.get(username=username)
        send_notification_to_user(user.id, notification_data)
    except User.DoesNotExist:
        pass


def broadcast_notification_read(user_id, notification_id):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        f"notifications_user_{user_id}",
        {"type": "notification_read", "notification_id": notification_id},
    )


def broadcast_all_read(user_id):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        f"notifications_user_{user_id}",
        {"type": "all_notifications_read"},
    )

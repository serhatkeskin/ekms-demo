from django.contrib.auth.models import AbstractUser
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save

from common.vars import PUBLIC_MEDIA_PREFIX, PRIVATE_MEDIA_PREFIX
from common.models import ModelBase


class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class UserProfile(ModelBase):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(
        upload_to=f"{PRIVATE_MEDIA_PREFIX}/users/avatars/",
        default=f"{PUBLIC_MEDIA_PREFIX}/defaults/default_avatar.jpg",
        null=True,
        blank=True,
    )
    bio = models.TextField(blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, null=True)
    theme_preference = models.CharField(max_length=20, default="light")
    notification_preferences = models.JSONField(default=dict)

    def __str__(self):
        return f"Profile for {self.user.email}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

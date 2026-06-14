import uuid
from datetime import datetime, timezone, timedelta
from django.db import models


class DemoToken(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    label = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.label} ({self.token})"

    @property
    def is_valid(self):
        return self.is_active and datetime.now(tz=timezone.utc) < self.expires_at

from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _


class StatusBase(models.PositiveIntegerField):
    PRIVATE = 1
    PUBLIC = 2
    ARCHIVED = 3
    DRAFT = 4
    STATUS_CHOICES = (
        (PRIVATE, _("Private")),
        (PUBLIC, _("Public")),
        (ARCHIVED, _("Archived")),
        (DRAFT, _("Draft")),
    )


class ModelBase(models.Model):
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        abstract = True


class ModelBasev2(ModelBase):
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="%(class)s_created",
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="%(class)s_updated",
        null=True,
        blank=True,
    )

    class Meta:
        abstract = True

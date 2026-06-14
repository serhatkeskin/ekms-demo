from common.models import ModelBase, ModelBasev2
from common.models import StatusBase
from common.vars import PUBLIC_MEDIA_PREFIX, PRIVATE_MEDIA_PREFIX
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from django.utils.text import slugify

User = get_user_model()


class Project(ModelBasev2):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    logo = models.ImageField(
        upload_to=f"{PRIVATE_MEDIA_PREFIX}/projects/logos",
        null=True,
        blank=True,
    )
    status = models.PositiveSmallIntegerField(
        choices=StatusBase.STATUS_CHOICES, default=StatusBase.PRIVATE
    )
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)

    def __str__(self):
        return str(self.name)

    def save(self, *args, **kwargs):
        if self.pk:
            original = Project.objects.get(pk=self.pk)
            name_changed = original.name != self.name
        else:
            name_changed = True

        if name_changed or not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Project.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        super().save(*args, **kwargs)


class ProjectRole(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    is_supermanager = models.BooleanField(default=False)
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)

    def __str__(self):
        return str(self.name)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while ProjectRole.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ProjectMembership(ModelBasev2):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="memberships")
    role = models.ForeignKey(ProjectRole, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "project")

    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.project.name}"

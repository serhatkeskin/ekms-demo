import os
import logging
from urllib.parse import urlparse, parse_qs, unquote
from django.core.files import File
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.conf import settings
from mptt.models import MPTTModel, TreeForeignKey
from projects.models import Project
from common.models import StatusBase, ModelBase, ModelBasev2
from common.vars import PUBLIC_MEDIA_PREFIX, PRIVATE_MEDIA_PREFIX

User = get_user_model()
logger = logging.getLogger(__name__)


class Block(ModelBasev2):
    PARAGRAPH = 1
    HEADING = 2
    IMAGE = 3
    VIDEO = 4
    AUDIO = 5
    FILE = 6
    CODE = 7
    BULLETED_LIST = 8
    NUMBERED_LIST = 9
    CHECK_LIST = 10
    QUOTE = 11
    DIVIDER = 12
    CALLOUT = 13
    TABLE = 14

    PAGE_BLOCK_TYPES = (
        (PARAGRAPH, "Paragraph"),
        (HEADING, "Heading"),
        (IMAGE, "Image"),
        (VIDEO, "Video"),
        (AUDIO, "Audio"),
        (FILE, "File Attachment"),
        (CODE, "Code"),
        (BULLETED_LIST, "Bulleted List"),
        (NUMBERED_LIST, "Numbered List"),
        (CHECK_LIST, "Check List"),
        (QUOTE, "Quote"),
        (DIVIDER, "Divider"),
        (CALLOUT, "Callout"),
        (TABLE, "Table"),
    )

    block_id = models.CharField(max_length=36, db_index=True, null=True, unique=True)
    page = models.ForeignKey("Page", on_delete=models.CASCADE, related_name="blocks", null=False)
    file = models.FileField(upload_to=f"{PRIVATE_MEDIA_PREFIX}/pages/blocks", null=True)
    block_type = models.PositiveSmallIntegerField(choices=PAGE_BLOCK_TYPES, default=PARAGRAPH)
    content = models.JSONField(default=dict)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def save(self, *args, **kwargs):
        if self.content and "id" in self.content:
            self.block_id = self.content["id"]
        else:
            raise ValueError("Content must contain an 'id' field")

        if not self.file:
            try:
                content = self.content or {}
                props = content.get("props", {})
                url = props.get("url")

                if url:
                    parsed_url = urlparse(url)
                    query = parse_qs(parsed_url.query)
                    encoded_path = query.get("file", [None])[0]

                    if encoded_path:
                        decoded_path = unquote(encoded_path)
                        decoded_path = decoded_path.lstrip("/")
                        if decoded_path.startswith("media/"):
                            decoded_path = decoded_path[6:]

                        abs_path = os.path.join(settings.MEDIA_ROOT, decoded_path)
                        if os.path.exists(abs_path):
                            with open(abs_path, "rb") as f:
                                self.file.save(
                                    os.path.basename(decoded_path),
                                    File(f),
                                    save=False,
                                )
            except Exception as e:
                logger.warning(f"Block.save: could not attach file: {e}")

        super().save(*args, **kwargs)


class Page(MPTTModel, ModelBasev2):
    DRAFT = 1
    PUBLIC = 2
    PRIVATE = 3

    STATUS_CHOICES = (
        (DRAFT, "Draft"),
        (PUBLIC, "Public"),
        (PRIVATE, "Private"),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)
    icon = models.CharField(max_length=255, null=True, blank=True)
    cover_image = models.ImageField(
        upload_to=f"{PRIVATE_MEDIA_PREFIX}/pages/covers", null=True, blank=True
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="pages", null=True, blank=True
    )
    parent = TreeForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children_pages"
    )
    status = models.PositiveSmallIntegerField(choices=STATUS_CHOICES, default=DRAFT)
    properties = models.JSONField(default=dict, blank=True)
    last_edited_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="last_edited_pages"
    )
    last_edited_at = models.DateTimeField(auto_now=True)
    is_template = models.BooleanField(default=False)

    class MPTTMeta:
        order_insertion_by = ["title"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                original = Page.objects.get(pk=self.pk)
                title_changed = original.title != self.title
            except Page.DoesNotExist:
                title_changed = True
        else:
            title_changed = True

        if title_changed or not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Page.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        super().save(*args, **kwargs)

    def get_ancestors_list(self):
        return list(self.get_ancestors())

    def get_breadcrumbs(self):
        ancestors = self.get_ancestors_list()
        result = [{"title": page.title, "slug": page.slug} for page in ancestors + [self]]
        for item in result:
            item["url"] = f"pages/{item['slug']}"
        if self.project:
            result.insert(0, {"title": "Pages", "slug": "pages", "url": "pages"})
        return result


class PagePermission(models.Model):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="permissions")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="page_permissions")
    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_share = models.BooleanField(default=False)

    class Meta:
        unique_together = ("page", "user")

    def __str__(self):
        return f"Permission for {self.user.username} on {self.page.title}"


class PageHistory(ModelBasev2):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="history")
    content_snapshot = models.JSONField()
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="page_history"
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    event_type = models.CharField(
        max_length=20,
        choices=[
            ("snapshot", "Snapshot Created"),
            ("restore", "Snapshot Restored"),
            ("auto", "Auto Snapshot"),
        ],
        default="snapshot",
    )

    def __str__(self):
        if self.name:
            return f"{self.name} - {self.page.title} at {self.created_at}"
        return f"Revision of {self.page.title} at {self.created_at}"


class Comment(MPTTModel, ModelBasev2):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="comments")
    block = models.ForeignKey(
        Block, on_delete=models.CASCADE, related_name="comments", null=True, blank=True
    )
    text = models.TextField()
    parent = TreeForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )

    class MPTTMeta:
        order_insertion_by = ["created_at"]

    def __str__(self):
        block_part = f" on block {self.block_id}" if self.block else ""
        return f"Comment by {self.created_by} on {self.page.title}{block_part}"


class MediaContent(ModelBasev2):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=f"{PRIVATE_MEDIA_PREFIX}/pages/mediacontents")
    page = models.ForeignKey("pages.Page", on_delete=models.SET_NULL, null=True)
    project = models.ForeignKey("projects.Project", on_delete=models.SET_NULL, null=True)
    status = models.PositiveSmallIntegerField(
        choices=StatusBase.STATUS_CHOICES, default=StatusBase.PRIVATE
    )
    slug = models.SlugField(max_length=255, unique=True)

    def save(self, *args, **kwargs):
        if self.pk:
            original = MediaContent.objects.get(pk=self.pk)
            name_changed = original.name != self.name
        else:
            name_changed = True

        if name_changed or not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while MediaContent.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        super().save(*args, **kwargs)


class Thread(ModelBasev2):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="threads")
    thread_id = models.CharField(max_length=36, unique=True, db_index=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="resolved_threads"
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Thread {self.thread_id} on {self.page.title}"


class ThreadComment(ModelBasev2):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="comments")
    comment_id = models.CharField(max_length=36, unique=True, db_index=True)
    text = models.TextField()
    body = models.JSONField(default=list)
    metadata = models.JSONField(default=dict, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment {self.comment_id} in thread {self.thread.thread_id}"


class ThreadCommentReaction(ModelBasev2):
    comment = models.ForeignKey(ThreadComment, on_delete=models.CASCADE, related_name="reactions")
    emoji = models.CharField(max_length=10)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="thread_reactions")

    class Meta:
        unique_together = ("comment", "emoji", "user")

    def __str__(self):
        return f"{self.emoji} by {self.user.username} on comment {self.comment.comment_id}"

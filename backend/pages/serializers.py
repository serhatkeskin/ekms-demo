import uuid
from urllib.parse import urlparse, unquote, parse_qs
import logging
from rest_framework import serializers
from django.utils import timezone
from users.serializers import BasicUserSerializer
from common.serializers import SignedURLField
from s3_mini.utils import generate_presigned_full_url
from projects.models import Project
from .models import (
    Page, Block, PagePermission, PageHistory, Comment, MediaContent,
    Thread, ThreadComment, ThreadCommentReaction,
)

logger = logging.getLogger(__name__)


class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ["id", "block_id", "page", "block_type", "content", "order", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        content = instance.content or {}
        try:
            if instance.file:
                signed_url = generate_presigned_full_url(instance.file)
                content.setdefault("props", {})["url"] = signed_url
            elif content:
                original_url = content.get("props", {}).get("url")
                if original_url:
                    parsed_url = urlparse(original_url)
                    query_params = parse_qs(parsed_url.query)
                    encoded_path = query_params.get("file", [None])[0]
                    if encoded_path:
                        decoded_path = unquote(encoded_path)
                        signed_url = generate_presigned_full_url(decoded_path)
                        content.setdefault("props", {})["url"] = signed_url
        except Exception as e:
            logger.warning(f"[BlockSerializer] Failed to sign URL: {e}")
        data["content"] = content
        return data


class PageHistorySerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)

    class Meta:
        model = PageHistory
        fields = ["id", "name", "created_at", "created_by", "content_snapshot"]
        read_only_fields = ["id", "created_at", "created_by", "content_snapshot"]


class PageListSerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)
    updated_by = BasicUserSerializer(read_only=True)
    last_edited_by = BasicUserSerializer(read_only=True)
    breadcrumbs = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    project = serializers.SlugRelatedField(slug_field="slug", queryset=Project.objects.all())

    class Meta:
        model = Page
        fields = [
            "id", "title", "slug", "icon", "project", "status",
            "created_at", "created_by", "updated_at", "updated_by",
            "last_edited_by", "last_edited_at", "cover_image",
            "properties", "breadcrumbs", "parent", "children", "is_template",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by", "updated_by", "last_edited_at", "slug"]

    def get_breadcrumbs(self, obj):
        return obj.get_breadcrumbs()

    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True)
        return PageListSerializer(children, many=True).data

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        validated_data["updated_by"] = user
        validated_data["last_edited_by"] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user = self.context["request"].user
        validated_data["updated_by"] = user
        validated_data["last_edited_by"] = user
        return super().update(instance, validated_data)


class PageDetailSerializer(PageListSerializer):
    blocks = serializers.SerializerMethodField()

    class Meta(PageListSerializer.Meta):
        fields = PageListSerializer.Meta.fields + ["blocks"]

    def get_blocks(self, obj):
        active_blocks = obj.blocks.filter(is_active=True)
        return BlockSerializer(active_blocks, many=True, context=self.context).data


class PageFullSerializer(PageDetailSerializer):
    comments = serializers.SerializerMethodField()

    class Meta(PageDetailSerializer.Meta):
        fields = PageDetailSerializer.Meta.fields + ["comments"]

    def get_comments(self, obj):
        comments = obj.comments.filter(parent=None, is_active=True)
        return CommentListSerializer(comments, many=True).data


class CommentListSerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)
    reply_count = serializers.SerializerMethodField()
    page_slug = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "text", "created_by", "created_at", "reply_count", "block", "page_slug", "parent"]
        read_only_fields = ["created_at", "created_by"]

    def get_reply_count(self, obj):
        return obj.replies.count()

    def get_page_slug(self, obj):
        return obj.page.slug if obj.page else None


class CommentDetailSerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "text", "created_by", "created_at", "replies"]
        read_only_fields = ["created_at", "created_by"]

    def get_replies(self, obj):
        if obj.is_leaf_node():
            return []
        replies = obj.get_children().filter(is_active=True)
        return CommentListSerializer(replies, many=True).data


class MediaContentListSerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)
    page = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    file = SignedURLField(required=False, allow_null=True)

    class Meta:
        model = MediaContent
        fields = ["name", "slug", "file", "created_at", "created_by", "page"]
        read_only_fields = ["slug", "created_at", "created_by", "page"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.fields["file"].required = True
        else:
            self.fields["file"].required = False


class ThreadCommentReactionSerializer(serializers.ModelSerializer):
    user_ids = serializers.SerializerMethodField()

    class Meta:
        model = ThreadCommentReaction
        fields = ["emoji", "created_at", "user_ids"]

    def get_user_ids(self, obj):
        reactions = ThreadCommentReaction.objects.filter(
            comment=obj.comment, emoji=obj.emoji
        ).select_related("user")
        return [r.user.username if r.user else str(r.user_id) for r in reactions]


class ThreadCommentSerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)
    reactions = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = ThreadComment
        fields = [
            "id", "comment_id", "text", "body", "metadata",
            "created_at", "updated_at", "deleted_at",
            "created_by", "user_id", "reactions",
        ]
        read_only_fields = ["id", "comment_id", "created_at", "updated_at", "created_by"]

    def get_user_id(self, obj):
        return str(obj.created_by_id) if obj.created_by_id else None

    def get_reactions(self, obj):
        reactions_dict = {}
        for reaction in obj.reactions.select_related("user").all():
            if reaction.emoji not in reactions_dict:
                reactions_dict[reaction.emoji] = {
                    "emoji": reaction.emoji,
                    "created_at": reaction.created_at,
                    "user_ids": [],
                }
            username = reaction.user.username if reaction.user else str(reaction.user_id)
            reactions_dict[reaction.emoji]["user_ids"].append(username)
        return list(reactions_dict.values())

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = instance.comment_id
        return data


class ThreadSerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)
    resolved_by = BasicUserSerializer(read_only=True)
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id", "thread_id", "resolved", "resolved_at", "resolved_by",
            "metadata", "created_at", "updated_at", "created_by", "comments",
        ]
        read_only_fields = ["id", "thread_id", "created_at", "updated_at", "created_by"]

    def get_comments(self, obj):
        return ThreadCommentSerializer(obj.comments.filter(is_active=True), many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = instance.thread_id
        return data


class ThreadCreateSerializer(serializers.Serializer):
    page_slug = serializers.CharField()
    initial_comment = serializers.DictField()
    metadata = serializers.DictField(required=False, default=dict)

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        page = Page.objects.get(slug=validated_data["page_slug"])
        initial_comment = validated_data["initial_comment"]

        thread = Thread.objects.create(
            page=page,
            thread_id=str(uuid.uuid4()),
            metadata=validated_data.get("metadata", {}),
            created_by=user,
            updated_by=user,
        )
        ThreadComment.objects.create(
            thread=thread,
            comment_id=str(uuid.uuid4()),
            text=initial_comment.get("text", ""),
            body=initial_comment.get("body", []),
            metadata=initial_comment.get("metadata", {}),
            created_by=user,
            updated_by=user,
        )
        return thread


class ThreadCommentCreateSerializer(serializers.Serializer):
    text = serializers.CharField()
    body = serializers.ListField(required=False, default=list)
    metadata = serializers.DictField(required=False, default=dict)

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        thread = self.context.get("thread")

        comment = ThreadComment.objects.create(
            thread=thread,
            comment_id=str(uuid.uuid4()),
            text=validated_data.get("text", ""),
            body=validated_data.get("body", []),
            metadata=validated_data.get("metadata", {}),
            created_by=user,
            updated_by=user,
        )
        thread.save()
        return comment

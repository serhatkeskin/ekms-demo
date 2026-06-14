from users.serializers import UserSerializer, BasicUserSerializer
from rest_framework import serializers
from projects.models import Project, ProjectRole, ProjectMembership
from django.contrib.auth import get_user_model
from s3_mini.utils import generate_presigned_full_url

User = get_user_model()


class ProjectRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRole
        fields = ["name", "slug", "description", "can_view", "can_create", "can_edit", "can_delete"]


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user = BasicUserSerializer(read_only=True)
    role = ProjectRoleSerializer(read_only=True)
    username = serializers.CharField(write_only=True)
    role_slug = serializers.SlugRelatedField(
        queryset=ProjectRole.objects.all(), slug_field="slug", write_only=True
    )
    project_slug = serializers.SlugRelatedField(
        slug_field="slug", queryset=Project.objects.all(), source="project"
    )
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_logo = serializers.SerializerMethodField()

    class Meta:
        model = ProjectMembership
        fields = [
            "id", "user", "username", "project_slug", "project_name",
            "project_logo", "role", "role_slug",
        ]
        read_only_fields = ["id", "user", "role", "project_name", "project_logo"]

    def get_project_logo(self, obj):
        try:
            if obj.project.logo and obj.project.logo.name:
                return generate_presigned_full_url(obj.project.logo.name)
        except Exception:
            pass
        return None

    def create(self, validated_data):
        username = validated_data.pop("username")
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError({"username": "User not found."})
        project = validated_data.pop("project")
        role = validated_data.pop("role_slug")
        return ProjectMembership.objects.create(user=user, project=project, role=role, **validated_data)

    def update(self, instance, validated_data):
        username = validated_data.pop("username", None)
        if username:
            try:
                instance.user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise serializers.ValidationError({"username": "User not found."})
        project = validated_data.pop("project", None)
        if project:
            instance.project = project
        role = validated_data.pop("role_slug", None)
        if role:
            instance.role = role
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ProjectSerializer(serializers.ModelSerializer):
    created_by = BasicUserSerializer(read_only=True)
    updated_by = BasicUserSerializer(read_only=True)
    memberships = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "name", "slug", "description", "status", "logo",
            "created_at", "updated_at", "created_by", "updated_by", "memberships",
        ]
        read_only_fields = ("created_by", "updated_by", "memberships")

    def get_memberships(self, obj):
        return ProjectMembershipSerializer(
            obj.memberships.all(), many=True, context=self.context
        ).data

    def get_logo(self, obj):
        try:
            if obj.logo and obj.logo.name:
                return generate_presigned_full_url(obj.logo.name)
        except Exception:
            pass
        return None

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["created_by"] = user
        validated_data["updated_by"] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["updated_by"] = self.context["request"].user
        return super().update(instance, validated_data)

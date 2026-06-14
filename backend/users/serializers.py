from django.contrib.auth.models import Group
from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import UserProfile
from s3_mini.utils import generate_presigned_full_url

User = get_user_model()


class AvatarURLField(serializers.Field):
    def to_representation(self, value):
        profile = getattr(value, "profile", None)
        if not profile:
            return None
        try:
            avatar = profile.avatar
            if avatar and avatar.name:
                return generate_presigned_full_url(avatar.name)
        except Exception:
            pass
        return None

    def get_attribute(self, instance):
        return instance


class BasicUserSerializer(serializers.ModelSerializer):
    avatar = AvatarURLField(source="*", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "avatar"]


class UserSerializer(serializers.ModelSerializer):
    avatar = AvatarURLField(source="*", read_only=True)

    class Meta:
        model = User
        fields = (
            "pk",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "avatar",
        )
        read_only_fields = ("pk", "is_superuser")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_active=True,
        )


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    full_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "username", "email", "first_name", "last_name",
            "full_name", "avatar", "bio", "title", "theme_preference",
        ]

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_avatar(self, obj):
        try:
            if obj.avatar and obj.avatar.name:
                return generate_presigned_full_url(obj.avatar.name)
        except Exception:
            pass
        return None

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

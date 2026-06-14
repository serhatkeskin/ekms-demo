from s3_mini.utils import generate_presigned_full_url
from rest_framework import serializers
from rest_framework.fields import FileField


class SignedURLField(FileField):
    def to_representation(self, value):
        try:
            if not value:
                return ""
            path = getattr(value, "name", str(value))
            return generate_presigned_full_url(path)
        except Exception:
            return super().to_representation(value)

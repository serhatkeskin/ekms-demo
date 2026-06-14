from rest_framework import serializers


class SearchResultSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.CharField()
    title = serializers.CharField(required=False)
    content_preview = serializers.CharField(required=False)
    slug = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    project_id = serializers.IntegerField(required=False)
    project_title = serializers.CharField(required=False)
    block_id = serializers.CharField(required=False)
    page_id = serializers.IntegerField(required=False)
    page_slug = serializers.CharField(required=False)
    page_title = serializers.CharField(required=False)
    block_type = serializers.CharField(required=False)
    description = serializers.CharField(required=False)

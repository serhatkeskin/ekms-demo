import os
from urllib.parse import urlparse
from django.conf import settings
from rest_framework import status
from rest_framework.mixins import DestroyModelMixin
from rest_framework.response import Response


class SafeDestroyModelMixin(DestroyModelMixin):
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SafeDestroyModelWrappedMixin(SafeDestroyModelMixin):
    pass


class SafeDestroyWithFileMixin(DestroyModelMixin):
    file_extractors = []

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if request.query_params.get("hard", "false").lower() == "true":
            self.perform_full_destroy(instance)
        else:
            self.perform_safe_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_safe_destroy(self, instance):
        instance.is_active = False
        instance.save()

    def perform_full_destroy(self, instance):
        self._delete_instance_files(instance)
        instance.delete()

    def _delete_instance_files(self, instance):
        for extractor in self.file_extractors:
            try:
                for url in extractor(instance):
                    self._delete_file(url)
            except Exception:
                pass

    def _delete_file(self, url):
        parsed = urlparse(url)
        rel = parsed.path.replace("/media/", "", 1)
        abs_path = os.path.join(settings.MEDIA_ROOT, rel)
        if os.path.exists(abs_path):
            try:
                os.remove(abs_path)
            except Exception:
                pass

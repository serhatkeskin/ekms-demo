from django.conf import settings


def get_full_media_url():
    return str(settings.MEDIA_URL)


def get_full_url_for_file(request, obj_relative_path):
    return str(request.build_absolute_uri(obj_relative_path))

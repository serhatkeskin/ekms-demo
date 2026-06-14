from django.urls import path
from .views import MediaPresignView, ProtectedMediaView

urlpatterns = [
    path("presign/", MediaPresignView.as_view(), name="media-presign"),
    path("protected-media/", ProtectedMediaView.as_view(), name="protected-media"),
]

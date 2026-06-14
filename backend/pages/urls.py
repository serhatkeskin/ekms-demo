from django.urls import path, include
from rest_framework import routers
from pages.views import (
    PageViewSet,
    BlockViewSet,
    CommentViewSet,
    FileViewSet,
    MediaContentViewSet,
    ThreadViewSet,
)

router = routers.DefaultRouter()
router.register(r"pages", PageViewSet, basename="page")
router.register(r"blocks", BlockViewSet, basename="block")
router.register(r"mediacontents", MediaContentViewSet, basename="mediacontent")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"threads", ThreadViewSet, basename="thread")
router.register(r"files", FileViewSet, basename="file")

urlpatterns = [path("", include(router.urls))]

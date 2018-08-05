from django.conf.urls import url, include
from rest_framework import routers
import quickstart.views

from django.conf.urls import url
from django.contrib import admin
from audio.views import get_ayah, index, privacy, sudoku
from django.conf import settings
from django.conf.urls.static import static

from quickstart.views import AnnotatedRecordingList

router = routers.DefaultRouter()
router.register(r'users', quickstart.views.UserViewSet)
router.register(r'groups', quickstart.views.GroupViewSet)
# router.register(r'upload-audio', AnnotatedRecordingView.as_view(), base_name="annotated-recording")

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^get_ayah/', get_ayah),
    url(r'^$', index),
    url(r'^api/', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^api/recordings/', AnnotatedRecordingList.as_view(), name='file-upload'),
    url(r'^privacy/', privacy),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from __future__ import unicode_literals

# Create your models here.
from django.db import models

class AnnotatedRecording(models.Model):
    file = models.FileField(blank=True, null=True)
    surah_num = models.IntegerField(blank=True, null=True)
    ayah_num = models.IntegerField(blank=True, null=True)
    hash_string = models.CharField(max_length=32)
    timestamp = models.DateTimeField(auto_now_add=True)  # TODO(implement timeout)
    session_id = models.CharField(max_length=32)

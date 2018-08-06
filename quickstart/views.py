from django.contrib.auth.models import User, Group
from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore
from rest_framework import viewsets
from quickstart.serializers import UserSerializer, GroupSerializer, AnnotatedRecordingSerializer, DemographicInformationSerializer
from quickstart.models import AnnotatedRecording, DemographicInformation
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view


class AnnotatedRecordingList(APIView):

  parser_classes = (MultiPartParser, FormParser)

  def get(self, request, format=None):
      recordings = AnnotatedRecording.objects.all().order_by('-timestamp')
      serializer = AnnotatedRecordingSerializer(recordings, many=True)
      return Response(serializer.data)

  def post(self, request, *args, **kwargs):
    session_key = request.session.session_key
    new_recording = AnnotatedRecordingSerializer(data=request.data)
    if not(new_recording.is_valid()):
      raise ValueError("Invalid serializer data")
    try:
      existing_recording = AnnotatedRecording.objects.get(
        hash_string=new_recording.data['hash_string'],
        ayah_num=new_recording.data['ayah_num'],
        surah_num=new_recording.data['surah_num'])
      existing_recording.file = request.data['file']
      existing_recording.session_id = session_key
      existing_recording.save()
    except:
      return Response("Invalid hash or timed out request", status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_201_CREATED)


class DemographicInformationViewList(APIView):
  """
  API endpoint that allows demographic information to be viewed or edited.
  """
  def get(self, request, format=None):
      recordings = DemographicInformation.objects.all().order_by('-timestamp')
      serializer = DemographicInformationSerializer(recordings, many=True)
      return Response(serializer.data)

  def post(self, request, *args, **kwargs):
    session_key = request.session.session_key
    new_entry = DemographicInformationSerializer(data=request.data)
    new_entry.session_id = session_key
    if not(new_entry.is_valid()):
      raise ValueError("Invalid serializer data")
    try:
      new_entry.save()
    except:
      return Response("Invalid request", status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


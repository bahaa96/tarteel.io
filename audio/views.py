# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import random
import datetime
from django.http import HttpResponse, JsonResponse
from quickstart.models import AnnotatedRecording, DemographicInformation
from django.shortcuts import render
import io
import json
from rest_framework.decorators import api_view

END_OF_FILE = 6236

# get_ayah gets the surah num, ayah num, and text of a random ayah of a specified maximum length
@api_view(['GET', 'POST'])
def get_ayah(request, line_length=200):

    # user tracking - ensure there is always a session key
    if not request.session.session_key:
        request.session.create()
    session_key = request.session.session_key

    # Get random line
    with io.open('data.json', 'r', encoding='utf-8') as f:
        lines = json.load(f)
        f.close()

    # Parse line and add hash
    surah = request.data['surah'] if request.method == 'POST' else str(random.randint(1, 114))
    ayah = request.data['ayah'] if request.method == 'POST' else str(random.randint(1, len(lines[surah].keys())))
    line = lines[surah][ayah]
    hash = random.getrandbits(32)

    # Format as json, and save row in DB
    result = {"surah": surah, "ayah": ayah, "line": line, "hash": hash, "session_id": session_key}
    row = AnnotatedRecording(surah_num=surah, ayah_num=ayah, hash_string=hash, session_id=session_key)
    row.save()

    return JsonResponse(result)

################################################################################
############################## static page views ###############################
################################################################################
def index(request):
    if not request.session.session_key:
        request.session.create()
    session_key = request.session.session_key

    recording_count = AnnotatedRecording.objects.exclude(file__isnull=True).count()
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    
    if DemographicInformation.objects.filter(session_id=session_key).exists():
        ask_for_demographics = False
    else:
        ask_for_demographics = True

    daily_count = AnnotatedRecording.objects.filter(
        timestamp__gt=yesterday).exclude(file__isnull=True).count()

    return render(request, 'audio/index.html', {'recording_count':recording_count, 
        'daily_count':daily_count, 'ask_for_demographics':ask_for_demographics})

def about(request):
    return render(request, 'audio/about.html', {})

def privacy(request):
    return render(request, 'audio/privacy.html', {})

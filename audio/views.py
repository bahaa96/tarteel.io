# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import random
from django.http import HttpResponse, JsonResponse
from quickstart.models import AnnotatedRecording

END_OF_FILE = 6236


def get_ayah(request, line_length=200):

    # Get random line
    with open('quran-simple.txt', 'r', encoding='utf-8') as f:
        lines = [line for line in f.readlines()[0:END_OF_FILE] if len(line) < line_length]
        f.close()
    random_line = random.choice(lines).split('|')

    # Parse line and add hash
    surah = random_line[0]
    ayah = random_line[1]
    line = random_line[2]
    hash = random.getrandbits(32)

    # Format as json, and save row in DB
    result = {"surah": surah, "ayah": ayah, "line": line, "hash": hash}
    row = AnnotatedRecording(surah_num=surah, ayah_num=ayah, hash_string=hash)
    row.save()

    return JsonResponse(result)


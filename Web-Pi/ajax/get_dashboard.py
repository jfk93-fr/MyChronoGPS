#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
# get_dashboard.py
from MyChronoGPS_Paths import Paths
Path = Paths();
dir = Path.pathdata+"/cache"
import glob 
import os
import json
print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

result = []
info = dict()
locfile = 'DISPLAY'
fic = dir+'/'+locfile
if os.path.isfile(fic): 
    FD = open(fic, 'r')
    rec = FD.read()
    info["dashboard"] = rec
    FD.close()
else:
    info["msgerr"] = 'file '+fic+' not found'
# on va traiter les Leds
locfile = 'LED4'
fic = dir+'/'+locfile
if os.path.isfile(fic): 
    FD = open(fic, 'r')
    rec = FD.read()
    info["led1"] = rec.split(' ')
    FD.close()
locfile = 'LED16'
fic = dir+'/'+locfile
if os.path.isfile(fic): 
    FD = open(fic, 'r')
    rec = FD.read()
    info["led2"] = rec.split(' ')
    FD.close()
locfile = 'LED18'
fic = dir+'/'+locfile
if os.path.isfile(fic): 
    FD = open(fic, 'r')
    rec = FD.read()
    info["led3"] = rec.split(' ')
    FD.close()

result.append(info)
if len(result) == 0:
    info["msgerr"] = 'display area not found'
json_str = json.dumps(result)
print(json_str)

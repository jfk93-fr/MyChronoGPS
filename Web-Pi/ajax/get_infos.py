#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_WebPaths import Paths
Path = Paths();
dir = Path.pathdata+"/cache"
import glob 
import os
import json
print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

result = []
locfile = 'INFOS'
fic = dir+'/'+locfile
if os.path.isfile(fic):
    FD = open(fic, 'r')
    infos = json.loads(FD.read())
    result.append(infos)
    FD.close()
else:
    info = dict()
    info["msgerr"] = 'file '+fic+' not found'
    result.append(info)
if len(result) == 0:
    info = dict()
    info["msgerr"] = 'display area not found'
    result.append(info)
# add information from the LIVE file if it exists
locfile = 'LIVE'
fic = dir+'/'+locfile
if os.path.isfile(fic): 
    FD = open(fic, 'r')
    record = FD.read()
    info = json.loads(record)
    result.append(info)
    FD.close()
else:
    info = dict()
    info["msgerr"] = 'file '+fic+' not found'
    result.append(info)
if len(result) == 0:
    info = dict()
    info["msgerr"] = 'no coord found'
    result.append(info)

json_str = json.dumps(result)
print(json_str)

#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_Version import Versions
Version = Versions();
dir = Version.pathdata+"/cache"
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
    recs = FD.read().split('\n')
    nn = 0
    for ligne in recs:
        nn = nn + 1
        if ligne != "":
            infos = json.loads(ligne)
            result.append(infos)
    FD.close()

json_str = json.dumps(result)
print(json_str)

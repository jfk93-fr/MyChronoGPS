#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_Paths import Paths
Path = Paths();
#dir = Path.pathdata+"/cache"
dir = Path.pathdata+"/parms"
import glob 
import os
import json
print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

result = []
#locfile = 'PARMS'
locfile = 'params.json'
fic = dir+'/'+locfile
if os.path.isfile(fic):
    FD = open(fic, 'r')
    parms = json.loads(FD.read())
    result.append(parms)
    FD.close()
else:
    info = dict()
    info["msgerr"] = 'file '+fic+' not found'
    result.append(info)
if len(result) == 0:
    info = dict()
    info["msgerr"] = 'display area not found'
    result.append(info)

json_str = json.dumps(result)
print(json_str)

#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
dir = "userdata/tracks"
import glob 
#import os.path
import os
import json
print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

def listdirectory(path): 
    fichier=[] 
    l = glob.glob(path+'\\*') 
    for i in l: 
        if os.path.isdir(i): fichier.extend(listdirectory(i)) 
        else: fichier.append(i) 
    return fichier

circuits = []
listfic = listdirectory(dir)
for fic in listfic:
    statinfo = os.stat(fic)
    if statinfo.st_size > 0:
        #print(str(fic)+" "+str(statinfo.st_size))
        extension = os.path.splitext(fic)
        #print('extension:'+str(extension[1]))
        if extension[1] == '.trk':
            #print('fichier '+fic+' en cours de traitement')
            FD = open(fic, 'r')
            track = json.loads(FD.read())
            circuits.append(track)
            #print(str(track))
            FD.close()

result = dict()

if len(circuits) == 0:
    result['msgerr'] = 'pas de circuit trouvé'
else:
    result['circuits'] = circuits

json_str = json.dumps(result)
print(json_str)

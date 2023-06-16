#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_WebPaths import Paths
Path = Paths();
dir = Path.pathdata+"/sessions"

import glob 
import os
import json
print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

def listdirectory(path): 
    fichier=[] 
    l = glob.glob(path+'/*') 
    for i in l: 
        if os.path.isdir(i): fichier.extend(listdirectory(i)) 
        else: fichier.append(i) 
    return fichier

result = []
#session = dict()
#session["dir"] = dir
#result.append(session)

listfic = listdirectory(dir)
for fic in listfic:
    statinfo = os.stat(fic)
    if statinfo.st_size > 0:
		# on recherche les extensions .txt
        extension = os.path.splitext(fic)
        if extension[1] == '.txt':
            session = dict()
            session["fichier"] = fic
            session["stats"] = statinfo.st_size
            
            T = fic.split(extension[1])
            session["filename"] = T[0]
            session["filetype"] = extension[1]
            
            # on recherche un "-" dans le nom du fichier
            R = session["filename"].split("/")
            #print(str(R))
            #print(str(len(R)))
            i = len(R)-1
            #print(str(R[i]))
            session["fileroot"]=session["filename"]        
            session["filetime"]=R[i]            
            T = session["filename"].split("-")
            #print(str(session["filename"]))
            #session["fileroot"]=session["filename"]
            #session["filetime"]=session["filename"]
            if len(T) > 1:
                session["fileroot"] = T[0]
                session["filetime"] = T[1]
            #print(str(session["fileroot"]))
            #print(str(session["filetime"]))
            FD = open(fic, 'r')
            info = FD.read()
            #print(str(info))
            T = info.split(";") # c'est au format csv avec le séparateur ";" 
            #print(str(T))
            session["date_session"] = T[0]
            session["heure_session"] = T[1]
            session["circuit_session"] = T[2]
            #print(str(session)+"\n")
            #dd = session["date_session"][0:2]
            #mm = session["date_session"][3:5]
            #yy = session["date_session"][6:10]
            #print(str(dd)+"\n")
            #print(str(mm)+"\n")
            #print(str(yy)+"\n")
            #print(session["date_session"][6:4])
            #print(session["date_session"][3:2])
            #print(session["date_session"][0:2])
            session["sort"] = str(session["date_session"][6:10])+str(session["date_session"][3:5])+str(session["date_session"][0:2])+str(session["heure_session"])
            #print(str(session["sort"])+"\n")
            session["infos"] = info
            #print(str(session))
            FD.close()
            result.append(session)
#passe1 = sorted(result, key=lambda d: d["heure_session"], reverse=True)
#result = sorted(passe1, key=lambda d: d["date_session"], reverse=True)
#result = sorted(result, key=lambda d: d["filetime"], reverse=True)
result = sorted(result, key=lambda d: d["sort"], reverse=True)
#result = sorted(result, key=lambda d: d["date_session"][6:4]+d["date_session"][3:2]+d["date_session"][0:2]+d["heure_session"], reverse=True)

json_str = json.dumps(result)
print(json_str)

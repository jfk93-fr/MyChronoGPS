#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
dir = "userdata/sessions"
import glob 
import os
import json
import cgi
print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

def listdirectory(path): 
    fichier=[] 
    l = glob.glob(path+'/*') 
    for i in l: 
        if os.path.isdir(i): fichier.extend(listdirectory(i)) 
        else: fichier.append(i) 
    return fichier

result = []

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
            T = fic.split(".")
            session["filename"] = T[0]
            session["filetype"] = T[1]
            # on recherche un "-" dans le nom du fichier
            T = session["filename"].split("-")
            if len(T) > 1:
                session["fileroot"] = T[0]
                session["filetime"] = T[1]
                FD = open(fic, 'r')
                info = FD.read()
                T = info.split(";") # c'est au format csv avec le séparateur ";" 
                session["date_session"] = T[0]
                session["heure_session"] = T[1]
                session["circuit_session"] = T[2]
                session["infos"] = info
                FD.close()
                result.append(session)
json_str = json.dumps(result)
print(json_str)

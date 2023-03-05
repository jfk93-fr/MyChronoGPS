#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_WebPaths import Paths
Path = Paths();
dir = Path.pathdata+"/analysis"

import glob 
#import os.path
import os
import json
import cgi

result = []
mydict = dict()

form = cgi.FieldStorage()
listkeys = form.keys()

print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

fic = dir+'/'+form.getvalue('analysis')

try:
    FD = open(fic, 'r')
    coords = FD.readlines()
    FD.close()
except:
    mydict['msgerr'] = 'erreur lecture fichier '+fic

# si le fichier .bak n'existe pas, on le crée, c'est le fichier d'origine
fbak = fic+'.bak'
if os.path.isfile(fbak) == False:
    try:
        FO = open(fbak, "w+")
        for lines in coords:
            FO.write(lines)
        FO.close()
    except:
        mydict['msgerr'] = 'erreur écriture fichier '+fbak

line0 = coords[0] # la première ligne du fichier analysis contient les coordonnées, c'est elle qui est mise à jour
#toutes les lignes sont des tableaux
ll = len(line0)
L0 = line0[1:ll-2] # on extrait le premier élément du tableau
coordline = json.loads(L0) # on extrait le json de la chaine de caractère lue
# si coords a été fourni en paramètre POST, il contient la première ligne à remplacer
if 'coords' in form:
    coordline = json.loads(form.getvalue('coords'))

newl = '['+json.dumps(coordline)+']\n' # on recrée un chaine de caractère comme un tableau
coords[0] = newl

# on écrit le nouveau fichier
fnew = fic
try:
    FO = open(fnew, "w+")
    for lines in coords:
        FO.write(lines)
    FO.close()
except:
    mydict['msgerr'] = 'erreur écriture fichier '+fnew

#on renvoie les coordonnées mises à jour
result.append(coordline)

json_str = json.dumps(result)
print(json_str)

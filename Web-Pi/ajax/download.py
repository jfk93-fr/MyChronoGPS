#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_WebPaths import Paths
Path = Paths();

diru = Path.pathweb+"/userdata/"
dirf = Path.pathdata
dira = Path.pathdata+"/analysis"
dirt = Path.pathdata+"/tracks"

import glob 
import os
import json
import cgi
import zipfile

def listdirectory(path): 
    fichier=[] 
    l = glob.glob(path+'/*') 
    for i in l: 
        if os.path.isdir(i): fichier.extend(listdirectory(i)) 
        else: fichier.append(i) 
    return fichier
    
dataurl = cgi.FieldStorage()
fileid = str(dataurl.getvalue('file'))
#print(str(dataurl))

os.chdir(dirf)

# lecture du fichier analysis, la première ligne contient le nom du circuit
filea = str("analysis-"+dataurl.getvalue('file'))

fic = dira+"/"+filea+".json"
lines = "erreur json"
try:
    handle = open(fic, "r")
    infos = handle.read()
    lines = infos.split('\n')
    handle.close()
except:
    print('fichier '+fic+' non trouvé')

zipid = fileid+".zip"
zip = zipfile.ZipFile(diru+zipid,'w')

fl = json.loads(lines[0])
NomCircuit = fl[0]["NomCircuit"]
if NomCircuit == "":
    NomCircuit = "Autotrack"
filename = NomCircuit+".trk"
filetrack = dirt+"/"+filename

if os.path.isfile(filetrack): 
    zip.write("tracks/"+str(filename))

zip.write("analysis/analysis-"+fileid+".json")
zip.write("sessions/session-"+fileid+".txt")
zip.close

lien = "../userdata/"+zipid

print('Content-Type: text-plain; charset=utf-8\r\n\r\n')
print('<html>')
print('<head>')
print('<meta http-equiv="refresh" content="0; url='+lien+'">')
print('</head>')
print('<body>')
print('</body>')
print('</html>')

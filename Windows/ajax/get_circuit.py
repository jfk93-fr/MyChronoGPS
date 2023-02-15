#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
import glob 
#import os.path
import os
import json
import cgi

def listdirectory(path): 
    fichier=[] 
    #l = glob.glob(path+'\\*') 
    l = glob.glob(path+'/*') 
    #print(str(l))
    for i in l: 
        if os.path.isdir(i): fichier.extend(listdirectory(i)) 
        else: fichier.append(i) 
    return fichier
    
def getCircuit(id):
    global circuits
    circuit = False
    for i in range(len(circuits)):
        if circuits[i]["NomCircuit"] == id:
            circuit = circuits[i];
    return circuit

def createNewCircuit():
    newCircuit = dict()
    lat = False;
    lon = False;
    lineFL = False;
    newCircuit["NomCircuit"] = "NewTrack"
    newCircuit["Zoom"] = 16
    latlng = dataurl.getvalue('latlng')
    if latlng != None:
        # c'est un nouveau circuit à dessiner entièrement à partir de coordonnées latitude, longitude
        T1 = latlng.split(",")
        lat = T1[0]
        lon = T1[1]
    else:
        FL = dataurl.getvalue('FL')
        if FL != None:
            # c'est un nouveau circuit à dessiner à partir des coordonnées d'une ligne
            #newCircuit->GET = $_GET;
            newCircuit["T1"] = FL
            FL = FL.replace("[","")
            FL = FL.replace("]","")
            newCircuit["T2"] = FL
            T1 = FL.split(",")
            newCircuit["T3"] = T1
            lat = T1[0]
            lon = T1[1]
            lineFL = [T1[0],T1[1],T1[2],T1[3]]
    newCircuit["Latitude"] = lat
    newCircuit["Longitude"] = lon
    newCircuit["Latcenter"] = lat
    newCircuit["Loncenter"] = lon
    newCircuit["FL"] = lineFL
    
    return newCircuit

dir = "D:\\Python\\www\\userdata\\tracks"
dir = "userdata/tracks"
dataurl = cgi.FieldStorage()

print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

id = dataurl.getvalue('id')
NewCircuit = False
if id == None:
    NewCircuit = True

# on récupère tous les circuits dans un tableau
circuits = []
listfic = listdirectory(dir)
for fic in listfic:
    statinfo = os.stat(fic)
    if statinfo.st_size > 0:
        extension = os.path.splitext(fic)
        if extension[1] == '.trk':
            FD = open(fic, 'r')
            track = json.loads(FD.read())
            circuits.append(track)
            FD.close()

result = dict()

if len(circuits) == 0:
    info + 'pas de circuit trouvé'
    result['msgerr'] = info
else:
    if NewCircuit == True:
        result['circuit'] = createNewCircuit()
    else:
        circuit = getCircuit(id)
        result['circuit'] = circuit

json_str = json.dumps(result)
print(json_str)

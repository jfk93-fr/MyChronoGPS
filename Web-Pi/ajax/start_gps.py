#! /usr/bin/python 
# -*- coding: utf-8 -*-

# Il faut donner des droits en exécution sur ce fichier :
# sudo chmod +x /usr/lib/cgi-bin/stop_gps.py

from MyChronoGPS_Paths import Paths
Path = Paths();

import os
import time
import json
import sys

import subprocess
import shlex

pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathlog = pathdata+'/log'
cmdgps =  "MyChronoGPS"
#cmdos = "su - pi python "+pathcmd+"/"+cmdgps+".py > "+pathlog+"/"+"MyChronoGPS.log 2>&1 &"
#cmdos = "python "+pathcmd+"/"+cmdgps+".py & "
#/home/pi/projets/MyChronoGPS/MyChronoGPS.py > /home/pi/projets/MyChronoGPS/log/log.txt 2>&1 &
cmdos = "sudo sh "+pathcmd+"/start_gps.sh > "+pathlog+"/"+"start_gps.log 2>&1"

# mydict représente le retour de la fonction ajax
mydict = dict()
# timestamp
timestamp = format(time.time())

# mydict["version"] = VERSION
mydict["time"] = str(timestamp)
mydict["cmd"] = str(cmdos)

mydict["return"] = 0

print("OS command:"+str(cmdos))
try:
    os.system(cmdos)
    mydict["msg"] = "start command successfully send"
    mydict["return"] = 0
except OSError as err:
    print("OS error: {0}".format(err))
    mydict["msg"] = "OS error: {0}".format(err)
    mydict["return"] = 8
except:
    print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
    mydict["msg"] = "Unexpected error:", sys.exc_info()[0], sys.exc_info()[1]
    mydict["return"] = 8
    raise
 
print("Content-Type:application/json; charset=UTF-8\n")

print(json.dumps(mydict))
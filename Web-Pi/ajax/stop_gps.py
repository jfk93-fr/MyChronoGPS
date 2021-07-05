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

pipe_name = Path.pathdata+'/pipes/BUTTON'
cmd_stop = "12"

# mydict représente le retour de la fonction ajax
mydict = dict()
# timestamp
timestamp = format(time.time())

# mydict["version"] = VERSION
mydict["time"] = str(timestamp)

str = cmd_stop
try:
    pipelcd = os.open(pipe_name, os.O_WRONLY, os.O_NONBLOCK)
    os.write(pipelcd, (str+"\r\n").encode())
    os.close(pipelcd)
    mydict["msg"] = "stop command successfully send"
    mydict["return"] = 0
except OSError as err:
    print("OS error: {0}".format(err))
    mydict["msg"] = "OS error: {0}".format(err)
    mydict["return"] = 8
except:
    print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
    mydict["msg"] = "Unexpected error:", sys.exc_info()[0], sys.exc_info()[1]
    raise
 
print("Content-Type:application/json; charset=UTF-8\n")

print(json.dumps(mydict))
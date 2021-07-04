#! /usr/bin/python 
# -*- coding: utf-8 -*-
#
# Execution rights must be given to this file :
# sudo chmod +x /usr/lib/cgi-bin/shutdown_pi.py

from MyChronoGPS_Version import Versions
Version = Versions();
VERSION = Version.VERSION

import os
import time
import json
import sys

import subprocess
import shlex

pathcmd = Version.pathcmd
pathdata = Version.pathdata
pathlog = pathdata+'/log'
cmdgps =  "MyChronoGPS."+VERSION
cmdos = "sudo shutdown -h now"

# mydict represents the return of the ajax function
mydict = dict()
timestamp = format(time.time())

mydict["version"] = VERSION
mydict["time"] = str(timestamp)
mydict["cmd"] = str(cmdos)

mydict["return"] = 0

print("OS command:"+str(cmdos))
try:
    os.system("sudo shutdown -h now")
    mydict["msg"] = "shutdown command successfully send"
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
 
print "Content-Type:application/json; charset=UTF-8\n"

print(json.dumps(mydict))
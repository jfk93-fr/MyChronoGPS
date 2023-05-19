#! /usr/bin/python 
# -*- coding: utf-8 -*-
#
# Execution rights must be given to this file :
# sudo chmod +x /usr/lib/cgi-bin/kill_process.py

from MyChronoGPS_WebPaths import Paths
Path = Paths();

import os
import time
import json
import cgi
import sys

import subprocess
import shlex

    
dataurl = cgi.FieldStorage()
pid = str(dataurl.getvalue('pid'))

pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathlog = pathdata+'/log'
cmdgps =  "MyChronoGPS"
cmdos = "sudo kill "+pid

# mydict represents the return of the ajax function
mydict = dict()
timestamp = format(time.time())

# mydict["version"] = VERSION
mydict["time"] = str(timestamp)
mydict["cmd"] = str(cmdos)

mydict["return"] = 0

command = 'ps -q '+str(pid)+' -o comm='
try:
    proc_retval = subprocess.check_output(shlex.split(command))
    ps = str(proc_retval.strip().decode())
    #print(str(ps))
    if ps != "":
        #print("OS command:"+str(cmdos))
        try:
            os.system(str(cmdos))
            mydict["msg"] = "command ["+str(cmdos)+"] successfully send"
            mydict["return"] = 0
        except OSError as err:
            #print("OS error: {0}".format(err))
            mydict["msg"] = "OS error: {0}".format(err)
            mydict["return"] = 8
        except:
            #print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
            mydict["msg"] = "Unexpected error:"+str(sys.exc_info()[0])+str(sys.exc_info()[1])
            mydict["return"] = 8
            #raise
except OSError as err:
    #print("OS error: {0}".format(err))
    mydict["msg"] = "OS error: {0}".format(err)
    mydict["return"] = 8
except:
    #print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
    mydict["msg"] = "Unexpected error:"+str(sys.exc_info()[0])+str(sys.exc_info()[1])
    mydict["return"] = 8
    #raise
 
print ("Content-Type:application/json; charset=UTF-8\n")
#mydict = dict()

print(json.dumps(mydict))
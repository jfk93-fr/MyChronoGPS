#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_WebPaths import Paths
Path = Paths();
autotrack = Path.pathdata+"/tracks/Autotrack.trk"

import glob 
import os
import json
import cgi

# mydict représente le retour de la fonction ajax
mydict = dict()

if os.path.isfile(autotrack):
    try:
        os.remove(autotrack)
        mydict["msg"] = "autodef track successfully removed"
        mydict["return"] = 0
    except OSError as err:
        print("OS error: {0}".format(err))
        mydict["msg"] = "OS error: {0}".format(err)
        mydict["return"] = 8
    except:
        print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
        mydict["msg"] = "Unexpected error:", sys.exc_info()[0], sys.exc_info()[1]
        raise
else:
        mydict["msg"] = "no autodef track to remove"
        mydict["return"] = 0

print("Content-Type:application/json; charset=UTF-8\n")

print(json.dumps(mydict))
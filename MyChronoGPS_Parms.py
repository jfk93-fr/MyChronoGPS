#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_Parms
import json
import os
import subprocess
import shlex

class Parms(): # classe qui retient les informations paramètres

    def __init__(self,Path):
        fparmcache = Path.pathcache+'/PARMS'
        try:
            if os.path.exists(fparmcache) == False:
                fparams = Path.pathdata+'/parms/params.json'
                command = 'cp '+fparams+' '+fparmcache
                proc_retval = subprocess.check_output(shlex.split(command))

                command = 'sh '+Path.pathcmd+'/MyChronoGPS_Auth.sh'
                proc_retval = subprocess.check_output(shlex.split(command))
            
            ParamsFD = open(fparmcache, 'r')
            self.params = json.loads(ParamsFD.read())
            ParamsFD.close()
        except OSError as err:
            print("cannot use cache file OS error: {0}".format(err))
            pass

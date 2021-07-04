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

    def __init__(self,vers):
        fparmcache = vers.pathcache+'/PARMS'
        try:
            if os.path.exists(fparmcache) == False:
                fparams = vers.pathdata+'/parms/params.json'
                command = 'cp '+fparams+' '+fparmcache
                proc_retval = subprocess.check_output(shlex.split(command))
            
            ParamsFD = open(fparmcache, 'r')
            self.params = json.loads(ParamsFD.read())
            ParamsFD.close()
        except OSError as err:
            print("cannot use cache file OS error: {0}".format(err))
            pass

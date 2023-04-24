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
        self.fparmcache = Path.pathcache+'/PARMS'
        self.path = Path
        self.read_parms()

    def read_parms(self):
        try:
            if os.path.exists(self.fparmcache) == False:
                fparams = self.path.pathdata+'/parms/params.json'
                command = 'cp '+fparams+' '+self.fparmcache
                proc_retval = subprocess.check_output(shlex.split(command))

                command = 'sh '+self.path.pathcmd+'/MyChronoGPS_Auth.sh'
                proc_retval = subprocess.check_output(shlex.split(command))
            
            ParamsFD = open(self.fparmcache, 'r')
            self.params = json.loads(ParamsFD.read())
            ParamsFD.close()
        except OSError as err:
            print("cannot use cache file OS error: {0}".format(err))
            pass

    def get_parms(self,parms):
        ret_parms = False
        if parms in self.params:
            ret_parms = self.params[parms]
        return ret_parms

    def set_parms(self,parms,value):
        self.params[parms] = value
        try:
            ParamsFD = open(self.fparmcache, 'w+')
            jparam = json.dumps(self.params)
            ParamsFD.write(jparam)
            ParamsFD.close()
        except OSError as err:
            print("cannot use cache file OS error: {0}".format(err))
            pass


#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_WebPaths import Paths
Path = Paths();
dir = Path.pathdata+"/cache"
import glob 
import os
import json
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



# mydict représente le retour de la fonction ajax
mydict = dict()

# we start by reading the parameters ...
parms = Parms(Path)

NoTrack = 0 # 0: par défaut, on recherche dans la base des circuits si on coupe une ligne départ-arrivée
            # 1: on ne recherche pas, on va créer automatiquement une piste "autodef" dans la base des circuits.
el_parms = parms.get_parms("NoTrack")
if "NoTrack" in parms.params:
    NoTrack = el_parms
# switch NoTrack
#print(str(NoTrack))
if NoTrack == 0:
    NoTrack = 1
    msg = "autodef track successfully forced"
else:
    NoTrack = 0
    msg = "all tracks successfully forced"
parms.set_parms("NoTrack",NoTrack)
#print(str(NoTrack))

mydict["msg"] = msg
mydict["return"] = 0

finfos = dir+'/INFOS'

if os.path.isfile(finfos):
    try:
        FD = open(finfos, 'r')
        infos = json.loads(FD.read())
        FD.close()
        infos[0]["autodef"] = NoTrack
        #print(str(infos))
        # rewrite INFOS
        try:
            FO = open(finfos, "w+")
            #print(str(json.dumps(infos)))
            FO.write(json.dumps(infos))
            FO.close()
        except:
            mydict['msgerr'] = 'erreur écriture fichier '+finfos
            mydict["return"] = 8

    except OSError as err:
        #print("OS error: {0}".format(err))
        mydict["msg"] = "OS error: {0}".format(err)
        mydict["return"] = 8
    except:
        #print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
        mydict["msg"] = "Unexpected error:", sys.exc_info()[0], sys.exc_info()[1]
        mydict["return"] = 8
        raise
else:        
    try:
        FO = open(finfos, "w+")
        dautodef = dict()
        dautodef["autodef"] = NoTrack
        infos = []
        infos.append(dautodef)
        FO.write(json.dumps(infos))
        FO.close()
        os.chmod(finfos, 0o777)
    except:
        mydict['msgerr'] = 'erreur écriture fichier '+finfos
        mydict["return"] = 8

print('Content-Type: text-plain; charset=utf-8\r\n\r\n')

#print(str(parms.params))

print(json.dumps(mydict))
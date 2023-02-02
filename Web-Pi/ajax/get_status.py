#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
#from MyChronoGPS_WebPaths import Paths
#Path = Paths();
#dir = Path.pathdata+"/cache"
import glob 
import os
import json
import subprocess
import shlex

print('Content-Type: text-plain; charset=utf-8\r\n\r\n')
result = []
info = dict()

# retrieving the ip address
command = 'hostname -I'
proc_retval = subprocess.check_output(shlex.split(command))
ipadr = str(proc_retval.strip().decode())
info["adresseip"] = ipadr

# retrieving the ip hostname
command = 'hostname -s'
proc_retval = subprocess.check_output(shlex.split(command))
hostname = str(proc_retval.strip().decode())
info["hostname"] = hostname

# retrieving the cpu temperature
with open('/sys/class/thermal/thermal_zone0/temp') as t:
    temp = t.read()
cputemp = int(temp) / 1000
info["cputemp"] = round(cputemp,1)

# process MyChronoGPS
#command = 'ps -e -f | grep MyChronoGPS'
command = 'ps -ef'
proc_retval = subprocess.check_output(shlex.split(command))
process = str(proc_retval.strip().decode())
wprocess = process.split('\n')
myprocess = []
#myprocess.append(wprocess[0]) # append title line
title = (' '.join(wprocess[0].split())).split()
info["nheader"] = str(len(title))
info["pheader"] = title

for chaine in wprocess:
    if "MyChronoGPS" in chaine:
        if ".py" in chaine:
            i = chaine.index("/")
            d = str(chaine[:i])
            a = chaine.split("/")
            b = a[len(a)-1]
            chaine = d+str(b)            
            myprocess.append(chaine)

info["myprocess"] = myprocess

# disk occupancy
command = 'df -h'
proc_retval = subprocess.check_output(shlex.split(command))
disk = str(proc_retval.strip().decode())
disk = disk.split('\n')
info["disk"] = disk

# formatting of the output
result.append(info)

json_str = json.dumps(result)
print(json_str)

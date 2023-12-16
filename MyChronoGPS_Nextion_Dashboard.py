#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_Nextion_Dashboard
#   control of the dashboard display on an Nextion screen 
#   reads the cached file DASHBOARD, formats the message and displays it on the Nextion screen (write serial)
#
###########################################################################
import json

from MyChronoGPS_Paths import Paths
Path = Paths();

import os
import time
import sys
import threading
from threading import Timer

import serial
import struct
k=struct.pack('B', 0xff)    

import subprocess

cmdgps =  "MyChronoGPS_Nextion_Dashboard"
pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathlog = pathdata+'/log/'

parms = ""
from MyChronoGPS_Parms import Parms
# we start by reading the parameters ...
parms = Parms(Path)
ScreenPort = "ttyUSB0"
el_parms = parms.get_parms("ScreenPort")
if "ScreenPort" in parms.params:
    ScreenPort = el_parms
ScreenRate = 9600
el_parms = parms.get_parms("ScreenRate")
if "ScreenRate" in parms.params:
    ScreenRate = el_parms
print(str(ScreenRate))

#######################################################################################
# we will use the logger to replace print
#######################################################################################
import logging
from logging.handlers import TimedRotatingFileHandler
FORMATTER = logging.Formatter("%(asctime)s — %(name)s — %(funcName)s — %(levelname)s — %(lineno)d — %(thread)d — %(message)s")
LOG_FILE = pathlog+cmdgps+".log"
print(LOG_FILE)

def get_console_handler():
   console_handler = logging.StreamHandler(sys.stdout)
   console_handler.setFormatter(FORMATTER)
   return console_handler
def get_file_handler():
   file_handler = TimedRotatingFileHandler(LOG_FILE, when='midnight')
   file_handler.setFormatter(FORMATTER)
   return file_handler
def get_logger(logger_name):
   logger = logging.getLogger(logger_name)
   logger.setLevel(logging.DEBUG) # better to have too much log than not enough
   logger.addHandler(get_console_handler())
   logger.addHandler(get_file_handler())
   # with this pattern, it's rarely necessary to propagate the error up to parent
   logger.propagate = False
   return logger

logger = get_logger(__name__)
logger.setLevel(logging.INFO)
logger.info('debut de '+cmdgps)

#######################################################################################

# list of commands
DISPLAY = "D"
DISPLAY_BIG = "H"
DISPLAY_SMALL = "S"
DISPLAY_MENU = "M"
CLEAR = "C"
#BLACK = "B"
#CONTRAST = "A"
POWER_OFF = "X"

SERIAL_PORT = "/dev/"+str(ScreenPort)
print(str(SERIAL_PORT))
# Connect to the Nextion screen
try:
    ser = serial.Serial(SERIAL_PORT, baudrate = ScreenRate, timeout = 1)
except:
    logger.error("Application serial error!")
    exit(1)
print("connected to serial")

class ScrollControl(threading.Thread):
    def __init__(self,max):
        threading.Thread.__init__(self)
        self.scroll = 0
        self.max = max
        self.infos = " "
        #self.infos = " "
    def run(self):
        self.__running = True
        while self.__running:
            if self.scroll > self.max:
                self.scroll = 0
            self.scroll = self.scroll + 1
            time.sleep(0.5)
    def stop(self):
        self.__running = False
    def get_scroll(self,infos):
        if infos != self.infos:
            self.scroll = 0
        self.infos = infos
        #logger.info(str(self.scroll)+"/"+str(self.max)+" "+self.infos)
        scroll_info = self.infos+"... "+self.infos+"... "+self.infos
        scroll_info = scroll_info[self.scroll:self.scroll+self.max]
        return scroll_info
    
class DisplayScreen():

    def __init__(self,scr):
        self.scr = scr
        
        self.cache = pathdata+'/cache/DASHBOARD'
        logger.debug("cache file:"+self.cache)
        self.page = 3
        self.display("page 3")
        self.ip = " "
        self.date = " "
        self.time = " "
        self.nbsats = 0
        self.tempcpu = 0
        self.circuit = " "
        self.t0 = " "
        self.lap = 0
        self.tt = " "
        self.t1 = " "
        self.best = " "
        self.tec = " "
        self.gain = " "
        self.vitesse = " "
        self.infos = " "
        
        self.loopm = 999
        self.loops = 999

        self.display("ip.txt=\""+self.ip+"\"")
        self.display("date.txt=\""+self.date+"\"")
        self.display("time.txt=\""+self.time+"\"")
        self.display("nbsats.val=8*"+str(self.nbsats)+"/12")
        self.display("tempcpu.val="+str(self.tempcpu))
        self.display("circuit.txt=\""+self.circuit+"\"")
        self.display("t0.txt=\""+self.t0+"\"")
        self.display("lap.txt=\" \"")
        self.display("tt.txt=\""+self.tt+"\"")
        self.display("t1.txt=\""+self.t1+"\"")
        self.display("best.txt=\""+self.best+"\"")
        self.display("tec.txt=\""+self.tec+"\"")
        self.display("gain.txt=\""+self.gain+"\"")
        self.display("vitesse.txt=\""+self.vitesse+"\"")
        self.display("infos.txt=\""+self.infos+"\"")

    def lire_cache(self):
        if os.path.exists(self.cache) == False:
            time.sleep(0.2)
            #return False
            return True
        with open(self.cache, 'r') as cache:
            logger.debug("read cache")
            message = cache.read()
        try:
            mydict = json.loads(message)
        except:
            logger.debug("error json load ["+str(message)+"]")
            pass
            return True
        #logger.debug(str(mydict))
        if self.loopm > 600:
            # affichage toutes les minutes
            logger.debug(str(mydict))
            self.loopm = 0
            if self.date != mydict["lt"]:
                self.date = mydict["lt"]
                self.display("date.txt=\""+self.date+"\"")
            if self.ip != mydict["ip"]:
                self.ip = mydict["ip"]
                self.display("ip.txt=\""+self.ip+"\"")
            if self.circuit != mydict["circuit"]:
                self.circuit = mydict["circuit"]
                self.display("circuit.txt=\""+self.circuit+"\"")
            if self.date != mydict["date"] and mydict["date"] != "":
                self.date = mydict["date"]
                self.display("date.txt=\""+self.date+"\"")
        self.loopm = self.loopm+1

        if self.loops > 10:
            # affichage toutes les secondes
            if self.nbsats != mydict["nbsats"]:
                self.nbsats = mydict["nbsats"]
                self.display("nbsats.val=8*"+str(self.nbsats)+"/12")
            if self.tempcpu != mydict["tempcpu"]:
                self.tempcpu = mydict["tempcpu"]
                self.display("tempcpu.val="+str(round(self.tempcpu)))
            if self.time != mydict["lt"] and mydict["lt"] != "":
                self.time = mydict["lt"]
                self.display("time.txt=\""+self.time+"\"")
                
            # afficher les infos
            self.previnfos = self.infos
            if mydict["pitin"] == "true":
                self.infos = "pitlane drive carefully"
            elif mydict["lap"] < 2:
                    self.infos = "first few laps, drive carefully"
            else:
                self.infos = " "
            if self.infos == " " and self.infos != self.previnfos:
                self.display("infos.txt=\" \"")
            elif self.infos != " ":
                self.display("infos.txt=\""+self.scr.get_scroll(self.infos)+"\"")
             
            self.loops = 0
        self.loops = self.loops+1
        
        # affichage tous les 1/10
        if self.lap != mydict["lap"]:
            if self.t0 == " ":
                self.t0 = "Lap"
                self.display("t0.txt=\""+self.t0+"\"")
            self.lap = mydict["lap"]
            self.display("lap.txt=\""+str(self.lap)+"\"")
        if self.tt != mydict["temps_tour"]:
            self.tt = mydict["temps_tour"]
            self.display("tt.txt=\""+self.tt+"\"")
        if self.best != mydict["best_lap"]:
            if self.t1 == " ":
                self.t1 = "Best"
                self.display("t1.txt=\""+self.t1+"\"")
            self.best = mydict["best_lap"]
            self.display("best.txt=\""+self.best+"\"")
        if self.tec != mydict["temps_en_cours"]:
            self.tec = mydict["temps_en_cours"]
            self.display("tec.txt=\""+self.tec+"\"")
        if self.gain != mydict["gain"]:
            self.gain = mydict["gain"]
            self.display("gain.txt=\""+self.gain+"\"")
        if self.vitesse != mydict["vitesse"]:
            self.vitesse = mydict["vitesse"]
            self.display("vitesse.txt=\""+str(round(self.vitesse))+"km/h\"")
 

        time.sleep(0.1)
        return True

    def display(self,command):
        logger.debug(str(command))
        ser.write(command.encode())
        ser.write(k)
        ser.write(k)
        ser.write(k)    

    def boucle(self):
        running = True
        while running == True:
            running = self.lire_cache()

if __name__ == '__main__':
    scr = ScrollControl(30)
    scr.start()
    try:
        DisplayScreen(scr).boucle()
                
    except KeyboardInterrupt:
        print("User Cancelled (Ctrl C)")
            
    except:
        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        raise
        
    finally:
        scr.stop()
        scr.join()
        print("END")
#{"ip": "192.168.1.93", "circuit": "Pau Arnos", "gpsfix": 1, "nbsats": 10, "dbtracks": 1, "autotrack": 1, "startlat1": 43.447024761764254, "startlon1": -0.5327625930348194, "startlat2": 43.4471440287655, "startlon2": -0.5324297233377511, "date": "06/07/2012", "time": "08:57:38", "tempcpu": 49, "volts": "volt=1.3000V", "lt": "09:57:38", "distcircuit": 7, "gpsdate": "060712", "gpstime": "085738.800", "latitude": 43.4450673, "longitude": -0.5297469333333333, "vitesse": 12.386176, "altitude": 209.655, "cap": 30.507706, "chrono_begin": true, "chrono_started": true, "pitin": false, "pitout": false, "nblap": 11, "lap": 11, "temps_tour": "01:26.80", "best_lap": "01:26.80", "temps_t": "14:54.76", "temps_en_cours": "02:28.43", "temps_inter": "00:29.09", "temps_i": "15:59.69", "sect": ["00:13.61", "00:22.21", "00:29.09"]}

# page 3
# date.txt="15/12/2023"
# time.txt="09:57:38"
# nbsats.val=8*100/12
# tempcpu.val=66
# circuit.txt="Pau-Arnos"
# 
# t0.txt="Lap"
# lap.txt="11"
# tt.txt="01:30.59"
# t1.txt="Best"
# best.txt="01:27.32"
# tec.txt="01:28.65"
# gain.txt="+01.33"
# vitesse.txt="169km/h"
# 
# infos.txt="Start Line cut"
# ip.txt="192.168.1.93"

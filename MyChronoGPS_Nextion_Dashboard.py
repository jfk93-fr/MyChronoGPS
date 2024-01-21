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
#from datetime import timedelta, datetime, tzinfo
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

MILES_KM = 1.609344 # 1 mile = 1609.344 m
MpH = 0 # 1=speed in miles per hour or 1=speed in kilometer per hour

parms = ""
from MyChronoGPS_Parms import Parms
# we start by reading the parameters ...
parms = Parms(Path)

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
logger.info(cmdgps+' begin')

#######################################################################################

lg = len(sys.argv)
numport = 1
if lg >= 2:
    numport = int(sys.argv[1])

SerialPort = "ttyUSB0"
if numport == 1:
    el_parms = parms.get_parms("ScreenPort")
    if "ScreenPort" in parms.params:
        SerialPort = el_parms
elif numport == 2:
    el_parms = parms.get_parms("ScreenPort2")
    if "ScreenPort2" in parms.params:
        SerialPort = el_parms
ScreenRate = 9600
#el_parms = parms.get_parms("ScreenRate")
#if "ScreenRate" in parms.params:
#    ScreenRate = el_parms
#print(str(ScreenRate))
MpH = 0
el_parms = parms.get_parms("SpeedInMiles")
if "SpeedInMiles" in parms.params:
    MpH = int(el_parms)

bTimer = False # timer for blink
dTimer = False

# list of commands
DISPLAY = "D"
DISPLAY_BIG = "H"
DISPLAY_SMALL = "S"
DISPLAY_MENU = "M"
CLEAR = "C"
#BLACK = "B"
#CONTRAST = "A"
POWER_OFF = "X"

SERIAL_PORT = "/dev/"+str(SerialPort)
print(str(SERIAL_PORT))
# Connect to the Nextion screen
try:
    ser = serial.Serial(SERIAL_PORT, baudrate = ScreenRate, timeout = 1)
except:
    logger.error("Application serial error! "+str(SerialPort))
    exit(1)
print("connected to serial")

class ScrollControl(threading.Thread):
    def __init__(self,max):
        threading.Thread.__init__(self)
        self.scroll = 0
        self.max = max
        self.infos = " "
        self.blink = 0
        self.light = 1
    def run(self):
        self.__running = True
        while self.__running:
            if self.scroll > self.max:
                self.scroll = 0
            self.scroll = self.scroll + 1
            #if self.blink == 1:
            #    self.light = self.light * -1
            #else:
            #    self.light = 1
            time.sleep(0.3)
    def stop(self):
        self.__running = False
    def get_scroll(self,infos):
        if infos != self.infos:
            self.scroll = 0
        self.infos = infos
        #logger.info(str(self.scroll)+"/"+str(self.max)+" "+self.infos)
        scroll_info = self.infos+" "+self.infos+" "+self.infos
        scroll_info = scroll_info[self.scroll:self.scroll+self.max]
        return scroll_info

    def set_blink(self,blink):
        self.blink = blink
    
    def get_light(self):
        if self.light == 1:
            return 0
        else:
            return 65535
            
    def set_light(self):
        global bTimer
        if self.blink == 1:
            self.light = self.light * -1
        else:
            self.light = 1
        #logger.info("light:"+str(self.light)+" blink:"+str(self.blink))
        bTimer = False
    
class DisplayScreen():

    def __init__(self,scr):
        self.scr = scr
        
        self.cache = pathdata+'/cache/DASHBOARD'
        #logger.debug("cache file:"+self.cache)
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
        self.blink = 0
        self.light = 0
        self.delay = 0
        
        self.loopm = 999
        self.loops = 999

        self.display("ip.txt=\""+self.ip+"\"")
        self.display("date.txt=\""+self.date+"\"")
        self.display("time.txt=\""+self.time+"\"")
        self.display("nbsats.val=8*"+str(self.nbsats)+"/20")
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
        global bTimer
        global dTimer
        if os.path.exists(self.cache) == False:
            time.sleep(0.2)
            #return False
            return True
        with open(self.cache, 'r') as cache:
            message = cache.read()
        try:
            mydict = json.loads(message)
        except:
            #logger.debug("error json load ["+str(message)+"]")
            pass
            return True

        #logger.debug(str(mydict["running"]))
        if mydict["running"] == False:
            return False
            
        if "lt" in mydict:
            lt = mydict["lt"]
        else:
            time.sleep(1)
            return True
            
        if self.loopm > 100:
            # affichage toutes les 10 secondes
            #logger.debug(str(mydict))
            self.loopm = 0
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
                #logger.debug("nb sats:"+str(self.nbsats))
                nbsats = self.nbsats
                if nbsats > 12:
                    nbsats = 12
                level = str(round((nbsats/12)*100))
                #logger.debug("["+str(level)+"]")
                dmsg="nbsats.val="+str(level)
                #self.display("nbsats.val=8*"+str(self.nbsats)+"/12")
                #dmsg="nbsats.val=8*"+str(self.nbsats)+"/12"
                #logger.debug("["+str(dmsg)+"]")
                self.display(dmsg)
            if self.tempcpu != mydict["tempcpu"]:
                self.tempcpu = mydict["tempcpu"]
                self.display("tempcpu.val="+str(round(self.tempcpu)))
            if self.time != mydict["lt"] and mydict["lt"] != "":
                self.time = mydict["lt"]
                self.display("time.txt=\""+self.time+"\"")
                
            # afficher les infos
            self.previnfos = self.infos
            #logger.info(str(mydict["infos"]))
            if mydict["infos"] != " ":
                self.infos = mydict["infos"].replace("//","  ")
                if mydict["infos"].find('//') > 0:
                    buffer = mydict["infos"].split('//')
                    if "Secteur" in buffer[0] or "Lap" in buffer[0]:
                        self.infos = buffer[0]+" "+buffer[1]
            elif mydict["pit"] == True:
                self.infos = "pitlane drive carefully"
                self.scr.set_blink(1)
            elif mydict["lap"] < 2:
                self.infos = "first few laps, drive carefully"
                self.scr.set_blink(1)
            else:
                self.infos = " "
                self.scr.set_blink(0)
            #if self.infos != " " and self.infos != self.previnfos:
            #    logger.info(str(self.infos))
            if self.infos == " " and self.infos != self.previnfos:
                self.display("infos.txt=\" \"")
            elif self.infos != " ":
                self.display("infos.txt=\""+self.scr.get_scroll(self.infos)+"\"")
             
            self.loops = 0
        self.loops = self.loops+1

        if bTimer == False:
            bTimer = Timer(0.8, self.scr.set_light)
            bTimer.start()  # after 0.8 second, the blink is done
        self.do_blink(scr)
        
        # affichage tous les 1/10
        if self.lap != mydict["lap"]:
            #if self.t0 == " ":
            #    self.t0 = "Lap"
            #    self.display("t0.txt=\""+self.t0+"\"")
            self.lap = mydict["lap"]
            self.display("lap.txt=\"L"+str(self.lap)+"\"")
        if self.tt != mydict["temps_tour"] and mydict["temps_tour"] != "00:00.00":
            self.tt = mydict["temps_tour"]
            self.display("tt.txt=\""+self.tt+"\"")
            self.delay = 1
            self.display("tec.txt=\""+self.tt+"\"")

        if dTimer == False and self.delay == 1:
            dTimer = Timer(3.0, self.clear_delay)
            dTimer.start()  # after 0.8 second, the blink is done
            
        if self.best != mydict["best_lap"] and mydict["best_lap"] != "00:00.00":
            #if self.t1 == " ":
            #    self.t1 = "Best"
            #    self.display("t1.txt=\""+self.t1+"\"")
            self.best = mydict["best_lap"]
            self.display("best.txt=\"B:"+self.best+"\"")
        if self.tec != mydict["temps_en_cours"] and self.delay == 0:
            self.tec = mydict["temps_en_cours"]
            self.display("tec.txt=\""+self.tec[0:5]+":00\"")
        if self.gain != mydict["gain"]:
            self.gain = mydict["gain"]
            self.display("gain.txt=\""+self.gain+"\"")
        if self.vitesse != mydict["vitesse"]:
            self.vitesse = mydict["vitesse"]
            if MpH == 1:
                miph = self.vitesse/MILES_KM
                self.display("vitesse.txt=\""+str(round(miph))+"mi/h\"")
            else:
                self.display("vitesse.txt=\""+str(round(self.vitesse))+"km/h\"")

        time.sleep(0.09)
        return True

    def display(self,command):
        #logger.debug(str(command))
        ser.write(command.encode())
        ser.write(k)
        ser.write(k)
        ser.write(k)    

    def boucle(self):
        self.__running = True
        while self.__running == True:
            self.__running = self.lire_cache()
        self.display("page 0")
        self.display("L1.txt=\"end of\"")
        self.display("L2.txt=\"MyChronoGPS\"")
        time.sleep(5)
        self.display("L1.txt=\"\"")
        self.display("L2.txt=\"\"")

    def do_blink(self,scr):
        light = scr.get_light()
        #logger.info("light:"+str(light)+" blink:"+str(scr.blink))
        if scr.blink == 1:
            if light == 0:
                self.display("infos.bco=0")
                self.display("infos.pco=65535")
            else:
                self.display("infos.bco=65535")
                self.display("infos.pco=0")
        else:
            self.display("infos.bco=0")
            self.display("infos.pco=65535")
            
    def clear_delay(self):
        global dTimer
        self.delay = 0
        dTimer = False
            
    def stop(self):
        logger.info('stop of '+cmdgps)
        self.__running = False
1
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
#{"ip": "192.168.1.93", "circuit": "Pau Arnos", "gpsfix": 1, "nbsats": 10, "dbtracks": 1, "autotrack": 1, "startlat1": 43.447024761764254, "startlon1": -0.5327625930348194, "startlat2": 43.4471440287655, "startlon2": -0.5324297233377511, "date": "06/07/2012", "time": "08:57:38", "tempcpu": 49, "volts": "volt=1.3000V", "lt": "09:57:38", "distcircuit": 7, "gpsdate": "060712", "gpstime": "085738.800", "latitude": 43.4450673, "longitude": -0.5297469333333333, "vitesse": 12.386176, "altitude": 209.655, "cap": 30.507706, "chrono_begin": true, "chrono_started": true, "pit": false, "nblap": 11, "lap": 11, "temps_tour": "01:26.80", "best_lap": "01:26.80", "temps_t": "14:54.76", "temps_en_cours": "02:28.43", "temps_inter": "00:29.09", "temps_i": "15:59.69", "sect": ["00:13.61", "00:22.21", "00:29.09"]}

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

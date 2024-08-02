#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_Comm
#   Classe de communciation série ou bluetooth selon ce qui est définit en paramètre
#   Utilisé par MyChronoGPS_UBX
#
###########################################################################
from MyChronoGPS_Paths import Paths
Path = Paths();

import os

import time
from datetime import timedelta, datetime, tzinfo

import serial

import sys

from math import *
import json
import subprocess
import shlex
#from bluetooth import *
from MyChronoGPS_Parms import Parms

buf_size = 1024;
buf_size = 65535;
BAUDRATE = 9600 # default value, can be changed in parameters
PORT = 'serial0' # default value, can be changed in parameters

cmdgps =  "MyChronoGPS_Comm"
pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathlog = pathdata+'/log/'

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

class Comm(): # classe qui gère les communication série & bluetooth

    def __init__(self):
        global PORT
        global BAUDRATE
        self.parms = Parms(Path)
        self.gpsport = PORT
        if "GPSPort" in self.parms.params:
            self.gpsport = self.parms.params["GPSPort"]
        self.serialrate = BAUDRATE
        if "SerialRate" in self.parms.params:
            BAUDRATE = self.parms.params["SerialRate"]
        self.GPSRate = 1 # original frequency = 1hz
        if "GPSRate" in self.parms.params:
            self.GPSRate = self.parms.params["GPSRate"]

        self.GPSBlueTooth = 0 # use serial, no bluetooth
        if "GPSBlueTooth" in self.parms.params:
            self.GPSBlueTooth = self.parms.params["GPSBlueTooth"]
        self.GPSMacAddress = False
        if "GPSMacAddress" in self.parms.params:
            self.GPSMacAddress = self.parms.params["GPSMacAddress"]

        self.commSerial = False
        
        self.commSerial = serial.Serial()

    def open(self):
        device = "/dev/"+self.gpsport
        self.commSerial.baudrate = BAUDRATE
        self.commSerial.port = device
        self.commSerial.parity=serial.PARITY_NONE
        self.commSerial.stopbits=serial.STOPBITS_ONE
        self.commSerial.bytesize=serial.EIGHTBITS
        self.commSerial.timeout=1
        #
        self.commSerial.open()
        logger.info("communication with "+str(device)+" established at "+str(BAUDRATE)+" bauds")
        #print("communication with "+str(self.commSerial.port)+" established at "+str(BAUDRATE)+" bauds")

    def close(self):
        self.commSerial.close()
        
    def readline(self):
        busy = 1
        strline = False
        while busy==1:
            try:
                #x=self.commSerial.read().decode()
                x=self.commSerial.read()
                #strline += str(x)
                strline += x
                #print(strline)
                if str(x) == '\n':
                    busy = 0
            except:
                busy = 0
        return strline

    def rx(self):
        #data = self.commSerial.readline()
        data = self.readline()
        return data
        
    def tx(self,str):
        self.commSerial.write(str)

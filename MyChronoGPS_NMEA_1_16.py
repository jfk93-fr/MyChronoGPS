#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_NMEA
#   class for parsing NMEA frames
#
#   Version 1_16
#
###########################################################################
from __future__ import division, absolute_import, unicode_literals
#VERSION = "1_16"
from MyChronoGPS_Version import Versions
Version = Versions();
VERSION = Version.VERSION

import os

import time
from datetime import timedelta, datetime, tzinfo

import sys

from threading import Thread

from math import *
import json
import subprocess
import shlex

FREE = 0
BUSY = 1

ON = 1
OFF = 0

NOEUD_KM = 1.852 # 1 nautical mile = 1852 m

def get_baudrate(device):
       command = 'stty -F {0}'.format(device)
       proc_retval = subprocess.check_output(shlex.split(command))
       baudrate = int(proc_retval.split()[1])
       return baudrate

pathcmd = Version.pathcmd
pathdata = Version.pathdata
idlog =  "MyChronoGPS_NMEA_"+VERSION
pathlog = pathdata+'/log'
pathtraces = pathdata+'/traces'

#######################################################################################
# we will use the logger to replace print
#######################################################################################
import logging
from logging.handlers import TimedRotatingFileHandler
FORMATTER = logging.Formatter("%(asctime)s — %(name)s — %(funcName)s — %(levelname)s — %(lineno)d — %(thread)d — %(message)s")
LOG_FILE = pathlog+'/'+idlog+".log"
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
logger.info('start of '+idlog)
#######################################################################################
from MyChronoGPS_Parms import Parms

class NmeaControl():
    INVALID = 0
    VALID = 1
    NMEA = ""
        
    def __init__(self):
        self.parms = Parms(Version)
        self.gpsfix = self.VALID
        self.localdatetime = ""
        self.timeshift = 0
        self.gpstime = 0.
        self.gpsdate = "010101"
        self.latitude = 0
        self.longitude = 0
        self.Freq = 0 # gps refresh rate
        self.gpstrames = []
        self.gpscomplete = False
        self.gpsrmcgga = 0
        
        self.nmeatime = 0 # time of the current frame (if the information is present in the frame)
        self.packettime = 0 # time of the current frame packet; information is sent to the pipe in case of change
        
        self.gpslat  = 0
        self.gpslatH = ""
        self.gpslon  = 0
        self.gpslonH = ""        
        self.gpsvitesse = 0
        self.gpsnbsat = 0
        self.gpsalt = 0
        
        self.fifo = pathcmd+'/pipes/NMEA' # the NMEA pipe will be read by the Chrono program
        fileObj = os.path.exists(self.fifo)
        if fileObj == False:
            self.creer_fifo()
            fileObj = os.path.exists(self.fifo)
        
        self.buffer = ""
        
        self.gpsdict = dict() # data dictionary for the Chrono
        
        self.track_mode = ON

        self.tracker = self.TrackerControl(self) # the class takes over the tracking
        self.write_busy = False
        
        self.GpsTrackerMode = 0
        if "GpsTrackerMode" in self.parms.params:
            self.GpsTrackerMode = self.parms.params["GpsTrackerMode"]
        if self.GpsTrackerMode != 1:
            self.track_mode = OFF
        # "GpsTrackerEcoMode : fréquence d'acquisition du tracker. 0=OFF (acquisition=fréquence GPS), 1=ON(1 acquisition/seconde)"
        self.GpsTrackerEcoMode = 0
        if "GpsTrackerEcoMode" in self.parms.params:
            self.GpsTrackerEcoMode = self.parms.params["GpsTrackerEcoMode"]
        GpsTrackerMinSpeed = 0
        if "GpsTrackerMinSpeed" in self.parms.params:
            self.GpsTrackerMinSpeed = self.parms.params["GpsTrackerMinSpeed"]
        logger.info("track_mode="+str(self.track_mode))
        logger.info("GpsTrackerMinSpeed="+str(self.GpsTrackerMinSpeed))

        self.CoordsPrecision = 0
        self.precis = 1
        if "CoordsPrecision" in self.parms.params:
            self.CoordsPrecision = self.parms.params["CoordsPrecision"]
        if self.CoordsPrecision > 0:
             self.precis = pow(10,self.CoordsPrecision)
        logger.info("precision="+str(self.precis))
        
        logger.info("NmeaControl init complete")

    def creer_fifo(self):
        try:
            os.mkfifo(self.fifo)
            os.chmod(self.fifo, 0o777)
            logger.debug("fifo NMEA is ready")
        except OSError:
            logger.error("OSError")
            pass
        
    def parse(self,sentence):
        logger.debug("sentence to parse: "+str(sentence))
        if sentence == "":
            return

        self.gpstrames.append(sentence)
        self.NMEA = sentence.split(",")
        # the first element starts with $, followed by 2 characters identifying the sender of the frame, followed by 3 characters identifying the frame
        talker_indicator = self.NMEA[0]
        if str(talker_indicator)[0:1] != '$':
            print(("no talker indicator ("+str(talker_indicator)+")"))
            logger.setLevel(logging.DEBUG)
            logger.debug(str(self.NMEA))
            return
        self.idsender = talker_indicator[1:3]
        self.idtrame = talker_indicator[3:6]
        
        self.getTimeNmea() # we will search for a time in the frame
        
        # we see if the time has changed with respect to the time of the package
        logger.debug("times nmea/packet:"+str(self.nmeatime)+"/"+str(self.packettime))
        try:
            if float(self.nmeatime) > 0: # does the current frame have time
                if float(self.packettime) > 0: # is there a time associated with the package
                    if self.nmeatime != self.packettime:
                        self.createPacket()
                    else:
                        self.gpscomplete = False
                else: # the package had no time
                    self.packettime = self.nmeatime # now he has one
        except:
            pass
                
        if (self.idtrame == "GGA"):
            if (len(self.NMEA)<12):
                logger.error("invalid GGA:"+sentence)
                self.gpsfix = self.INVALID
            else:
                self.gpslat  = self.NMEA[2]
                self.gpslatH = self.NMEA[3]
                self.gpslon  = self.NMEA[4]
                self.gpslonH = self.NMEA[5]
                if (self.NMEA[6] == "1" or self.NMEA[6] == "2"):
                    self.gpsfix = self.gpsfix & self.VALID
                    self.gpsrmcgga = self.gpsrmcgga + 1
                else:
                    self.gpsfix = self.INVALID
                self.gpsnbsat = self.NMEA[7]
                self.gpsdop = self.NMEA[8]
                self.gpsalt = self.NMEA[9]
                self.gpsaltU = self.NMEA[10]
                self.gpscorr = self.NMEA[11]
                self.gpscorrM = self.NMEA[12] 

        if (self.idtrame == "RMC"):
            if (len(self.NMEA)<9):
                logger.error("invalid RMC:"+sentence)
                self.gpsfix = self.INVALID
            else:
                if (self.NMEA[2] == "A"):
                    self.gpsfix = self.gpsfix & self.VALID
                    self.gpsrmcgga = self.gpsrmcgga + 1
                else:
                    self.gpsfix = self.INVALID
                self.gpslat  = self.NMEA[3]
                self.gpslatH = self.NMEA[4]
                self.gpslon  = self.NMEA[5]
                self.gpslonH = self.NMEA[6]
                self.gpsvitesse = 0.
                if self.NMEA[7] != "":
                    try:
                        self.gpsvitesse = float(self.NMEA[7]) * NOEUD_KM
                    except:
                        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])                    
                        self.gpsfix = self.INVALID
                self.gpscap = 0.
                if self.NMEA[8] != "":
                    try:
                        self.gpscap = float(self.NMEA[8])
                    except:
                        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])                    
                        self.gpsfix = self.INVALID
                self.gpsdate = self.NMEA[9]
        
    def getTimeNmea(self):
        self.nmeatime = 0
        if self.idtrame == "GGA" or self.idtrame == "RMC" or self.idtrame == "ZDA" or self.idtrame == "GNS" \
        or self.idtrame == "GRS" or self.idtrame == "GST" or self.idtrame == "GXA" or self.idtrame == "TRF" \
        or self.idtrame == "ZFO" or self.idtrame == "ZTG": 
            self.nmeatime = self.NMEA[1]
            return
        elif self.idtrame == "GLL": 
            self.nmeatime = self.NMEA[5]
            return
        elif self.idtrame == "RLM": 
            self.nmeatime = self.NMEA[5]
            return
        elif self.idtrame == "TLL": 
            self.nmeatime = self.NMEA[7]
            return
        elif self.idtrame == "TLM": 
            self.nmeatime = self.NMEA[14]
            return
        elif self.idtrame == "PUBX":
            if self.NMEA[1] == "00" or self.NMEA[1] == "01" or self.NMEA[1] == "04":
                self.nmeatime = self.NMEA[2]
            return
        return
            
    def createPacket(self):
        logger.debug("gpsrmcgga:"+str(self.gpsrmcgga))
        if self.gpsrmcgga < 2: # the data is not complete, the package is not created
            self.gpsrmcgga = 0
            self.packettime = self.nmeatime
            return
        self.gpstime = self.packettime
        # we will calculate the local time and date
        logger.debug("["+str(self.nmeatime)+"/"+str(self.packettime)+"]")
        JJ = int(self.gpsdate[0:2])
        MM = int(self.gpsdate[2:4])
        AA = int("20"+self.gpsdate[4:6])
        hh = int(self.gpstime[0:2])
        mm = int(self.gpstime[2:4])
        ss = int(self.gpstime[4:6])
        ld = datetime(AA,MM,JJ,hh,mm,ss)
        self.localdatetime = ld + timedelta(hours=self.timeshift)
            
        self.latitude = degrees_to_decimal(self.gpslat,self.gpslatH)
        self.longitude = degrees_to_decimal(self.gpslon,self.gpslonH)

        if self.Freq == 0: # we will calculate the GPS pulse rate once
            self.Freq = int(abs(1 / (float(self.nmeatime) - float(self.packettime))))

        # we send the packet
        self.send()
        self.track(self.gpstrames) # sending frames to the tracker
        self.gpstrames = []

        self.packettime = self.nmeatime
        self.gpsrmcgga = 0
        self.gpscomplete = True;
        
    def send(self):
        # fill the dictionary
        # reduce the name of the keys to write fewer characters
        self.gpsdict['l'] = self.latitude
        self.gpsdict['L'] = self.longitude
        # if self.precis > 1:
        #     self.gpsdict['l'] = round(self.latitude*precis)/precis
        #     self.gpsdict['L'] = round(self.longitude*precis)/precis
        self.gpsdict['v'] = self.gpsvitesse
        self.gpsdict['ns'] = int(self.gpsnbsat) if self.gpsnbsat != "" else 0
        self.gpsdict['a'] = float(self.gpsalt) if self.gpsalt != "" else 0.0 
        self.gpsdict['c'] = float(self.gpscap) if self.gpscap != "" else 0.0 
        self.gpsdict['d'] = self.gpsdate
        self.gpsdict['t'] = self.gpstime
    
        sentence = json.dumps(self.gpsdict)
        logger.debug(str(self.buffer))
        logger.debug(str(sentence))
        if sentence != self.buffer:
           self.buffer = sentence
           self.write(self.buffer)

    def write(self,buff):
        if self.track_mode == OFF:
            return
        while self.write_busy == True:
            time.sleep(0.1)
        self.write_busy = True

        try:
            pipe = os.open(self.fifo, os.O_WRONLY, os.O_NONBLOCK)
            if True:
                os.write(pipe, str(buff+'\r\n').encode())
                os.close(pipe)
        except OSError as err:
            logger.error("cannot use named pipe OS error: {0}".format(err))
            self.track_mode = OFF
            pass
        self.write_busy = False
            
    def track(self,trames):
        logger.debug("track_mode:"+str(self.track_mode))
        if self.track_mode == OFF:
            return
        logger.debug("track:"+str(trames))
        self.tracker.write(trames)
        return
        
    def stop(self):
        logger.info("stop NmeaControl")
        self.tracker.stop()
        
    class TrackerControl():
        CLOSED = 0
        OPEN = 1

        def __init__(self,gps):
            self.gps = gps
            self.__current_state = self.CLOSED
            self.thread_count = 3 # up to 3 write threads
            logger.info("TrackerControl init complete")
    
        def start(self):
            if self.__current_state != self.OPEN:
                self.fileDescriptor = open(pathtraces+'/traces-'+formatGpsDateTime(self.gps,format="FILE")+'.nmea', 'a')
                self.__current_state = self.OPEN
                logger.info("tracker file open")
            
        def stop(self):
            if self.__current_state != self.CLOSED:
                self.fileDescriptor.close()
                self.__current_state = self.CLOSED
                logger.info("tracker file closed")
            
        def write(self,tab):
            trames = tab
            if self.__current_state != self.OPEN:
                self.start()
            if self.__current_state == self.OPEN:
                logger.debug("trackable frames:"+str(trames))
                #logger.info("vitesse:"+str(round(self.gps.gpsvitesse))+" "+str(self.gps.GpsTrackerMinSpeed))
                i = 0
                line = ""
                if self.gps.GpsTrackerMinSpeed > round(self.gps.gpsvitesse):
                    trames = ""
                while i < len(trames):
                    line = str(trames[i])
                    i = i+1
                    # here, we can select the frames to be tracked
                    #if (self.gps.NMEA[0] == "$GPGGA" or self.gps.NMEA[0] == "$GPRMC"):
                    #if "GGA" in self.gps.NMEA[0] or "RMC" in self.gps.NMEA[0]:
                    if line.find("\r\n") < 0:
                        line += "\r\n"
                    self.fileDescriptor.write('{0:}'.format(line))
            else:
                logger.info("unexcepted tracker file closed !")


##        
## technical procedures 
########################
###
# Helper function to take HHMM.SS, Hemisphere and make it decimal:
def degrees_to_decimal(data, hemisphere):
    try:
        decimalPointPosition = data.index('.')
        degrees = float(data[:decimalPointPosition-2])
        minutes = float(data[decimalPointPosition-2:])/60
        output = degrees + minutes
        if hemisphere == 'N' or hemisphere == 'E':
            return output
        if hemisphere == 'S' or hemisphere == 'W':
            return -output
    except:
        return 0.0

def formatGpsDateTime(gps,format=""):
    # receives a gps object and returns a date and time string from gpsdate and gpstime
    timestr = str(gps.gpstime)
    hh = timestr[0:2]
    mm = timestr[2:4]
    ss = timestr[4:6]
    datestr = str(gps.gpsdate)
    JJ = datestr[0:2]
    MM = datestr[2:4]
    AA = datestr[4:6]
    dt = JJ+"/"+MM+'/'+AA+" "+hh+":"+mm
    
    odt = datetime(int("20"+AA),int(MM),int(JJ),int(hh),int(mm),int(ss))
    
    if format == "FILE":
        dt = "20"+AA+MM+JJ+hh+mm+ss
    return dt

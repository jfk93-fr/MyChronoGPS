#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_UBX
#   controls the gps associated with MyChronoGPS (dedicated to UBLOX gps)
#   reads NMEA frames from serial, parses them and sends a list in the NMEA pipe at each pulse
#   supports tracking (GGA and RMC with time only)
#   reads GPS pipe inputs (GPS directives)
#   supports GPS commands (Rate 1 Hz to 10 Hz, Serial Rate 9600 baud - 115200 baud)
#
###########################################################################
# managed by git from VERSION 1.17
from MyChronoGPS_Paths import Paths
Path = Paths();

import os

import time
from datetime import timedelta, datetime, tzinfo

#from serial import Serial
import serial

import threading
import sys

from math import *
import json
import subprocess
import shlex

FREE = 0
BUSY = 1

ON = 1
OFF = 0

BAUDRATE = 9600 # default value, can be changed in parameters
PORT = '/dev/serial0' # default value, can be changed in parameters

NOEUD_KM = 1.852 # 1 nautical mile = 1852 m

# def get_baudrate(device):
#        command = 'stty -F {0}'.format(device)
#        try:
#            proc_retval = subprocess.check_output(shlex.split(command))
#            baudrate = int(proc_retval.split()[1])
#            return baudrate
#        except:
#            return -1

cmdgps =  "MyChronoGPS_UBX"
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
#######################################################################################
from MyChronoGPS_NMEA import NmeaControl
from MyChronoGPS_Parms import Parms
            
class GpsControl(threading.Thread):
    INVALID = 0
    VALID = 1
    NMEA = ""
        
    def __init__(self):
        global PORT
        global BAUDRATE
        threading.Thread.__init__(self)
        self.parms = Parms(Path)
        self.gpsport = PORT
        if "GPSPort" in self.parms.params:
            PORT = self.parms.params["GPSPort"]
        self.serialrate = BAUDRATE
        if "SerialRate" in self.parms.params:
            BAUDRATE = self.parms.params["SerialRate"]
        self.GPSRate = 1 # original frequency = 1hz
        if "GPSRate" in self.parms.params:
            self.GPSRate = self.parms.params["GPSRate"]

        self.nmea = NmeaControl()
        self.serialGps = serial.Serial()

        self.buffstate = BUSY
        self.activateGPS()
        self.gpsfix = self.VALID
        self.localdatetime = ""
        self.timeshift = 0
        self.gpstime = 0.
        self.gpsdate = ""
        self.gpsline = ""
        self.latitude = 0
        self.longitude = 0
        self.prevlat = 0 # prevlat and prevlon are used to calculate the last travelled line segment
        self.prevlon = 0
        self.Freq = 0 # gps refresh rate
        self.gpsggatime = 0
        self.gpsrmctime = 0
        # self.gpstrames = []
        
        #self.buffstate = FREE
        self.buffer = ""
        
        self.gpsdict = dict()
        
        self.gpscomplete = False
        
        self.gpsactiv = True
        
        logger.info("GpsControl init complete")
        
        self.cptparse = 0
        self.commandInProgress = False

    def activateGPS(self):
        # if get_baudrate(PORT) < 0:
        if self.nmea.get_baudrate(PORT) < 0:
            # vérifier le branchement du GPS
            logger.error("communication with the gps cannot be established. Check the gps connection.")
            self.stop()
        else:
            self.serialGps.baudrate = BAUDRATE
            self.serialGps.port = PORT
            #self.serialGps.timeout = 4
            #
            self.serialGps.parity=serial.PARITY_NONE
            self.serialGps.stopbits=serial.STOPBITS_ONE
            self.serialGps.bytesize=serial.EIGHTBITS
            self.serialGps.timeout=1
            #
            self.serialGps.open()
            logger.info("communication with "+str(PORT)+" established at "+str(BAUDRATE)+" bauds")
            self.enable()

    def closeSerialGPS(self):
        self.disable()
        self.serialGps.close()
        
    def run(self):
        self.__running = True
        cpt = 0
        while self.__running:
            while (self.buffstate == BUSY):
                if (cpt > 1000):
                    # we've been waiting for more than a second !
                    print("watch out abnormal !")
                    time.sleep(10)
                cpt = cpt + 1
                time.sleep(0.01)
            if self.buffstate == FREE:
                #self.gpsline = str(self.serialGps.readline().decode('UTF-8'))
                gpsline = self.serialGps.readline()
                # print(gpsline)
                self.gpsline = str(gpsline)
                # print(self.gpsline)

                try:
                    self.gpsline = gpsline.decode()
                    # self.nmea.tracker.write(self.gpsline) # write sentence in trace file
                except: # si la fonction decode n'a pas marché, c'est que le gps a envoyé une séquence en binaire
                    logger.info("decode failed")
                    # chkdata = gpsline.split("\r\n")
                    # logger.info("chkdata:"+str(chkdata[0]))
                    self.gspline = str(gpsline)
                
                # self.nmea.tracker.write(self.gpsline) # write sentence in trace file

                # is the frame valid ?
                cksum = chksum_nmea(self.gpsline)
                
                if cksum != False:
                    # self.gpstrames.append(self.gpsline)
                    self.nmea.parse(self.gpsline) # parse sentence to send to chrono
                    # traces only valid frames
                    self.nmea.tracker.write(self.gpsline) # write sentence in trace file
                else:
                    logger.debug("bad checksum:"+self.gpsline)
                self.gpscomplete = self.nmea.gpscomplete
            else:
                logger.debug("wait for buffer:"+str(self.buffstate))
                time.sleep(0.01)
            # logger.info("running:"+str(self.__running))

        #
        self.nmea.remove_fifo()

        logger.info("end of GpsControl Thread of GPS program")
        
    def stop(self):
        self.gpsactiv = False
        # logger.debug("stop gps, activ:"+str(self.gpsactiv))
        logger.info("stop gps, activ:"+str(self.gpsactiv))
        #jfk
        self.__running = False
        buffer = self.nmea.read()
        print(str(buffer))
        
    def disable(self):
        self.buffstate = BUSY
        
    def enable(self):
        self.buffstate = FREE

class GpsCommand(threading.Thread):
        
    def __init__(self,gps):
        threading.Thread.__init__(self)
        self.gps = gps
        self.ubxCfgOrig = b"\x6A\xB5\x62\x06\x09\x0D\x00\xFF\xFB\x00\x00\x00\x00\x00\x00\xFF\xFF\x00\x00\x03\x17\x6A"
        self.taux = ["9600","19200","38400","57600","115200"]
        self.ubxBaud = [b"\x6A\xB5\x62\x06\x00\x14\x00\x01\x00\x00\x00\xD0\x08\x00\x00\x80\x25\x00\x00\x03\x00\x03\x00\x00\x00\x00\x00\x9E\x95\x6A\xB5\x62\x06\x00\x00\x00\x06\x18", \
                   b"\x6A\xB5\x62\x06\x00\x14\x00\x01\x00\x00\x00\xD0\x08\x00\x00\x00\x4B\x00\x00\x03\x00\x03\x00\x00\x00\x00\x00\x44\x37\x6A\xB5\x62\x06\x00\x00\x00\x06\x18", \
                   b"\x6A\xB5\x62\x06\x00\x14\x00\x01\x00\x00\x00\xD0\x08\x00\x00\x00\x96\x00\x00\x03\x00\x03\x00\x00\x00\x00\x00\x8F\x70\x6A\xB5\x62\x06\x00\x00\x00\x06\x18", \
                   b"\x6A\xB5\x62\x06\x00\x14\x00\x01\x00\x00\x00\xD0\x08\x00\x00\x00\xE1\x00\x00\x03\x00\x03\x00\x00\x00\x00\x00\xDA\xA9\x6A\xB5\x62\x06\x00\x00\x00\x06\x18", \
                   b"\x6A\xB5\x62\x06\x00\x14\x00\x01\x00\x00\x00\xD0\x08\x00\x00\x00\xC2\x01\x00\x03\x00\x03\x00\x00\x00\x00\x00\xBC\x5E\x6A\xB5\x62\x06\x00\x01\x00\x01\x08\x22"]
        
        self.baud = "9600"
        
        self.freq = "1"
        self.tfreq = ["1","2","5","10"]
        self.ubxHz = [b"\xB5\x62\x06\x08\x06\x00\xE8\x03\x01\x00\x01\x00\x01\x39\xB5\x62\x06\x08\x00\x00\x0E\x30", \
                      b"\xB5\x62\x06\x08\x06\x00\xF4\x01\x01\x00\x01\x00\x0B\x77\xB5\x62\x06\x08\x00\x00\x0E\x30", \
                      b"\xB5\x62\x06\x08\x06\x00\xC8\x00\x01\x00\x01\x00\xDE\x6A\xB5\x62\x06\x08\x00\x00\x0E\x30", \
                      b"\xB5\x62\x06\x08\x06\x00\x64\x00\x01\x00\x01\x00\x7A\x12\xB5\x62\x06\x08\x00\x00\x0E\x30"]
                      
        self.tmess = ["GSA","GSV","GLL","VTG","TXT"]
        
        self.ubxQRate = b"\x6A\xB5\x62\x06\x08\x00\x00\x0E\x30"

        #
        if self.gps.GPSRate != 1: # change the frequency of the gps
            self.changeFreq(str(self.gps.GPSRate))
            
        for mess in self.tmess:
            self.changeMessageOutput("0"+mess)
        
        self.fifo = pathcmd+'/pipes/GPSCMD' # the GPS pipe contains the commands to pass to the GPS, it will be written by the main program of MyChronoGPS
        fileObj = os.path.exists(self.fifo)
        if fileObj == False:
            self.creer_fifo()
            fileObj = os.path.exists(self.fifo)
        else:
            logger.info("fifo GPS already exists")
        
        print("GpsCommand init complete")

    def creer_fifo(self):
        try:
            os.mkfifo(self.fifo)
            os.chmod(self.fifo, 0o777)
            trial = os.path.exists(self.fifo)
            while trial == False:
                time.sleep(0.5)
                trial = os.path.exists(self.fifo)
            logger.debug("fifo GPSCMD is ready")
        except OSError:
            logger.error("OSError")
            pass

    def remove_fifo(self):
        fileObj = os.path.exists(self.fifo)
        if fileObj == True:
            logger.info("fifo GPSCMD is beeing removed")
            os.remove(self.fifo)
        
    def run(self):
        self.__running = True
        cpt = 0
        while self.__running:
            self.lire_fifo()
            time.sleep(0.5) # wait            

        self.gps.stop()
        time.sleep(0.5) # wait            

        self.remove_fifo()
        
        logger.info("end of GpsCommand Thread of GPS program")

    def lire_fifo(self):
        logger.info("lire fifo GPSCMD")
        with open(self.fifo, 'r') as fifo:
            message = fifo.read().strip()
        logger.info("message:["+message+"]")
        commande = message[0:1]
        logger.info("commande:["+commande+"]")
        texte = message[1:].split('\n')
        texte = texte[0]
        if commande == "B": # change baudrate
            self.commandInProgress = True
            self.changeBaudRate(texte)

        elif commande == "F": # change frequency
            self.commandInProgress = True
            self.changeFreq(texte)
            
        elif commande == "M": # control of sending messages
            self.commandInProgress = True
            self.changeMessageOutput(texte)

        elif commande == "E": # End, GPS program shutdown
            logger.info("gps stop")
            self.__running = False
            # self.gps.stop()
            # self.stop()
            
        else:
            logger.error("invalid command:["+str(commande)+"]")
            return

        time.sleep(0.2)
        self.commandInProgress = False

    def changeBaudRate(self,str):
        texte = str
        logger.info("texte:["+texte+"]")
        # the text is controlled
        if texte not in self.taux:
            logger.info("poor link speed:["+str(texte)+"]")
            logger.info("valid speed:["+str(self.taux)+"]")
            return
        if texte in self.taux:
            i=self.taux.index(texte)
        cmd=self.ubxBaud[i]

        self.gps.disable() # stop the GPS reading
        time.sleep(1) # wait
        # we send the command to the GPS
        logger.info("send command to GPS:"+str(cmd))
        self.write(cmd)
        time.sleep(0.5) # wait
        # communication with the serial port is closed
        self.gps.closeSerialGPS()
        time.sleep(1.5)
        self.gps.serialGps.baudrate = int(texte)
        self.gps.serialGps.open()
        time.sleep(0.5) # we wait a bit
        self.gps.enable() # GPS reading is activated       

    def changeFreq(self,str):
        texte = str
        # the text is controlled
        if texte not in self.tfreq:
            logger.info("poor transfer rate:["+str(texte)+"]")
            logger.info("valid frequency:["+str(self.tfreq)+"]")
            return
        if texte in self.tfreq:
            i=self.tfreq.index(texte)
        cmd=self.ubxHz[i]
        # we send the command to the GPS
        logger.info("send command Set Rate to GPS")
        self.gps.disable() # stop the GPS reading
        time.sleep(1) # wait
        self.write(cmd)
        time.sleep(2)
        logger.info("send command query Rate to GPS")
        #self.write(self.ubxQRate)
        #time.sleep(2)
        self.gps.enable() # GPS reading is activated       

    def changeMessageOutput(self,str):
        print(str)
        texte = str
        # Mxmmm where x = 0 or 1; where mmm = message identifier
        # example: stop sending GSV frames
        # M0GSV
        if texte[0:1] == "0" or texte[0:1] == "0":
            sens = texte[0:1]
        else:
            logger.debug("wrong message control:["+texte+"]")
            return
        texte = texte[1:]
        if texte not in self.tmess:
            logger.debug("wrong message identifier:["+texte+"]")
            return
        #$PUBX,40,GLL,1,0,0,0,0,0*5D
        cmdmess = "PUBX,40,"+texte+","+sens+",0,0,0,0,0"
        cmd ="$"+cmdmess+"*"+get_chksum(cmdmess)+"\r\n"
        # we send the command to the GPS
        logger.info("send command to GPS:["+cmd+"]")
        cmd = cmd.encode()
        self.write(cmd)
        time.sleep(0.5)
        
    def write(self,str):
        self.gps.serialGps.write(str)
        
    def stop(self):
        self.__running = False

#        
## technical procedures 
########################
import re    
def chksum_nmea(sentence):
    # print(sentence)
    if sentence.find('*') < 0:
        return False
    if sentence[0:1] != '$':
        return False
    str2chk = sentence.rstrip('\n')
    str2chk = str2chk.rstrip('\r')
    s = str2chk.split('*')
    i = len(s)-1
    str2chk = s[i]
    # This is a string, will need to convert it to hex for 
    # proper comparsion below
    cksum = str2chk[len(str2chk) - 2:]
    if len(cksum) != 2:
        return False

    cksum_h = hex(int(cksum, 16))

    # String slicing: Grabs all the characters 
    # between '$' and '*' and nukes any lingering
    # newline or CRLF
    chksumdata = re.sub("(\n|\r\n)","", sentence[sentence.find("$")+1:sentence.find("*")])
    
    # Initializing our first XOR value
    csum = 0 
    
    # For each char in chksumdata, XOR against the previous 
    # XOR'd char.  The final XOR of the last char will be our 
    # checksum to verify against the checksum we sliced off 
    # the NMEA sentence
    
    for c in chksumdata:
       # XOR'ing value of csum against the next char in line
       # and storing the new XOR value in csum
       csum ^= ord(c)
    
    # Do we have a validated sentence?
    if hex(csum) == hex(int(cksum, 16)):
       #return True
       #return hex(csum)
       return csum

    return False

def get_chksum(sentence):
    # String slicing: Grabs all the characters 
    # between '$' and '*' and nukes any lingering
    # newline or CRLF
    chksumdata = re.sub("(\n|\r\n)","", sentence)
    
    # Initializing our first XOR value
    csum = 0 
    
    # For each char in chksumdata, XOR against the previous 
    # XOR'd char.  The final XOR of the last char will be our 
    # checksum to verify against the checksum we sliced off 
    # the NMEA sentence
    
    for c in chksumdata:
       # XOR'ing value of csum against the next char in line
       # and storing the new XOR value in csum
       csum ^= ord(c)
    cksum = str(hex(csum))[2:].upper()
    
    return cksum


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
        return ""

# def formatGpsDateTime(gps,format=""):
#     # receives a gps object and returns a date and time string from gpsdate and gpstime
#     timestr = str(gps.gpstime)
#     hh = timestr[0:2]
#     mm = timestr[2:4]
#     ss = timestr[4:6]
#     datestr = str(gps.gpsdate)
#     JJ = datestr[0:2]
#     MM = datestr[2:4]
#     AA = datestr[4:6]
#     dt = JJ+"/"+MM+'/'+AA+" "+hh+":"+mm
#     
#     # odt = datetime(int("20"+AA),int(MM),int(JJ),int(hh),int(mm),int(ss))
#     
#     if format == "FILE":
#         dt = "20"+AA+MM+JJ+hh+mm+ss
# 
#     return dt


###########################
# start of main program
###########################
started = False    
print("waiting for GPS !")

if __name__ == "__main__":
    try:
        gps = False

        gps = GpsControl()
        gps.start()

        gpscmd = False

        gpscmd = GpsCommand(gps)
        gpscmd.start()

        while gps.gpsactiv:
            time.sleep(1)

        # if gps != False:
        #     logger.info("gps not False")
        #     gps.stop()
        # if gpscmd != False:
        #     logger.info("gpscmd not False")
        #     gpscmd.stop()
                
    except KeyboardInterrupt:
        print("User Cancelled (Ctrl C)")
        if gps != False:
            gps.stop()
        if gpscmd != False:
            gpscmd.stop()
            
    except:
        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        if gps != False:
            gps.stop()
        if gpscmd != False:
            gpscmd.stop()
        raise
        
    # finally:
    #     if gps != False:
    #         gps.stop()
    #     if gpscmd != False:
    #         gpscmd.stop()

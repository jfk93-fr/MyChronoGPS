#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_Nextion_Display
#   control of the displays on an Nextion screen 
#   reads the cached file DISPLAY, formats the message and displays it on the Nextion screen (write serial)
#
###########################################################################
from MyChronoGPS_Paths import Paths
Path = Paths();

import os
import time
import sys

import serial
import struct
k=struct.pack('B', 0xff)    

import subprocess

cmdgps =  "MyChronoGPS_Nextion_Display"
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
    
class DisplayScreen():

    buff1 = ""
    buff2 = ""
    buff3 = ""
    buff4 = ""
    line1 = ""
    line2 = ""
    line3 = ""
    line4 = ""

    def __init__(self):
        
        self.cache = pathdata+'/cache/DISPLAY'
        logger.debug("cache file:"+self.cache)
        self.page = 0

    def lire_cache(self):
        if os.path.exists(self.cache) == False:
            time.sleep(0.2)
            #return False
            return True
        with open(self.cache, 'r') as cache:
            logger.debug("read cache")
            message = cache.read()
            logger.debug(message)
        commande = message[0:1]
        texte = message[1:]
        #if commande == CONTRAST:
        #    try:
        #        contrast = int(texte)
        #    except:
        #        contrast = 0
        #    if contrast > 255:
        #        contrast = 255
        #    logger.debug(str(message))
        #    logger.debug("set contrast:"+str(contrast))
        #    self.disp.set_contrast(contrast)
        #elif commande == CLEAR:
        if commande == CLEAR:
            self.buff1 = ""
            self.buff2 = ""
            self.buff3 = ""
            self.buff4 = ""
            if self.page != 0:
                self.page = 0
                self.display("page 0")
            self.display("L1.txt=\"\"")
            self.display("L2.txt=\"\"")
            #time.sleep(2)
        elif commande == DISPLAY:        
            logger.debug(message)

            haut = ""
            bas = ""
            if texte.find('//') > 0:
                tabtxt = texte.split('//')
                haut = tabtxt[0]
                bas = tabtxt[1]
                i = 2
                while i < len(tabtxt) :
                    i = i+1
                
                texte = '{}\n\r{}'.format(haut, bas)
            if texte.find('\r\n') > 0:
                haut, bas = texte.split('\r\n')
                texte = '{}\n\r{}'.format(haut, bas)
            line1 = texte+"                "
            line2 = ""
            if haut != "":
                line1 = haut+"                "
            if bas != "":
                line2 = bas+"                "
                line2 = line2[0:16]
            line1 = line1[0:16]
            if line1 != self.buff1:
                self.buff1 = line1
            if line2 != "":
                if line2 != self.buff2:
                    self.buff2 = line2
            logger.debug(line1)
            logger.debug(line2)

            # Display line1 & 2.
            if self.page != 0:
                self.page = 0
                self.display("page 0")
            self.display("L1.txt=\""+line1+"\"")
            self.display("L2.txt=\""+line2+"\"")
            #time.sleep(2)
            
        elif commande == DISPLAY_BIG:        
            #logger.debug('BIG'+message)

            # we will only write the first line
            haut = ""
            milieu = ""
            bas = ""
            if texte.find('//') > 0:
                ligne = texte.split('//')
                texte = ""
                for line in ligne:
                    if haut == "":
                        haut = line
                    elif milieu == "":
                        milieu = line
                    elif bas == "":
                        bas = line
                texte = '{}\n\r{}\n\r{}'.format(haut, milieu, bas)
            line1 = texte+"                "
            line2 = ""
            line3 = ""
            if haut != "":
                line1 = haut+"                "
            if milieu != "":
                line2 = milieu+"                "
                line2 = line2[0:16]
            if bas != "":
                line3 = bas+"                "
                line3 = line3[0:16]
            line1 = line1[0:16]
            if line1 != "":
                if line1 != self.buff1:
                    self.buff1 = line1
            if line2 != "":
                if line2 != self.buff2:
                    self.buff2 = line2
            if line3 != "":
                if line3 != self.buff3:
                    self.buff3 = line3
            logger.debug(line1)
            logger.debug(line2)
            logger.debug(line3)

            # Display L1 + L2 + L3
            if self.page != 1:
                self.page = 1
                self.display("page 1")
            self.display("L1.txt=\""+line1+"\"")
            self.display("L2.txt=\""+line2+"\"")
            self.display("L3.txt=\""+line3+"\"")
            #time.sleep(2)

        elif commande == DISPLAY_SMALL:        
            # we will only write the first line on several floors (4 for the moment)
            st1 = ""
            st2 = ""
            st3 = ""
            st4 = ""
            if texte.find('//') > 0:
                ligne = texte.split('//')
                texte = ""
                for line in ligne:
                    if st1 == "":
                        st1 = line
                    elif st2 == "":
                        st2 = line
                    elif st3 == "":
                        st3 = line
                    elif st4 == "":
                        st4 = line
                texte = '{}\n\r{}\n\r{}\n\r{}'.format(st1, st2, st3, st4)
            line1 = texte+"                "
            line2 = ""
            line3 = ""
            line4 = ""
            if st1 != "":
                line1 = st1+"                "
            if st2 != "":
                line2 = st2+"                "
                line2 = line2[0:24]
            if st3 != "":
                line3 = st3+"                "
                line3 = line3[0:24]
            if st4 != "":
                line4 = st4+"                "
                line4 = line4[0:24]
            line1 = line1[0:24]
            if line1 != "":
                if line1 != self.buff1:
                    self.buff1 = line1
            if line2 != "":
                if line2 != self.buff2:
                    self.buff2 = line2
            if line3 != "":
                if line3 != self.buff3:
                    self.buff3 = line3
            if line4 != "":
                if line4 != self.buff4:
                    self.buff4 = line

            # Display L1 + L2 + L3 +L4
            if self.page != 2:
                self.page = 2
                self.display("page 2")
            self.display("L1.txt=\""+line1+"\"")
            self.display("L2.txt=\""+line2+"\"")
            self.display("L3.txt=\""+line3+"\"")
            self.display("L4.txt=\""+line4+"\"")
            #time.sleep(2)

        elif commande == DISPLAY_MENU:
            # le caractère qui suit la commande coorespond au numéro de la ligne (de 0 à 3) à écrire en surbrillance
            # we will only write the first line on several floors (4 for the moment)
            st1 = ""
            st2 = ""
            st3 = ""
            st4 = ""
            brightline = 0 # pour ne pas mettre en surbrillance en cas d'erreur sur le numéro de ligne
            try:
                brightline = int(texte[0:1])
            except:
                pass
            texte = texte[1:]
            if texte.find('//') > 0:
                ligne = texte.split('//')
                texte = ""
                for line in ligne:
                    if st1 == "":
                        st1 = line
                    elif st2 == "":
                        st2 = line
                    elif st3 == "":
                        st3 = line
                    elif st4 == "":
                        st4 = line
                texte = '{}\n\r{}\n\r{}\n\r{}'.format(st1, st2, st3, st4)
            line1 = texte+"                "
            line2 = ""
            line3 = ""
            line4 = ""
            if st1 != "":
                line1 = st1+"                "
            if st2 != "":
                line2 = st2+"                "
                line2 = line2[0:24]
            if st3 != "":
                line3 = st3+"                "
                line3 = line3[0:24]
            if st4 != "":
                line4 = st4+"                "
                line4 = line4[0:24]
            line1 = line1[0:24]
            if line1 != "":
                if line1 != self.buff1:
                    self.buff1 = line1
            if line2 != "":
                if line2 != self.buff2:
                    self.buff2 = line2
            if line3 != "":
                if line3 != self.buff3:
                    self.buff3 = line3
            if line4 != "":
                if line4 != self.buff4:
                    self.buff4 = line

            # Display L1 + L2 + L3 +L4
            if self.page != 2:
                self.page = 2
                self.display("page 2")
            self.display("L1.txt=\""+line1+"\"")
            self.display("L2.txt=\""+line2+"\"")
            self.display("L3.txt=\""+line3+"\"")
            self.display("L4.txt=\""+line4+"\"")
            #time.sleep(2)
            
        elif commande == POWER_OFF: # arrêt du programme demandé
            self.buff1 = ""
            self.buff2 = ""
            self.buff3 = ""
            self.buff4 = ""
            if self.page != 0:
                self.page = 0
                self.display("page 0")
            self.display("L1.txt=\"\"")
            self.display("L2.txt=\"\"")
            return False

        else:
            logger.info("commande invalide:\"",commande+"\"")
            #line1 = "invalid command:"+commande
            #if self.page != 0:
            #    self.page = 0
            #    self.display("page 0")
            #self.display("L1.txt=\""+line1+"\"")
            #self.display("L2.txt=\"\"")
            #time.sleep(2)

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
    try:
        DisplayScreen().boucle()
                
    except KeyboardInterrupt:
        print("User Cancelled (Ctrl C)")
            
    except:
        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        raise
        
    finally:
        print("END")

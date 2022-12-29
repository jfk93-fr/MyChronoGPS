#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_Simulator
#   simule le gps associé à MyChronoGPS
#   lit un ficher de trames NMEA dont le nom est passé en paramètres 
#   et écrit sur le port série à la fréquence passée en paramètres
#
# Main
#   Thread SimuControl
#       lit le fichier et écrit les trames sur le port série
#   Thread SimuCommand
#       lit les commandes envoyées dans le fichier fifo GPS et les traite
#       seule la commande E (END, fin de traitement) est traitée, les autres sont ignorées
#
# fonctionne avec MyChronoGPS.py
#
###########################################################################
# managed by git from VERSION 1.17
from MyChronoGPS_Paths import Paths
Path = Paths();

import os
import time
from datetime import timedelta, datetime, tzinfo
import threading
import sys
import serial
import subprocess
import shlex

FREE = 0
BUSY = 1

ON = 1
OFF = 0

def get_baudrate(device):
       command = 'sudo stty -F {0}'.format(device)
       proc_retval = subprocess.check_output(shlex.split(command))
       baudrate = int(proc_retval.split()[1])
       return baudrate

PORT = "/dev/serial0"
BAUDRATE = get_baudrate(PORT)


cmdsimu =  "MyChronoGPS_Simulator"
pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathlog = pathdata+'/log/'

#######################################################################################
# on va utiliser le logger en remplacement de print
#######################################################################################
import logging
from logging.handlers import TimedRotatingFileHandler
FORMATTER = logging.Formatter("%(asctime)s — %(name)s — %(funcName)s — %(levelname)s — %(lineno)d — %(thread)d — %(message)s")
LOG_FILE = pathlog+cmdsimu+".log"
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
logger.info('debut de '+cmdsimu)

try:
   logger.info("Ouverture Port Série "+str(PORT)+" à "+str(BAUDRATE)+" bauds")
   serialPort = serial.Serial(PORT, BAUDRATE, timeout = 2)
   logger.info("Port Série "+str(PORT)+" ouvert pour la simulation à "+str(BAUDRATE)+" bauds")
except IOError:
   logger.error("Erreur sur "+str(PORT))

#######################################################################################

class SimuControl(threading.Thread):
    INVALID = 0
    VALID = 1
    NMEA = ""
        
    def __init__(self):
        threading.Thread.__init__(self)
        #print(sys.argv)
        lg = len(sys.argv)
        #print (lg)
        i = 0
        while i < lg:
            #print(sys.argv[i])
            i = i + 1
        self.buffer = ""
        self.buffstate = FREE
        fname = "traces-20201108145155.nmea"
        if lg >= 2:
            fname = sys.argv[1]
        logger.info("args: "+str(sys.argv))
        self.freq = 10 # par défaut, on va simuler à 10 Hz
        if lg >= 3:
            self.freq = int(sys.argv[2])
        #print('freq',str(self.freq))
        self.delai = 1.0/self.freq
        #self.time = timedelta(microseconds=0)
        #self.delai = 0.8/self.freq # 0.8 pour compenser le temps perdu en traitement
        #print('delai',str(self.delai))
        
        self.fichier = open(fname,'r')
        lines = self.fichier.read() # on lit le fichier en totalité
        self.lines = lines.split('\n') # le fichier est transformé en une liste
        self.nblines = len(self.lines)
        self.currentline = 0 # pointeur sur la ligne en cours de traitement
        
        #self.fifo = pathcmd+'/pipes/GPS' # le pipe GPS va être écrit par le programme principal de MyChronoGPS
        #fileObj = os.path.exists(self.fifo)
        #if fileObj == False:
        #    self.creer_fifo()
        #    fileObj = os.path.exists(self.fifo)
            
        self.simuactiv = True

        print("GpsSimulator init complete")
        print("processing "+fname)
        
    def run(self):
        self.__running = True
        self.Trame = []
        time2process = ""
        time0 = time.time()
        while self.__running:
            self.gpsline = str(self.readline())
            if len(self.gpsline) > 0:
                timeRead = self.gpsline[7:17]
                #print(timeRead)
                if timeRead != time2process:
                    logger.debug(timeRead)
                    self.writeTrame()
                    time2process = timeRead
                    self.Trame = []
                    #print('delai',str(self.delai))
                    delai = self.delai-(time.time()-time0)
                    if delai >= 0:
                        time.sleep(delai) # on attend un peu avant de lire la trame suivante
                    time0 = time.time()
                self.Trame.append(self.gpsline)
        self.simuactiv = False
        print("End of SimuControl")

    def readline(self):
        if self.currentline > len(self.lines) - 1:
            self.stop()
            return ""
        gpsline = self.lines[self.currentline]
        self.currentline = self.currentline + 1
        return gpsline
        
    def writeTrame(self):
        for sentence in self.Trame:
            #print(sentence)
            self.writeSerial(sentence)

    def writeSerial(self,line):
        line2write = (line+'\r\n').encode()
        #print ("Try to write", line2write)
        try:
            bytes_sent = serialPort.write(line2write)
        except IOError:
            logger.error ("Erreur sur "+str(port))
        
    def stop(self):
        self.__running = False
        # on va arrêter le programme sans demander l'arrêt du programme chrono
        return
    
        # on va demander au chrono de s'arrêter  
        fifo = pathcmd+'/pipes/BUTTON' # le pipe BUTTON va être lu par le programme Chrono
        if os.path.exists(fifo) == False:
            self.__running = False
            return
        try:
            logger.debug("try open pipe:"+str(fifo))
            pipe = os.open(fifo, os.O_WRONLY, os.O_NONBLOCK)
            if True:
                logger.debug("try write pipe:"+str(fifo))
                os.write(pipe, str(b'12\r\n')) # bouton 1 appui long : arrêt de MyChronoGPS
                logger.debug("try close pipe:"+str(fifo))
                os.close(pipe)
        except OSError as err:
            logger.error("cannot use named pipe OS error: {0}".format(err))
            self.track_mode = OFF
            pass
        except:
            logger.error("cannot use named pipe "+str(fifo))
            self.track_mode = OFF
            pass
        self.__running = False

    #def creer_fifo(self):
    #    try:
    #        os.mkfifo(self.fifo)
    #        os.chmod(self.fifo, 0o777)
    #        trial = os.path.exists(self.fifo)
    #        while trial == False:
    #            time.sleep(0.5)
    #            trial = os.path.exists(self.fifo)
    #        logger.debug("fifo GPS is ready")
    #    except OSError as err:
    #        logger.error("cannot use named pipe GPS OS error: {0}".format(err))
    #        pass

class SimuCommand(threading.Thread):
        
    def __init__(self,simu):
        threading.Thread.__init__(self)
        self.simu = simu
        
        self.fifo = pathcmd+'/pipes/GPS' # le pipe GPS va être écrit par le programme principal de MyChronoGPS
        fileObj = os.path.exists(self.fifo)
        if fileObj == False:
            self.creer_fifo()
            fileObj = os.path.exists(self.fifo)
        
        print("SimuCommand init complete")
        
    def run(self):
        self.__running = True
        cpt = 0
        while self.__running:
            self.lire_fifo()
        print("End of SimuCommand")

    def lire_fifo(self):
        time.sleep(0.2)
        with open(self.fifo, 'r') as fifo:
            message = fifo.read()
            logger.debug("message:["+message+"]")
        commande = message[0:1]
        logger.debug("commande:["+commande+"]")
        texte = message[1:].strip()
        if commande == "E": # End, arrêt du Simulateur
            logger.info('END command received')
            self.simu.stop()
            self.stop()
        else:
            logger.error("commande invalide:["+str(commande)+"]")
            return

    def creer_fifo(self):
        try:
            os.mkfifo(self.fifo)
            os.chmod(self.fifo, 0o777)
            trial = os.path.exists(self.fifo)
            while trial == False:
                time.sleep(0.5)
                trial = os.path.exists(self.fifo)
            logger.debug("fifo GPS is ready")
        except OSError as err:
            logger.error("cannot use named pipe GPS OS error: {0}".format(err))
            pass
        
    def stop(self):
        self.__running = False

#
####### Main #####################
#
simu = False
simucmd = False

if __name__ == "__main__":
    try:
        simu = SimuControl()
        simu.start()

        #simucmd = SimuCommand(simu)
        #simucmd.start()

        while simu.simuactiv:
            time.sleep(1)
        print("End of Simu")
                
    except KeyboardInterrupt:
        print("User Cancelled (Ctrl C)")
        if simu != False:
            simu.stop()
        if simucmd != False:
            simucmd.stop()
            
    except:
        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        if simu != False:
            simu.stop()
        if simucmd != False:
            simucmd.stop()
        raise

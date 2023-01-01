#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_SIMUR
#   simule le gps associé à MyChronoGPS
#   lit un ficher de traces NMEA dont le nom est passé en paramètres 
#   parse les trames NMEA et envoie une liste dans le pipe GPS à intervalles réguliers
#   prend en charge le tracking (GGA et RMC avec un time uniquement)
#
# Main
#   Thread GpsControl
#       communique via les pipes NMEA et GPS
#       reçoit les trames du GPS envoyé dans le pipe NMEA par MyChronoGPS_GPS ou MyChronoGPS_SIM (simulateur)
#       contrôle MyChronoGPS_GPS ou MyChronoGPS_SIM via les commandes envoyées dans le pipe GPS
#   Thread ButtonControl
#       communique via le pipe BUTTON et reçoit les actions des boutons envoyés dans le pipe par MyChronoGPS_BUTTON (Button_Id + appui (PRESS ou LONGPRESS))
#   Thread LedControl
#       gère les actions des Led (ON, OFF, NORMAL_FLASH, SLOW_FLASH, FAST_FLASH)
#   Thread DisplayControl
#       communique via le pipe DISPLAY, envoie les messages à afficher dans le pipe, les messages sont récupérés et traités par le module MyChronoGPS_LCD
#   Class LogControl
#       communique via le pipe LOG, envoie les messages à écrire dans le pipe, les messages sont récupérés et traités par le module MyChronoGPS_LOG
#       (cette classe sera peut-être déportée dans le module MyChronoGPS_GPS qui lira le pipe GPS)
#   Class SessionControl
#       gère le stockage des données de sessions
#   Class ChronoControl
#       gère les fonctions du chronomètre (start, stop, etc)
#
#   Version 1.12 : MyChronoGPS.1.12.py + MyChronoGPS_LCD (ou MyChronoGPS_OLED) + MyChronoGPS_GPS (ou MyChronoGPS_SIMU ou MyChronoGPS_SIMUR)
#
###########################################################################
VERSION = "1.13"
import os
import time
import threading
import sys

FREE = 0
BUSY = 1

ON = 1
OFF = 0

print(sys.argv)
pathcmd = '/home/pi/MyChronoGPS'
cmdsimu =  "MyChronoGPS_SIMU."+VERSION
pathdata = '/home/pi/MyChronoGPS'
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
#logger.setLevel(logging.INFO)
logger.info('debut de '+cmdsimu)
#######################################################################################
from MyChronoGPS_NMEA import NmeaControl

class SimuControl(threading.Thread):
    INVALID = 0
    VALID = 1
    NMEA = ""
        
    def __init__(self):
        threading.Thread.__init__(self)
        print(sys.argv)
        l = len(sys.argv)
        print (l)
        i = 0
        while i < l:
            print(sys.argv[i])
            i = i + 1
        self.buffer = ""
        self.buffstate = FREE
        fname = "traces-20201108145155.nmea"
        if l == 2:
            fname = sys.argv[1]
        #self.fichier = open(self.path+fname,'r')
        self.fichier = open(fname,'r')
        lines = self.fichier.read() # on lit le fichier en totalité
        self.lines = lines.split('\n') # le fichier est transformé en une liste
        self.nblines = len(self.lines)
        self.currentline = 0 # pointeur sur la ligne en cours de traitement
        self.nmea = NmeaControl() # appel de la classe NmeaControl
        
        self.fifo = pathcmd+'/pipes/GPS' # le pipe GPS va être écrit par le programme principal de MyChronoGPS
        fileObj = os.path.exists(self.fifo)
        if fileObj == False:
            self.creer_fifo()
            fileObj = os.path.exists(self.fifo)
            
        self.simuactiv = True

        print("GpsSimulator init complete")
        
    def run(self):
        self.__running = True
        while self.__running:
            #logger.debug("on attend un peu (0.2)")
            #time.sleep(0.2) # on attend un peu avant de lire la trame
            gpsline = str(self.readline())
            self.gpsline = str(gpsline)
            #try:
            #    self.gpsline = gpsline.decode()
            #    # self.nmea.tracker.write(self.gpsline) # write sentence in trace file
            #except: # si la fonction decode n'a pas marché, c'est que le gps a envoyé une séquence en binaire
            #    logger.info("decode failed")
            #    # chkdata = gpsline.split("\r\n")
            #    # logger.info("chkdata:"+str(chkdata[0]))
            #    self.gspline = str(gpsline)
            # is the frame valid ?
            cksum = chksum_nmea(self.gpsline)
            
            if cksum != False:
                # self.gpstrames.append(self.gpsline)
                self.nmea.parse(self.gpsline) # parse sentence to send to chrono
            else:
                logger.debug("bad checksum:"+self.gpsline)
                #self.stop()
                
            self.gpscomplete = self.nmea.gpscomplete
            
            #self.nmea.parse(self.gpsline)
            #time.sleep(0.05) # on attend un peu avant de lire la trame suivante
            #logger.debug("on attend un peu (0.2)")
            #time.sleep(0.2) # on attend un peu avant de lire la trame suivante
        self.nmea.remove_fifo()
        print("End of SimuControl")

    def readline(self):
        logger.debug(str(len(self.lines))+" lines in file.")
        if self.currentline > len(self.lines) - 1:
            return ""
        gpsline = self.lines[self.currentline]
        self.currentline = self.currentline + 1
        logger.debug("curent line number:"+str(self.currentline))
        logger.debug("trame:["+str(gpsline)+"],line:"+str(self.currentline))
        logger.debug("line is read")
        if gpsline == "":
            logger.debug("trame vide:["+str(gpsline)+"],line:"+str(self.currentline))
            self.nmea.write('END') # on signale au module Chrono qu'on a fini
        else:
            logger.info("line:"+str(self.currentline)+",trame:["+str(gpsline)+"]")
        #    # est-ce que la trame est valide ?
        #    cksum = chksum_nmea(gpsline)
        #    cksum = str(hex(cksum))[2:]
        #    if len(cksum) < 2:
        #        cksum = "0"+cksum
        #    logger.debug("checksum:"+cksum)
        #    
        #    if cksum != False:
        #        self.nmea.gpstrames.append(gpsline)
        #    else:
        #        logger.info("bad checksum:"+gpsline)
        #
            self.gpscomplete = self.nmea.gpscomplete

        return gpsline
        
    def stop(self):
        self.simuactiv = False
        logger.debug("simuactiv:"+str(self.simuactiv))
        #self.nmea.stop()
        #    
        #fifo = pathcmd+'/pipes/BUTTON' # le pipe BUTTON va être lu par le programme Chrono
        #try:
        #    logger.debug("try open pipe:"+str(fifo))
        #    pipe = os.open(fifo, os.O_WRONLY, os.O_NONBLOCK)
        #    if True:
        #        logger.debug("try write pipe:"+str(fifo))
        #        os.write(pipe, "12"+'\r\n') # bouton 1 appui long : arrêt de MyChronoGPS
        #        logger.debug("try close pipe:"+str(fifo))
        #        os.close(pipe)
        #except OSError as err:
        #    logger.error("cannot use named pipe OS error: {0}".format(err))
        #    self.track_mode = OFF
        #    pass
        #except:
        #    print("cannot use named pipe ",fifo)
        #    self.track_mode = OFF
        #    pass

        self.__running = False

    def creer_fifo(self):
        try:
            os.mkfifo(self.fifo)
            os.chmod(self.fifo, 0o777)
            trial = os.path.exists(self.fifo)
            while trial == False:
                time.sleep(0.5)
                trial = os.path.exists(self.fifo)
            logger.debug("fifo GPS is ready")
        except OSError:
            logger.error("OSError")
            pass
        
    def disable(self):
        self.buffstate = BUSY
        
    def enable(self):
        self.buffstate = FREE

class SimuCommand(threading.Thread):
        
    def __init__(self,simu):
        threading.Thread.__init__(self)
        self.simu = simu
        
        self.fifo = pathcmd+'/pipes/GPSCMD' # le pipe GPS va être écrit par le programme principal de MyChronoGPS
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
        with open(self.fifo, 'r',0) as fifo:
            message = fifo.read()
            logger.debug("message:"+message)
        commande = message[0:1]
        logger.debug("commande:["+commande+"]")
        texte = message[1:].strip()
        if commande == "E": # End, arrêt du Simulateur
            logger.info('END command received')
            self.simu.stop()
            self.stop()
        else:
            logger.error("commande invalide:"+str(commande))
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
        except OSError:
            logger.error("OSError")
            pass
        
    def stop(self):
        self.__running = False

#        
# procédures techniques
###########################
import re    
def chksum_nmea(sentence):
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
       return True

    return False
#
#
####### Main #####################
#
simu = False
simucmd = False

if __name__ == "__main__":
    try:
        simu = SimuControl()
        simu.start()

        simucmd = SimuCommand(simu)
        simucmd.start()

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

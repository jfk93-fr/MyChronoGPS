#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS
#   automatic GPS stopwatch
#
#   Use with MyChronoGPS_GPS (or MyChronoGPS_UBX for u-blox GPS), MyChronoGPS_BUTTON and MyChronoGPS_OLED (or MyChronoGPS_LCD, or MyChronoGPS_Dummy) programs
#
# Main
#   Thread GpsControl
#       communicates via the GPS and GPSDATA pipes
#       receives GPS data sent through the GPSDATA pipe by MyChronoGPS_GPS
#       controls MyChronoGPS_GPS via commands sent through the GPS pipe
#   Thread MenuControl
#       communicates via the BUTTON pipe and receives the actions of the buttons sent in the pipe by MyChronoGPS_BUTTON (Button_Id + press (PRESS or LONGPRESS))
#   Thread LedControl
#       manages the actions on the LEDs (ON, OFF, NORMAL_FLASH, SLOW_FLASH, FAST_FLASH)
#   Thread DisplayControl
#       communicates via the DISPLAY pipe, sends messages to be displayed in the pipe, messages are retrieved and processed by the MyChronoGPS_LCD module
#   Thread TrackingControl (not operational)
#       receives the NMEA frames contained in the GPSNMEA pipe and writes the trace file
#   Thread PredictiveControl
#       predictive time control thread
#       this thread calculates in real time the difference between the previous lap time and the current lap time prediction
#   Class SessionControl
#       manages the storage of session data
#   Class AnalysisControl
#       manages the storage of gps points at sessions for analysis purposes
#   Class ChronoControl
#       manages the stopwatch functions (start, stop, etc)
#
###########################################################################
# managed by git from VERSION 1.17
from MyChronoGPS_Paths import Paths
Path = Paths();

import traceback
import os
import wiringpi
import time
from datetime import timedelta, datetime, tzinfo

from serial import Serial
import threading
from threading import Timer
import sys

python_ver = sys.version
python_num = python_ver[0:1]
python_bin = "/usr/bin/python"+python_num

from math import *

import json

import subprocess
import shlex

running = True
pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathsimu = pathdata+'/simu/'
pathlog = pathdata+'/log'
pathcache = pathcmd+'/cache'

cmdscreen = 'MyChronoGPS_LCD'
cmdgps =  "MyChronoGPS_GPS"
cmdsimu =  "MyChronoGPS_SIMU"
cmdbutton =  "MyChronoGPS_BUTTON"

#######################################################################################
# we will use the logger to replace print
#######################################################################################
import logging
from logging.handlers import TimedRotatingFileHandler
FORMATTER = logging.Formatter("%(asctime)s — %(name)s — %(funcName)s — %(levelname)s — %(lineno)d — %(thread)d — %(message)s")
LOG_FILE = pathlog+"/MyChronoGPS.log"
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
logger.info('MyChronoGPS starting')
logger.info('running in '+python_bin+' version '+python_ver)
#######################################################################################

BUTTON1_ID = 1
LED1_GPIO_PIN = 4 # yellow LED associated with Button1 and pitlane warning
LED2_GPIO_PIN = 18 # red LED associated with ILS Control
LED3_GPIO_PIN = 16 # green LED associated with Chrono Control
ILS_GPIO_PIN = 23

os.system('gpio export '+str(LED1_GPIO_PIN)+' out')
os.system('gpio export '+str(LED2_GPIO_PIN)+' out')
os.system('gpio export '+str(LED3_GPIO_PIN)+' out')
os.system('gpio export '+str(ILS_GPIO_PIN)+' out')
time.sleep(0.5)

io=wiringpi.GPIO(wiringpi.GPIO.WPI_MODE_GPIO_SYS)

STOP = 0
READY = 1
RUNNING = 2
POWER_OFF = 9
#current_state = False
current_state = 0
#running_state = False # status managed by MenuControl

MENU_ON = 1
MENU_OFF = 0

PRESS = 1
LONGPRESS = 2

LED_OFF = 0
LED_ON = 1
LED_FLASH = 2

FREE = 0
BUSY = 1

ON = 1
OFF = 0

NORMAL_CHARACTER = 1 # write on 2 lines
BIG_CHARACTER = 2 # write larger on 1 line
SMALL_CHARACTER = 3 # write smaller on 3 lines in scroll mode
CharacterSize = NORMAL_CHARACTER # possibility of character size
GpsChronoMode = 2 # default stopwatch mode: automatic


NOEUD_KM = 1.852 # 1 nautical mile = 1852 m

RT = 6378137.0 # radius of the earth in metres (to calculate distances)
TrackWidth = 15 # by default the width of the track is 15 m
PitMaxSpeed = 50 # max speed in the pitlane (default)
TrackProximity = 2000 # distance to the circuits (in metres)
TrackAcqTime = 240 # if there is no circuit, time to acquire gps points to determine a default start/finish line
UseStopwatchDisplayByILS = 0
LiveSessionMode = 0
parms = ""

HillRaceMode = 0

delayed_msg = "" # message to be sent after a certain time
dTimer = False # timer for delayed messages
tTimer = False # timer for delayed ils tick

utc2loc = False # correction to be made to the GPS timestamp to have the local time
command = 'timedatectl status'
try:
    vartimelocal = subprocess.check_output(shlex.split(command),timeout=5000)
    if b"(CET, " in vartimelocal:
        vartimelocal = vartimelocal.split(b"(CET, ")
        vartimelocal = vartimelocal[1].split(b'00)')
        utc2loc = int(vartimelocal[0])
except:
    pass

from MyChronoGPS_Parms import Parms

def send_delayed():
    global chrono
    global lcd
    global delayed_msg
    global dTimer
    global log
    chrono.lcd.set_display_sysmsg(delayed_msg,lcd.DISPLAY_BIG,20)
    delayed_msg = ""
    dTimer = False
    

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
        
class GpsControl(threading.Thread):
    INVALID = 0
    VALID = 1
    NMEA = ""
    gpstime = 0.
    gpsdate = ""
    gpsvitesse = 0.
    gpscap = 0.
    buffstate = FREE
    last_time = 0.0
    last_speed = 0.0
    localdatetime = ""
    timeshift = 0
    gpscomplete = False # is True when for 1 same gps timestamp we have a $GPGGA frame and a $GPRMC frame

    def __init__(self,lcd):
        threading.Thread.__init__(self)
        
        self.lcd = lcd

        self.gpsactiv = False
        self.fifo = pathcmd+'/pipes/GPSDATA'
        fileObj = os.path.exists(self.fifo)
        if fileObj == False:
            self.creer_fifo()
            fileObj = os.path.exists(self.fifo)
        
        self.gpscmd = pathcmd+'/pipes/GPSCMD' # pipe to send directives to the GPS
        
        self.gpsfix = self.INVALID
        self.gpsline = ""
        self.gpsnbsat = 0
        self.latitude = 0.
        self.longitude = 0.
        self.prevlat = 0. # prevlat and prevlon are used to calculate the last travelled line segment
        self.prevlon = 0.
        self.prevtime = 0
        self.gpstime = 0
        self.Freq = 1 # gps refresh rate
        if "GPSRate" in parms.params:
            self.Freq = parms.params["GPSRate"]
        self.gpsport = "/dev/serial0"
        if "GPSPort" in parms.params:
            self.gpsport = parms.params["GPSPort"]
        if utc2loc == False:
            if "TimeZone" in parms.params:
                self.timeshift = int(parms.params["TimeZone"])
        else:
            self.timeshift = utc2loc
        
        self.buffer = [] # we create an array that serves as a queue
        self.gpsaltitude = 0.
        self.nbparse = 0
        # check the GPS connection
        if get_baudrate(self.gpsport) < 0:
            logger.error("communication with the gps cannot be established. Check the gps connection.")
            time.sleep(10)
            self.lcd.set_display_sysmsg(" //Check Gps//Not Connected",lcd.DISPLAY_BIG,4)
            time.sleep(5)
            self.stop()
            return

        self.gpsactiv = True
        logger.info("GpsControl init complete")

    def creer_fifo(self):
        logger.info("create fifo GPSDATA")
        try:
            os.mkfifo(self.fifo)
            os.chmod(self.fifo, 0o777)
        except OSError:
            logger.error("OSError")
            pass
        
    def run(self):
        self.__running = True
        cpt = 0
        while self.__running:
            while (self.buffstate == BUSY):
                if (cpt > 1000):
                    # we have been waiting for more than a second !
                    logger.error("attente anormale !")
                    time.sleep(10)
                cpt = cpt + 1
                time.sleep(0.01)
            self.gpsline = self.lire_fifo()
            #logger.debug("gps frame:["+str(self.gpsline)+"]")
            if str(self.gpsline).find("END") >= 0:
                logger.info("end detected:["+str(self.gpsline)+"]")
                self.__running = False
            else:
                if self.gpsline != "":
                    self.parse(self.gpsline)

            time.sleep(0.02)
        # end of thread
        logger.info("stop GpsControl Thread")
        if self.gpsactiv == True:
            self.stop()

        #jfk doit-on supprimer le pipe GPSDATA ici ?
        #    ne devrait-on pas laisser le module GPS s'en occuper ?
        # fileObj = os.path.exists(self.fifo)
        # if fileObj == True:
        #     logger.info("fifo GPSDATA is beeing removed")
        #     os.remove(self.fifo)
            
        logger.info("end of GpsControl Thread of main program")

    def lire_fifo(self):
        retour = ""
        if len(self.buffer) > 0:
            if self.buffer[0] == "":
                self.buffer.pop(0)
        if len(self.buffer) == 0:
            try:
                with open(self.fifo, 'r') as fifo:
                    rbuff = fifo.read()
                    fifo.close()
                    self.buffer.extend(rbuff.split("\r\n"))
            except:
                logger.error("error detected in GPSControl - "+str(sys.exc_info()[0])+" "+str(sys.exc_info()[1]))
                pass
        if len(self.buffer) > 0:
            retour = self.buffer.pop(0)
        return retour
        
    def parse(self,sentence):
        self.buffstate = BUSY
        self.gpsdict = json.loads(sentence) 
        self.prevlat = self.latitude # prevlat and prevlon are used to calculate the last travelled line segment
        self.prevlon = self.longitude
        self.prevtime = self.gpstime
        
        self.last_time = self.gpstime
        self.last_speed = self.gpsvitesse
        
        self.gpsfix = self.VALID
        if self.nbparse == 0:
            #logger.debug("gpsdict:"+str(self.gpsdict))
            self.nbparse = self.nbparse + 1
        if "d" in self.gpsdict:
            self.gpsdate = self.gpsdict["d"]
        if "t" in self.gpsdict:
            self.gpstime = self.gpsdict["t"]
        if "ns" in self.gpsdict:
            self.gpsnbsat = self.gpsdict["ns"]
        if "l" in self.gpsdict:
            self.latitude = self.gpsdict["l"]
        if "L" in self.gpsdict:
            self.longitude = self.gpsdict["L"]
        if "v" in self.gpsdict:
            self.gpsvitesse = self.gpsdict["v"]
        if "a" in self.gpsdict:
            self.gpsaltitude = self.gpsdict["a"]
        if "c" in self.gpsdict:
            self.gpscap = self.gpsdict["c"]

        # we will calculate the local time and date
        JJ = int(self.gpsdate[0:2])
        MM = int(self.gpsdate[2:4])
        AA = int("20"+self.gpsdate[4:6])
        hh = int(self.gpstime[0:2])
        mm = int(self.gpstime[2:4])
        ss = int(self.gpstime[4:6])
        ld = datetime(AA,MM,JJ,hh,mm,ss)
        self.localdatetime = ld + timedelta(hours=self.timeshift)
        
        #if self.Freq == 0:
        #    if float(self.last_time) > 0:
        #        if float(self.gpstime) > 0:
        #            a = self.gpstime
        #            b = self.last_time
        #            logger.info("calcul freq:"+str(a)+"-"+str(b))
        #            self.Freq = int(abs(1 / (float(a) - float(b))))
        #            logger.info("Freq:"+str(self.Freq))
        
        self.gpscomplete = True;

        self.buffstate = FREE
        #logger.debug("buffstate:"+str(self.buffstate))
        
    def clear_buff(self):
        cpt = 0
        while self.buffstate == BUSY:
            if (cpt > 1000):
                # we have been waiting for more than a second !
                logger.error("abnormal waiting !")
                time.sleep(20)
            cpt = cpt + 1
            time.sleep(0.01)
        self.NMEA = ""
        self.gpscomplete = False
        
    def stop(self):
        logger.info("gps stop request:"+str(self.gpsactiv))

        if self.gpsactiv == False:
            logger.info(str(self.fifo)+" gps not activ")
            return
            
        is_pipe = os.path.exists(self.gpscmd)
        logger.debug("is_pipe:"+str(is_pipe))
        if is_pipe == True:
            try:
                logger.info("try to open fifo GPSCMD")
                pipe = os.open(self.gpscmd, os.O_WRONLY, os.O_NONBLOCK)
                if True:
                    logger.info("write command E to fifo GPSCMD")
                    os.write(pipe, "EEEEE\r\n".encode())
            except OSError as err:
                logger.error("cannot use named pipe GPS OS error: {0}".format(err))
                pass
        #
        try:
            pipe = os.open(self.fifo, os.O_WRONLY, os.O_NONBLOCK)
            if True:
                os.write(pipe, "END\r\n".encode())
                os.close(pipe)
        except OSError as err:
            logger.error("cannot use named pipe NMEA OS error: {0}".format(err))
            pass
            
        self.__running = False
        self.gpsactiv = False
        
    def get_gpsdate(self):
        return self.gpsdate
        
    def get_gpstime(self):
        return self.gpstime
#         
# class TrackingControl(threading.Thread):
# 
#     def __init__(self,chrono):
#         threading.Thread.__init__(self)
#         self.__running = False
#         self.gpsnmea = ""
#         self.fifo = pathcmd+'/pipes/GPSNMEA'
#         fileObj = os.path.exists(self.fifo)
#         if fileObj == False:
#             self.creer_fifo()
#             fileObj = os.path.exists(self.fifo)
# 
#         self.track_mode = ON        
#         self.GpsTrackerMode = 0
#         # if "GpsTrackerMode" in self.parms.params:
#         #     self.GpsTrackerMode = self.parms.params["GpsTrackerMode"]
#         # if self.GpsTrackerMode != 1:
#         #     self.track_mode = OFF
# 
#         logger.info("TrackingControl init complete")        
# 
#     def run(self):
#         self.__running = True
#         while self.__running:
#             self.gpsnmea = self.lire_fifo()
#             if self.track_mode == ON:
#                 # on va écrire la trace
#                 logger.info(str(self.gpsnmea))
#             time.sleep(0.01)
#         logger.info("end of TrackingControl Thread of main program")
#         
#     def stop(self):
#         logger.info("tracking stop")
#         if self.__running == False:
#             return
#         self.__running = False
# 
#     def creer_fifo(self):
#         logger.info("create fifo GPSNMEA")
#         try:
#             os.mkfifo(self.fifo)
#             os.chmod(self.fifo, 0o777)
#         except OSError:
#             logger.error("OSError")
#             pass
# 
#     def lire_fifo(self):
#         retour = ""
#         try:
#             with open(self.fifo, 'r') as fifo:
#                 retour = fifo.read()
#                 fifo.close()
#         except:
#             logger.error("error detected in GPSControl - "+str(sys.exc_info()[0])+" "+str(sys.exc_info()[1]))
#             pass
#         return retour

#class ButtonControl(threading.Thread):
class MenuControl(threading.Thread):
    # the menu can control up to 3 buttons

    def __init__(self,led):
        threading.Thread.__init__(self)
        #self.__current_state = False
        self.__current_state = 0
        self.menu_state = MENU_OFF
        self.current_button = 0
        self.running_state = 0 # the wheel of successive states, starting at 0 and running until the maximum number is reached
        self.led = led
        self.__led = LED_OFF
        self.buttonNumber = 0
        self.max_wheel = 2 # 3 states: 0=stop, 1=ready, 2=run
        if "ButtonNumber" in parms.params:
            self.buttonNumber = parms.params["ButtonNumber"]
        
        self.fifo = pathcmd+'/pipes/BUTTON'
        fileObj = os.path.exists(self.fifo)
        if fileObj == False:
            self.creer_fifo()
            fileObj = os.path.exists(self.fifo)
        logger.info("MenuControl init complete")

    def creer_fifo(self):
        try:
            os.mkfifo(self.fifo)
            os.chmod(self.fifo, 0o777)
            logger.info("fifo BUTTON is ready")
        except OSError as err:
            logger.error("OS error: {0}".format(err))
            pass

    def run(self):
        self.__running = True
        self.prev_state = self.__current_state

        while self.__running:
            fifo_data = self.lire_fifo()
            logger.info("fifo_data:"+str(fifo_data))
            self.current_button = int(fifo_data[0:1])
            self.__current_state = int(fifo_data[1:2])
            if self.__current_state != self.prev_state:
                self.prev_state = self.__current_state
                logger.info("previous state:"+str(self.prev_state))
            # choix des actions en fonction des boutons
            if self.current_button == 1:
                # bouton 1 = bouton principal
                # s'il y a un autre bouton, mode manuel => affichage du menu
                # si menu = off => start menu
                # si menu = on => select line then do action
                # si longpress => Power off
                # s'il n'y a qu'un bouton => caroussel d'état successif à chaque appui sur le bouton
                if self.__current_state == LONGPRESS:
                    self.running_state = POWER_OFF
                    logger.info("POWER_OFF")
                else:
                    logger.info("self.__current_state:"+str(self.__current_state))
                    if self.buttonNumber > 1:
                        # il y a plusieurs boutons => gestion du menu
                        if self.menu_state == MENU_OFF:
                            self.start_menu()
                        else:
                            self.menu_select()
                    else:
                        # il n'y a qu'un bouton => carousel d'états succsessifs
                        # the state of the button depends on the position of the carousel
                        self.running_state = self.running_state + 1
                        if (self.running_state > self.max_wheel):
                            self.running_state = 0
                logger.info("running state:"+str(self.running_state))

            elif self.current_button == 2:
                # bouton 2 = défilement du menu par le bas
                if self.menu_state == MENU_ON:
                    self.menu_down()
            elif self.current_button == 3:
                # bouton 3 = défilement du menu par le haut
                if self.menu_state == MENU_ON:
                    self.menu_up()

            # # gestion de l'affichage de la LED principale en fonction de l'état du menu
            # if self.running_state == STOP or self.running_state == POWER_OFF: # stop
            #     if (self.__led != LED_OFF):
            #         self.led.set_led_off()
            #         self.__led = LED_OFF
            # elif self.running_state == READY: # ready: the LED flashes
            #     if (self.__led != LED_FLASH):
            #         self.led.set_led_flash()
            #         self.__led = LED_FLASH
            # else: # last case : run
            #     if (self.__led != LED_ON):
            #         self.led.set_led_on()
            #         self.__led = LED_ON

            time.sleep(0.2)

        logger.info("end of MenuControl Thread of main program")

    def lire_fifo(self):
        state = 0
        try:
            with open(self.fifo, 'r') as fifo:
                message = fifo.read()
                fifo.close()
        except:
            logger.error("error detected in ButtonControl - "+ sys.exc_info()[0]+" "+ sys.exc_info()[1])
            pass
        return message
            
    def get_state(self):
        return self.running_state
        
    def stop(self):
        self.running_state = POWER_OFF
        self.__running = False

class LedControl(threading.Thread):
    NORMAL_FLASH = 3
    FAST_FLASH = 1
    SLOW_FLASH = 7
    VERY_SLOW_FLASH = 14
    TICK = 0.1
        
    def __init__(self, gpio_pin):
        threading.Thread.__init__(self)
        self.gpio_pin = gpio_pin
        #jfk on va plutôt écrire dans le cache et un autre programme se chargera de gérer les leds si besoin.
        self.cache_name = pathcache+'/LED'+str(self.gpio_pin)
        self.__last_state = LED_ON
        self.__running = False
        self.__led = LED_OFF
        self.flashtime = 0
        self.cycles = self.NORMAL_FLASH # for flashing mode: number of cycles before changing the LED status
        self.statebeforeflash = self.__led
        # LED test
        i = 5
        while i > 0:
            i = i-1
            self.set_led_on()
            io.digitalWrite(self.gpio_pin,1)
            self.write(1,0,0)
            time.sleep(self.TICK)
            self.set_led_off()
            io.digitalWrite(self.gpio_pin,0)
            self.write(0,0,0)
            time.sleep(self.TICK)

        logger.info("LedControl init complete")
    
    def run(self):
        self.__running = True
        flashing = 0
        flash = 1 
        nbc = 0 # cycle counter
        chronoflash = 0 # to count down the flashing time
        while self.__running:
            #jfk
            #logger.setLevel(logging.DEBUG)
            #logger.debug('LED Status('+str(self.gpio_pin)+'):'+str(self.__led))
            if self.__led != self.__last_state:
                if self.__led == LED_ON:
                    io.digitalWrite(self.gpio_pin,1)
                    flashing = 0
                    self.write(1,flashing,0)
                elif self.__led == LED_OFF:
                    io.digitalWrite(self.gpio_pin,0)
                    flashing = 0
                    self.write(0,flashing,0)
                elif self.__led == LED_FLASH:
                    flashing = 1
                    self.write(1,flashing,self.flashtime,self.cycles)
                self.__last_state = self.__led
            if flashing == 1:
                # the LED will be successively switched on and off for the required time
                if self.flashtime > 0: # flashes for a while
                    chronoflash = chronoflash + self.TICK
                    if chronoflash > self.flashtime:
                        self.flashtime = 0
                        chronoflash = 0
                        flashing = 0
                        self.__led = self.statebeforeflash # the status of the LED before the flashing is restored
                        
                if nbc == 0: # the LED is switched on or off
                    io.digitalWrite(self.gpio_pin,flash)
                    if flash == 1:
                        flash = 0
                    else:
                        flash = 1
                nbc = nbc + 1
                if nbc > self.cycles:
                    nbc = 0

            time.sleep(self.TICK)
            
        io.digitalWrite(self.gpio_pin,0)
        logger.info("end of LedControl Thread of main program")
            
    def get_state(self):
        return self.__led
            
    def set_led_on(self):
        self.__led = LED_ON
            
    def set_led_off(self):
        self.__led = LED_OFF
            
    def set_led_flash(self,flashtime=0,flashmode=False):
        if flashtime > 0:
            self.statebeforeflash = self.__led
        self.__led = LED_FLASH
        self.flashtime = flashtime
        if flashmode == False:
            flashmode = self.NORMAL_FLASH
        self.cycles = flashmode
            
    def set_led_fast_flash(self,flashtime=0):
        self.set_led_flash(flashtime,self.FAST_FLASH)
            
    def set_led_slow_flash(self,flashtime=0):
        self.set_led_flash(flashtime,self.SLOW_FLASH)
            
    def set_led_very_slow_flash(self,flashtime=0):
        self.set_led_flash(flashtime,self.VERY_SLOW_FLASH)
            
    def write(self,action,flash,flashtime=0,flashmode=0):
        buff = str(action)+' '+str(flash)+' '+str(flashtime)+' '+str(flashmode)+' '
        try:
            with open(self.cache_name, 'w') as cache: # the file is initialized
                cache.write(str(buff+'\r\n'))
                cache.close()
        except OSError as err:
            logger.error("cannot use cache file OS error: {0}".format(err))
            pass
        
    def stop(self):
        self.set_led_off()
        self.__running = False
    
class DisplayControl(threading.Thread):
    DATE_TIME = 1 # date time display in line 1 + info carousel in line 2
    MSG_TIME = 2 # 
    MSG_READY = 3 # 
    DISPLAY_CHRONO = 4 # In this mode, the time elapsed since the line was crossed is displayed 
    SYS_MSG = 5 # in this mode the message is displayed for a specific time and all other messages are ignored
    DISPLAY = "D"
    DISPLAY_BIG = "H"
    DISPLAY_SMALL = "S"
    CLEAR = "C"
    #BLACK = "B"
    CONTRAST = "A"
    #pipe_name = pathcmd+'/pipes/DISPLAY'
    cache_name = pathcache+'/DISPLAY' 
    lcd_data = "" # contains the command + the text to display (written in the named pipe DISPLAY)
        
    def __init__(self):
        threading.Thread.__init__(self)
        self.displayBig = False
        self.displaySysBig = False
        self.displaySmall = False
        self.contrast = 0
        self.contrast_old = 255
        self.start_screen()
        
        self.displayBig = True
        #self.display("MyChronoGPS// //"+get_ipadr())
        self.display("MyChronoGPS// //V-"+str(Version))
        self.displayBig = False
        time.sleep(5)
        self.clear()
        time.sleep(0.5)
        #self.black()
        self.clear()
        self.display_mode = self.DATE_TIME
        logger.info("DisplayControl init complete")
        self.sysloop = 0 # system message display loop
        self.set_contrast(self.contrast)       
        self.set_display_sysmsg("DisplayControl//init complete",self.DISPLAY,1)

        self.PitMaxSpeed = PitMaxSpeed
        self.localTime = False
        self.chrono = False
        self.waiting_time = 1 #
        
    def run(self):
        global gps
        self.__running = True
        self.carousel = 0
        self.maxcarr = 9 # max nb for the carousel
        self.loop = 0
        self.buff1 = ""
        self.buff2 = ""
        self.line1 = ""
        self.line2 = ""
        self.buffer = ""
        self.lastbuff = ""
        self.cpttest = 0
        self.cpttest2 = 0
        while self.__running:
            if self.sysloop > 0:
                self.sysloop = self.sysloop - 1
                self.buff1 = ""
                self.buff2 = ""
                self.displayBig = False
                self.displaySmall = False
                if CharacterSize == BIG_CHARACTER and self.displaySysBig == True:
                    # message is writen in large letters
                    self.buff1 = self.sys_message
                    self.displayBig = True
                else:
                    if self.sys_message.find('//') > 0:
                        self.buffer = self.sys_message.split('//')
                        self.buff1 = self.buffer[0]
                        self.buff2 = self.buffer[1]
                        i = 2
                        while i < len(self.buffer) :
                            i = i+1
            else:
                if gps != False:
                    if (gps.gpsline == "" or gps.gpsfix == gps.INVALID):
                        self.buff1 = "Waiting for GPS"
                        self.buff1 += "//on "+gps.gpsport
                        self.buff1 += "//"+get_ipadr()
                        self.buff1 += "// "
                        self.displaySmall = True
                        gps.gpsfix = gps.INVALID
                        self.waiting_time = 1; # delay 1 second
                    #else:
                        #logger.debug("gpsline:["+gps.gpsline+"]")
                    if gps.gpsfix == gps.VALID:
                        self.localTime = formatLocalTime(gps)
                        if (self.display_mode == self.DATE_TIME):
                            self.waiting_time = 1; # delay 1 second
                            # if the speed is <= SpeedOmeter (about 15 km/h) the self.carousel is not taken care of and only the speed is displayed
                            if gps.gpsvitesse > int(parms.params["SpeedOmeter"]):
                                self.set_contrast(255)
                                if CharacterSize == BIG_CHARACTER:
                                    # speed is written in large letters
                                    self.buff1 = self.localTime+" sat: "+str(gps.gpsnbsat)+"//"
                                    self.buff1 = self.buff1+formatVitesse(gps.gpsvitesse)+"// //"
                                    self.buff2 = " "
                                    self.displayBig = True
                                else:
                                    self.buff1 = self.localTime
                                    w = "                    "
                                    self.buff2 = w[0:6]
                                    self.buff2 = self.buff2+formatVitesse(gps.gpsvitesse)
                            else:
                                # here we can display raspberry and gps status information
                                # or display the time list of the last session
                                if self.chrono != False:
                                    if len(self.chrono.tbsessions) > 0:
                                        # we will display the list of times from the last session
                                        self.display_temps_session()
                                    else:
                                        self.display_carousel()
                                else:
                                    self.display_carousel()
                        
                        if (self.display_mode == self.MSG_READY): #
                            self.waiting_time = 1; # delay 1 second
                            self.set_contrast(255)
                            self.buff1 = self.localTime
                            # line 2: "ready" and the speed are displayed
                            self.buff2 = "Ready "
                            self.buff2 = self.buff2+formatVitesse(gps.gpsvitesse)
    
                        if (self.display_mode == self.DISPLAY_CHRONO):
                            self.waiting_time = 0.1; # delay 0.1 second
                            t = chrono.temps_en_cours - timedelta(microseconds=chrono.temps_en_cours.microseconds)
                            self.set_contrast(255)
                            if chrono.in_pitlane == False:
                                # we look in the parameters if we have to display in big size (1 line = 2 LCD lines)
                                self.displayBig = False
                                if CharacterSize == BIG_CHARACTER:
                                    # the current time is written in large letters
                                    self.buff1 = formatTimeDelta(chrono.temps_tour)+" Lap "+str(self.chrono.nblap)+"//"
                                    self.buff1 = self.buff1+formatTimeDelta(t)+"//"
                                    self.buff1 = self.buff1+self.localTime+" "+formatVitesse(gps.gpsvitesse)
                                    self.buff2 = " "
                                    if self.chrono.predict_time != False:
                                        self.buff1 = self.buff1+" "+self.chrono.predict_time
                                    self.displayBig = True
                                else:
                                    # line 1: the elapsed time is displayed
                                    # display a timedelta object as mm:ss.00 (cc = hundredth of a second to 00 for the current time)
                                    self.buff1 = formatTimeDelta(chrono.temps_tour)+" Lap "+str(self.chrono.nblap)
                                    # line 2: the lap time is displayed
                                    self.buff2 = formatTimeDelta(t)+" Lap "+str(self.chrono.nblap)
                                    self.buff2 = self.buff2+" "+formatVitesse(gps.gpsvitesse)
                            else: # we are in the pitlane, we watch the speed
                                self.displayBig = False
                                if gps.gpsvitesse > self.PitMaxSpeed:
                                    if CharacterSize == BIG_CHARACTER:
                                        self.buff1 = formatVitesse(gps.gpsvitesse)+"-"+formatVitesse(self.PitMaxSpeed)+"//Warning!// //"
                                        self.buff2 = " "
                                        self.displayBig = True
                                    else:
                                        self.buff1 = "WARNING!"
                                        self.buff2 = formatVitesse(gps.gpsvitesse)+"-"+formatVitesse(self.PitMaxSpeed)
                                        # here, we will make the yellow LED flash quickly
                                        # jfk
                                        self.main_led.set_led_fast_flash()
                                else:
                                    if CharacterSize == BIG_CHARACTER:
                                        # the speed is written in large letters
                                        self.buff1 = self.localTime+" Lap "+str(self.chrono.nblap)+"//"
                                        self.buff1 = self.buff1+formatVitesse(gps.gpsvitesse)+"// //"
                                        self.buff2 = " "
                                        self.displayBig = True
                                    else:
                                        # line 1: the elapsed time is displayed
                                        self.buff1 = self.localTime+" Lap "+str(self.chrono.nblap)
                                        # ligne 2 : the speed is displayed
                                        self.buff2 = self.buff2+" "+formatVitesse(gps.gpsvitesse)
    
                            self.loop += 1
                            # we will let 5 cycles pass before changing the display
                            if (self.loop > 5): # 5 times 0.1 the display changes every 0.5 seconds
                                self.loop = 0
                else:
                    self.buff1 = "GPS not connected"
                    gpsport = "/dev/serial0"
                    if "GPSPort" in parms.params:
                        gpsport = parms.params["GPSPort"]
                    self.buff1 += "//"+gpsport
                    self.buff1 += "//Verify GPS connection // "
                    self.displaySmall = True
                    self.waiting_time = 1; # delay 1 second
                        
            self.line1 = ""
            self.line2 = ""
            if (self.buff1 != self.line1):
                self.line1 = self.buff1+"                "
                    
            self.buff2 = str(self.buff2)
            if (self.buff2 != self.line2):
                self.line2 = self.buff2+"                "
                self.line2 = self.line2[0:16]
                
            self.buffer = self.line1+"//"+self.line2
            if self.buffer != self.lastbuff: # the line has changed
                self.lastbuff = self.buffer
                self.display(self.buffer)
                    
            time.sleep(self.waiting_time)
        self.stop()
        logger.info("end of DisplayControl Thread of main program")
        
    def display_carousel(self):
        if (self.loop == 0): # it's the first time we get into the loop, we build the message
            self.set_contrast(0)
            self.buff1 = self.localTime
            # line 2 : displays successively 1-speed, 2-latitude, 3-longitude, 4-CPU temperature
            if (self.carousel == 0):
                # first message from the carousel: speed and GPS frequency
                self.buff2 = str(gps.Freq)+"Hz "
                self.buff2 = self.buff2+formatVitesse(gps.gpsvitesse)
            elif (self.carousel == 1):
                # second message from carousel: current latitude
                self.buff2 = "lat:"
                if gps.latitude < 10:
                    self.buff2 = self.buff2+" "
                self.buff2 = self.buff2+str(round(gps.latitude,4))
            elif (self.carousel == 2):
                # second message from carousel: current longitude
                self.buff2 = "lon:"
                if gps.longitude < 10:
                    self.buff2 = self.buff2+" "
                self.buff2 = self.buff2+str(round(gps.longitude,4))
            elif (self.carousel == 3):
                # fourth message from the carousel: CPU temperature
                self.buff2 = "temp: "
                #temp = get_thermal()
                temp = round(get_thermal())
                self.buff2 = self.buff2+str(temp)+' d'
            elif (self.carousel == 4):
                # fifth message from the carousel: IP address
                self.buff2 = get_ipadr()
            elif (self.carousel == 5):
                # sixth message from the carousel: serial link speed
                baud = get_baudrate(gps.gpsport)
                self.buff2 = str(baud)+" baud"
            elif (self.carousel == 6):
                # seventh message from the carousel: volts
                volts = get_volts()
                self.buff2 = str(volts)
            elif (self.carousel == 7):
                # fourth message from the carousel: processor clock frequency
                self.buff2 = "pr.f: "
                pf = round(get_procfreq())
                self.buff2 = self.buff2+str(pf)+'KHz'
            elif (self.carousel == 8):
                # fourth message from the carousel: use of file system
                self.buff2 = "file sys.: "
                ufs = get_ufs()
                self.buff2 = self.buff2+str(ufs)
            elif (self.carousel == 9):
                # fourth message from the carousel: use of file system
                self.buff2 = "nb process: "
                ps = get_ps()
                self.buff2 = self.buff2+str(ps)
            
        self.loop = self.loop +1
        if (self.loop > 2): # 2 times 1 the display changes approximately every 2 seconds
            self.carousel = self.carousel + 1
            if (self.carousel > self.maxcarr): # x messages to be displayed in the carousel
                self.carousel = 0
            self.loop = 0

    def display_temps_session(self):
        ns = len(self.chrono.tbsessions)
        dsess = self.chrono.tbsessions[ns-1]
        best = dsess["best"] # index on the best lap of the session
        numbestLap = best+1 # lap number of the best time
        bestLap = dsess["tblaps"][best] # best time of the session
        nblaps = len(dsess["tblaps"])
        if (self.loop == 0): # it's the first time we get into the loop, we build the message
            self.set_contrast(255)
            self.displaySmall = True
            lstlines = [] # list of lines to display (4 lines in displaySmall mode)
            #ns = len(self.chrono.tbsessions)
            #dsess = self.chrono.tbsessions[ns-1]
            #best = dsess["best"] # index sur le meilleur tour de la session
            #numbestLap = best+1 # numéro du tour du meilleur temps
            #bestLap = dsess["tblaps"][best] # meilleur temps de la session
            #nblaps = len(dsess["tblaps"])
            if self.carousel == 0:
                # first carousel message: line 1 = date & time
                line = self.localTime+" "+get_ipadr()
                lstlines.append(line)
                line = "session "+str(ns)+": "+str(len(dsess["tblaps"]))+" laps"
                lstlines.append(line)
                line = "best L"+str(numbestLap)+": "+str(bestLap)
                lstlines.append(line)
            else:
                # other carousel messages: line 1 = Lap Time header
                line = "Lap Time"
                lstlines.append(line)
                i = self.carousel -1
                while i < len(dsess["tblaps"]):
                    line = str(i+1)+" "+dsess["tblaps"][i]
                    if i == best:
                       line += " **" # best time indicator
                    lstlines.append(line)
                    i = i+1
                if i - self.carousel < 2:
                    # there were no more than 4 lines to display, so we will force the carousel to restart at 0
                    self.carousel = nblaps+1
                
            # the list of lines is ready, we build the buffer
            self.buff1 = ""
            for i in range(len(lstlines)):
                self.buff1 += lstlines[i]+" //"
            while i < 4:
                self.buff1 += " //"
                i = i+1
        self.loop = self.loop +1
        if (self.loop > 2): # 2 times 1 the display changes approximately every 2 seconds
            self.carousel = self.carousel + 1
            if (self.carousel > nblaps+1): # x messages to be displayed in the carousel
                self.carousel = 0
            self.loop = 0        
            
    def start_screen(self):
        #is_pipe = os.path.exists(self.pipe_name)
        #if is_pipe == True:
        #    return

        #global running
        #global parms
        #global path
        #global pathlog
        #global cmdscreen
        self.clear()
        if "ScreenCmd" in parms.params:
            cmdscreen = parms.params["ScreenCmd"]
        #cmdos = "python "+pathcmd+"/"+cmdscreen+".py > "+pathlog+"/"+cmdscreen+".log &"
        #cmdos = "python3 "+pathcmd+"/"+cmdscreen+".py &"
        cmdos = python_bin+" "+pathcmd+"/"+cmdscreen+".py &"
        print(cmdos)
        
        try:
            os.system(cmdos)
            time.sleep(2)
        except:
            running = False
        print('verify if %s started' % (cmdscreen))
        
        #is_pipe = os.path.exists(self.pipe_name)
        #nb = 0
        #while is_pipe == False:
        #    time.sleep(1)
        #    is_pipe = os.path.exists(self.pipe_name)
        #    nb = nb+1
        #    if nb > 15:
        #        logger.info(str(self.pipe_name)+" not found")
        #        is_pipe = True # to get out of the loop
            
    def display(self,str):
        if self.displayBig == True:
            self.displayBig = False
            self.write(self.DISPLAY_BIG+str)
        elif self.displaySmall == True:
            self.displaySmall = False
            self.write(self.DISPLAY_SMALL+str)
        else:
            self.write(self.DISPLAY+str)
        #self.displayBig = False
        #self.displaySmall = False
            
    #def black(self):
    #    self.write(self.BLACK+" ")
            
    def clear(self):
        self.write(self.CLEAR+" ")
            
    def write(self,buff):
        try:
            with open(self.cache_name, 'w') as cache: # the file is initialized
                cache.write(str(buff+'\r\n'))
                cache.close()
        except OSError as err:
            logger.error("cannot use cache file OS error: {0}".format(err))
            pass
           
    def stop(self):
        if self.__running != True:
            logger.info("DisplayControl already stopped")
            return
        self.clear()
        time.sleep(0.4)
        self.display("LCD turn off")
        time.sleep(3)
        #self.black()
        self.clear()

        self.write("X") # demande d'arrêt du programme d'affichage
        time.sleep(2)

        #self.set_display_sysmsg("End of//MyChronoGPS//Bye",self.DISPLAY,1)
        #self.set_display_sysmsg("DisplayControl//init complete",self.DISPLAY,1)
        self.display("End of//MyChronoGPS//Bye")
        
        self.__running = False
        logger.info("lcd stop")
            
    def set_display_time(self):
        self.display_mode = self.DATE_TIME    
            
    def set_display_ready(self):
        self.display_mode = self.MSG_READY    

    def set_display_chrono(self,chrono):
        self.chrono = chrono # the chrono object contains the times to be displayed
        self.display_mode = self.DISPLAY_CHRONO    

        #logger.info("circuit:"+str(type(self.chrono.circuit)))
        if self.chrono.circuit != False:
            if "PitMaxSpeed" in self.chrono.circuit:
                self.PitMaxSpeed = self.chrono.circuit["PitMaxSpeed"]
            
    def set_display_sysmsg(self,msg,size="",timer=1):
        if size == self.DISPLAY_BIG:
            self.displaySysBig = True
        else:
            self.displaySysBig = False
        self.sys_message = msg
        #self.sysloop = timer * 10 # 10 cycles = about 1 second
        self.sysloop = timer * 1 # 10 cycles = about 1 second
        
    def set_contrast(self,contrast):
        try:
            c = contrast*1
        except:
            c = self.contrast
        if c > 255:
            c = self.contrast
        self.contrast = c
        if self.contrast != self.contrast_old:
            self.write(self.CONTRAST+str(self.contrast))
        self.contrast_old = self.contrast
        
    def set_chrono(self,chrono):
        self.chrono = chrono

class IpControl(threading.Thread):

    def __init__(self,chrono):
        self.chrono = chrono
        self.gps = chrono.gps
        threading.Thread.__init__(self)
        self.ipadr = "no ip address"
        self.cache_name = pathcache+'/INFOS' 
        self.Infos = False
        logger.info("IpControl init complete")
    
    def run(self):
        self.__running = True
        loop = 99
        while self.__running:   
            if loop > 30:
                command = 'hostname -I'
                proc_retval = subprocess.check_output(shlex.split(command))
                self.ipadr = str(proc_retval.strip().decode())
                loop = 0
                self.writeInfos() # Infos
            loop = loop+1
            #logger.info("call write Infos")
            #self.writeInfos() # Infos
            time.sleep(2) # every minute (30 loops * 2 seconds), we check if we have not changed the network
        logger.info("end of IpControl Thread of main program")
        
    def getip(self):
        return self.ipadr
        
    def stop(self):
        self.__running = False
            
    def writeInfos(self):
        #logger.info("begin write Infos")
        NomCircuit = "inconnu"
        #logger.info(str(self.chrono.circuit))
        if self.chrono.circuit != False:
            if "NomCircuit" in self.chrono.circuit:
                NomCircuit = self.chrono.circuit["NomCircuit"]
        #logger.info("build Infos")
        self.Infos = '[{"nbsats":"'+str(self.gps.gpsnbsat)+'"'
        self.Infos += ',"tempcpu":"'+str(round(get_thermal()))+'"'
        self.Infos += ',"volts":"'+str(get_volts())+'"'
        self.Infos += ',"circuit":"'+NomCircuit+'"'
        self.Infos += ',"distcircuit":"'+str(round(self.chrono.neardist))+'"'
        self.Infos += '}]'
        #logger.info("try to write Infos")
        try:
            with open(self.cache_name, 'w') as cache: # the file is initialized
                cache.write(self.Infos+'\r\n')
                cache.close()
                #logger.info("write Infos ok")
        except OSError as err:
            logger.error("cannot use cache file OS error: {0}".format(err))
            pass
        
class IlsControl(threading.Thread):
    # this class is used to simulate an ILS connected to a magnetic tape chronometer (Alfano type)
    # you can then use the stopwatch screen to see the times and do without the LCD display

    def __init__(self, ils_pin, led_pin): # la led est facultative
        threading.Thread.__init__(self) 
        self.ils_pin = ils_pin
        self.ilstime = False # waiting time before activating the signal to the stopwatch
        self.ilsticktime = False # time of the signal to the stopwatch
        self.chrono = False
        self.led = False
        self.led_pin = False
        if led_pin != False:
            self.led_pin = led_pin
            self.led = LedControl(led_pin)
            self.led.start()
        self.ilsactiv = True
        logger.info("IlsControl init complete")
        
    def run(self):
        self.__running = True
        cpt = 0
        logger.info("IlsControl running")
        while self.__running:
            if self.ilstime != False:
                self.ilstime = False
                #logger.info("attente avant envoi signal ils")
                logger.info("tour ils:"+str(self.chrono.nblap))
                if self.chrono.nblap == 1:
                    logger.info("tTimer start request")
                    delai = 3.0
                    tTimer = Timer(delai, self.tick_delayed())
                    tTimer.start()  # after 3 seconds, the tick is triggered
                    logger.info("tTimer started after:"+str(delai)+" secs")
                else:
                    self.ilsticktime += self.chrono.temps_tour / timedelta(seconds=1)
                    delai = self.ilsticktime - time.time()
                    tTimer = Timer(delai, self.tick_delayed())
                    time.sleep(0.1)
                    logger.info("tTimer started after:"+str(delai)+" secs")
                    
                # wait before triggering the signal
                #time.sleep(self.ilstime)
                #io.digitalWrite(self.ils_pin,1)
                #logger.info("envoi signal ils")
                #time.sleep(0.01)
                #io.digitalWrite(self.ils_pin,0)
                if self.led != False:
                    self.led.set_led_fast_flash(3)
                #self.ilstime = False

            time.sleep(0.01)
        # end of thread
        self.stop()
        logger.info("end of IlsControl Thread of main program")
        
    def stop(self):
        logger.info("ils stop request "+str(self.ilsactiv))

        if self.ilsactiv == False:
            logger.info("ils not activ")
            return

        if self.led != False:
            self.led.stop()
        self.__running = False
        self.ilsactiv = False
        
    def set_ilstime(self,ilstime):
        # we receive a time in microseconds
        self.ilstime = float(ilstime/1000000.) # transformation in seconds for time.sleep
        
    def set_chrono(self,chrono):
        self.chrono = chrono
        
    def tick_delayed(self):
        io.digitalWrite(self.ils_pin,1)
        self.ilsticktime = time.time() # time of the signal to the stopwatch
        time.sleep(0.01)
        io.digitalWrite(self.ils_pin,0)
        logger.info("envoi signal ils, time:"+str(self.ilsticktime))
        
class SessionControl():
    CLOSED = 0
    OPEN = 1

    def __init__(self,chrono):
        self.chrono = chrono
        self.Line1 = False       
        self.line = False       
        self.__current_state = self.CLOSED
        logger.info("SessionControl init complete")
        self.best_time = False
        self.best = 0

    def start_session(self):
        #if self.__current_state != self.OPEN:
        if self.Line1 == False:
            # we write the coordinates of the FL and the Intermediaries
            line = ""
            date = formatGpsDate(self.chrono.gps)
            line += date+";"
            temps = formatGpsTime(self.chrono.gps)
            line += temps+";"
            NomCircuit = ""
            if chrono.circuit != "" and chrono.circuit != False:
                NomCircuit = chrono.circuit["NomCircuit"]
                chrono.lcd.set_display_sysmsg("Circuit://"+NomCircuit,chrono.lcd.DISPLAY,3)
            line += NomCircuit+";"
            line += str(chrono.startlat1)+";"
            line += str(chrono.startlon1)+";"
            line += str(chrono.startlat2)+";"
            line += str(chrono.startlon2)+";"
            line += str(chrono.startline.lat)+";"
            line += str(chrono.startline.lon)+";"
            line += str(chrono.startline.cap)+";"
            self.Line1 = line
            self.line = line
            # we will populate the list of sessions of the ChronoControl class
            self.chrono.dsess = ({"time":temps,"best":0,"tblaps":[]}) #time = heure de début de sessions #best = numéro du meilleur tour #tblaps = liste des chronos 
            
        
    def stop(self):
        if self.__current_state != self.CLOSED:
            self.fileDescriptor.close()
            self.__current_state = self.CLOSED
            logger.info("session file closed")
            # we will populate the list of sessions of the ChronoControl class
            self.chrono.tbsessions.append(self.chrono.dsess)
            self.best_time = False
            self.best = 0
            self.Line1 = self.line # pour écrire la ligne 1 quand on démarrera une autre session
        
        
    def close(self):
        if self.__current_state != self.CLOSED:
            self.fileDescriptor.close()
            self.__current_state = self.CLOSED
            logger.info("session file closed")
        
    def commit(self):
        if self.__current_state != self.CLOSED:
            #logger.info(str(self.fileDescriptor))
            name = self.fileDescriptor.close
            self.fileDescriptor.close()
            #self.fileDescriptor = open(name, 'a')
            self.fileDescriptor = open(pathdata+'/sessions/session-'+self.chrono.fileTime+'.txt', 'a')
            #logger.info("session file commit")
        
    def write(self,line=""):
        if self.__current_state != self.OPEN:
            self.start_session() #jfk
            self.fileDescriptor = open(pathdata+'/sessions/session-'+self.chrono.fileTime+'.txt', 'a')
            self.__current_state = self.OPEN
            logger.info("session file open")
            if self.Line1 != False:
                self.write(self.Line1)
                self.Line1 = False # pour prévenir de ne pas réécrire la ligne 1 
            # we will populate the list of sessions of the ChronoControl class
            temps = formatGpsTime(self.chrono.gps)
            self.chrono.dsess = ({"time":temps,"best":0,"tblaps":[]}) #time = session start time #best = best lap number #tblaps = time list
        if line == "": #on formate une ligne de session par défaut
            # actual date(jj/mm/aaaa);actual time;tour;temps du tour (mm:ss.cc)
            line = ""
            line += formatGpsDate(self.chrono.gps)+";"
            temps = formatGpsTime(self.chrono.gps)
            line += temps+";"
            line += str(self.chrono.nblap)+";"
            temps_tour = formatTimeDelta(self.chrono.temps_tour)
            line += temps_tour+";"
            # the times of the sectors are added if they exist
            i = 0
            while i < len(self.chrono.temps_secteurs):
            
                line += formatTimeDelta(self.chrono.temps_secteurs[i])+";"
                i = i+1
            # we will populate the list of sessions of the ChronoControl class
            nt = len(self.chrono.dsess["tblaps"])
            if nt == 0:
                self.best_time = temps_tour
                self.best = nt
            if self.best_time == False or self.best_time > temps_tour:
                self.best_time = temps_tour
                self.best = nt
            self.chrono.dsess["time"] = temps
            self.chrono.dsess["best"] = self.best
            self.chrono.dsess["tblaps"].append(temps_tour)

        line += "\r\n"
        #self.fileDescriptor.write('{0:}'.format(line.encode('utf8')))
        self.fileDescriptor.write(line)
        
class LiveSession(threading.Thread):
    # CLOSED = 0
    # OPEN = 1

    def __init__(self,chrono):
        threading.Thread.__init__(self)
        self.__running = False
        self.chrono = chrono # we will get the data from ChronoControl
        self.gps = self.chrono.gps
        #self.live = pathdata+'/sessions/live.txt' # location of the live file
        self.live = pathcache+'/LIVE' # location of the live file
        self.Line = False
        self.Line1 = False

        # self.trace = pathdata+'/sessions/trace.txt' # location of the trace file
        # with open(self.trace, 'w') as trace: # the file is initialized
        #     trace.write("")
        #     trace.close()
        logger.info("LiveSession init complete")        

    def run(self):
        self.__running = True
        self.cpt = 0
        while self.__running:
            #if self.chrono.circuit != False:
            # we write only if there is a timestamp
            if self.gps.gpstime != 0:
                if self.chrono.startlat1 != False:
                    # the start line is drawn
                    if self.Line1 == False:
                        self.createLine1() # line 1 contains the coordinates of the circuit
                    if self.Line1 != False:
                        # we will write the line in the live session file
                        #logger.info("try open live Line1")
                        with open(self.live, 'w') as live: # the data is overwritten with more recent data
                            #logger.info("try write live Line1")
                            live.write("{\"circuit\":"+self.Line1+",\r\n") # the coordinates of the current circuit are systematically written
                            self.createPoint()
                            #logger.info("try write live point")
                            live.write("\"point\":"+self.Line+"}\r\n")
                            live.close()
                else:
                    # we will write the line in the live session file without line 1
                    self.createPoint()
                    #logger.info("try open live")
                    with open(self.live, 'w') as live: # the data is overwritten with more recent data
                        #logger.info("try write live only point")
                        live.write(self.Line+"\r\n")
                        live.close()
                    ## as long as we are not on an identified or created circuit, it is useless to write every second
                    #time.sleep(9)
            time.sleep(1)
        logger.info("end of LiveSession Thread of main program")
        
    def stop(self):
        logger.info("session live stop")
        if self.__running == False:
            return
        self.__running = False

    def createPoint(self):
        self.Line = '[{"timestamp":"'+str(self.gps.gpstime)+'"'
        self.Line += ',"pointgps":['+str(self.gps.latitude)+","+str(self.gps.longitude)
        # to minimise the size of the lines we round to 2 decimal places
        self.Line += '],"vitesse":'+str(round(self.gps.gpsvitesse,2))
        self.Line += ',"altitude":'+str(round(self.gps.gpsaltitude,2))
        self.Line += ',"cap":'+str(round(self.gps.gpscap,2))
        self.Line += ',"lap":'+str(self.chrono.nblap)
        if self.chrono.dD > 0:
            self.Line += ',"neartrk":["'+self.chrono.neartrack+'",'+str(round(self.chrono.dD))+']'
        else:
            self.Line += ',"neartrk":["'+self.chrono.neartrack+'",'+str(round(self.chrono.neardist))+']'
        self.Line += '}]'
        #logger.debug("***"+str(self.Line)+"***")

        # with open(self.trace, 'a') as trace: # we write the trace file
        #     trace.write(self.Line+"\r\n")
        #     trace.close()

    def createLine1(self):
        #logger.info(str(self.chrono.circuit))
        line = '[{"date":"'+str(formatGpsDate(self.gps))+'"'
        NomCircuit = "inconnu"
        #logger.debug("circuit:"+str(type(self.chrono.circuit)))
        if self.chrono.circuit != False:
            if "NomCircuit" in self.chrono.circuit:
                NomCircuit = self.chrono.circuit["NomCircuit"]
        line += ',"NomCircuit":"'+NomCircuit+'"'
        line += ',"FL":['+str(self.chrono.startlat1)+","+str(self.chrono.startlon1)+","+str(self.chrono.startlat2)+","+str(self.chrono.startlon2)+"]"
        if self.chrono.pitin != False and self.chrono.pitout != False:
            line += ',"PitIn":['+str(self.chrono.pitin.lat1)+","+str(self.chrono.pitin.lon1)+","+str(self.chrono.pitin.lat2)+","+str(self.chrono.pitin.lon2)+"]"
            line += ',"PitOut":['+str(self.chrono.pitout.lat1)+","+str(self.chrono.pitout.lon1)+","+str(self.chrono.pitout.lat2)+","+str(self.chrono.pitout.lon2)+"]"
        i = 0
        while i < len(self.chrono.intline):
            line += ',"Int'+str(i+1)+'":['+str(self.chrono.intline[i].lat1)+","+str(self.chrono.intline[i].lon1)+","+str(self.chrono.intline[i].lat2)+","+str(self.chrono.intline[i].lon2)+"]"
            i = i+1            

        line += '}]'
        self.Line1 = line
        
class AnalysisControl():
    CLOSED = 0
    OPEN = 1

    def __init__(self,chrono):
        self.chrono = chrono
        self.gps = chrono.gps
        self.__current_state = self.CLOSED
        self.Line1 = False
        self.Line = False
        #self.Lap0 = False
        logger.info("AnalysisControl init complete")

    def start_analysis(self):
        if self.__current_state != self.OPEN:
            self.filename = pathdata+'/analysis/analysis-'+self.chrono.fileTime+'.json'
            self.fileDescriptor = open(self.filename, 'w')
            self.__current_state = self.OPEN
            logger.info("analysis file open")
        
    def stop(self):
        if self.__current_state != self.CLOSED:
            self.fileDescriptor.close()
            self.__current_state = self.CLOSED
            self.Line = False
            self.Line1 = False # to force the writing of line 1 when the file is opened again
            logger.info("analysis file closed")
        
    def writePoint(self):
        if self.Line1 == False:
            self.writeLine1()
        self.Line = '[{"timestamp":"'+str(self.chrono.time0)+'"'
        #self.Line += ',"tour":'+str(self.chrono.nblap)
        self.Line += ',"pointgps":['+str(self.chrono.lat0)+","+str(self.chrono.lon0)
        #logger.debug("pointgps:"+str(self.chrono.lat0)+","+str(self.chrono.lon0))
        self.Line += '],"vitesse":'+str(self.chrono.speed0)
        #self.Line += ',"altitude":'+str(self.chrono.alt0)
        self.Line += ',"cap":'+str(self.chrono.cap0)+'}]'
        self.write(self.Line)
    #    
    #def saveLap0(self):
    #    self.Lap0 = '[{"timestamp":"'+str(self.chrono.time0)+'"'
    #    self.Lap0 += ',"tour":1'
    #    self.Lap0 += ',"pointgps":['+str(self.chrono.lat0)+","+str(self.chrono.lon0)
    #    self.Lap0 += '],"vitesse":'+str(self.chrono.speed0)
    #    self.Lap0 += ',"altitude":'+str(self.chrono.alt0)
    #    self.Lap0 += ',"cap":'+str(self.chrono.cap0)+'}]'
        
    def writeLine1(self):
        #line = '[{"date":"'+str(formatGpsDate(self.gps))+'"'
        line = '[{"date":"'+formatGpsDate(self.gps)+'"'
        NomCircuit = ""
        if self.chrono.circuit != False and self.chrono.circuit != "":
            NomCircuit = self.chrono.circuit["NomCircuit"]
        line += ',"NomCircuit":"'+NomCircuit+'"'
        line += ',"FL":['+str(self.chrono.startlat1)+","+str(self.chrono.startlon1)+","+str(self.chrono.startlat2)+","+str(self.chrono.startlon2)+"]"
        if self.chrono.pitin != False and self.chrono.pitout != False:
            line += ',"PitIn":['+str(self.chrono.pitin.lat1)+","+str(self.chrono.pitin.lon1)+","+str(self.chrono.pitin.lat2)+","+str(self.chrono.pitin.lon2)+"]"
            line += ',"PitOut":['+str(self.chrono.pitout.lat1)+","+str(self.chrono.pitout.lon1)+","+str(self.chrono.pitout.lat2)+","+str(self.chrono.pitout.lon2)+"]"
        i = 0
        while i < len(self.chrono.intline):
            line += ',"Int'+str(i+1)+'":['+str(self.chrono.intline[i].lat1)+","+str(self.chrono.intline[i].lon1)+","+str(self.chrono.intline[i].lat2)+","+str(self.chrono.intline[i].lon2)+"]"
            i = i+1            

        line += '}]'
        self.write(line)
        self.Line1 = True
        #if self.Lap0 != False:
        #    logger.info("Lap0:"+str(self.Lap0))
        #    self.write(self.Lap0)
        
    def write(self,line=""):
        if self.__current_state != self.OPEN:
            self.start_analysis()
        if self.__current_state == self.OPEN:
            line += "\r\n"
            #self.fileDescriptor.write('{0:}'.format(line.encode('utf8')))
            self.fileDescriptor.write(line)
        else:
            logger.info("unexcepted analysis file closed !")
        
class ChronoControl():
    chronoStartTime = timedelta(seconds=0) 
    chronoPrevTime = timedelta(seconds=0)
    chronoGpsTime = timedelta(seconds=0)
    dDprev = 0
    temps_tour = timedelta(seconds=0)
    temps_t = timedelta(seconds=0)
    temps_en_cours = timedelta(seconds=0)
    nbFreeze = 0 # number of frozen gps cycles (at the same position) for switching to READY mode
    nbSleep = 0 # number of frozen gps cycles (at the same position) for switching to STOP mode
    temps_inter = timedelta(seconds=0)
    temps_i = timedelta(seconds=0)
    temps_secteurs = []
    best_lap = timedelta(seconds=0)
    circuit = False
    in_pitlane = False # indicates if we are in the pitlane
    predict_time = False

    class ChronoData():
        lat = 0
        lon = 0
        cap = 0
        lat1= 0
        lon1= 0
        lat2= 0
        lon2= 0

        def __init__(self):
            self.dist = 50.0
            
        def draw(self,width=TrackWidth):
            phi1 = deg2rad(self.lat)
            lambda1 = deg2rad(self.lon)
            teta = deg2rad(self.cap)
            delta = self.dist / RT
            delta_phi = delta * cos(teta)
            phi2 = phi1 + delta_phi
            if abs(phi2) > pi/2:
                if phi2 > 0:
                    phi2 = pi - phi2
                else:
                    phi2 = -pi -phi2
            delta_psi = log(tan(phi2/2 + pi/4) / tan(phi1/2 + pi/4))
            q = abs(delta_psi)
            if q > 10e-12:
                q = delta_phi / delta_psi
            else:
                q = cos(phi1)
            delta_lambda = delta * sin(teta) / q
            lambda2 = lambda1 + delta_lambda
            # latitude and longitude destination according to starting point, distance and heading
            dlat = rad2deg(phi2)
            dlon = rad2deg(lambda2)
            
            self.icoord = self.Perpendicular(self.lat,self.lon,dlat,dlon)
            # the coordinates of the ends of the start-finish line are determined
            # coordinates of the point on one side of the perpendicular
            self.coord1 = self.StraightPoint(self.lat,self.lon,self.icoord.Plat,self.icoord.Plon,width)
            # coordinates of the opposite point
            self.coord2 = self.StraightPoint(self.lat,self.lon,self.icoord.PlatO,self.icoord.PlonO,width)
            
        class Perpendicular():
        
            def __init__(self,lat1,lon1,lat2,lon2):
                Ya = lat1
                Xa = lon1
                Yb = lat2
                Xb = lon2
                r = distanceGPS(lat1,lon1,lat2,lon2)
                # coordinates of a point B on a circle of centre A: X, Y
                X = Xb-Xa # X = adjacent side of the angle a
                Y = Yb-Ya # Y = opposite side of the angle a
               
                latA = deg2rad(lat1);
                lonA = deg2rad(lon1);
                latB = deg2rad(lat2);
                lonB = deg2rad(lon2);
                
                cosA = cos(latA)
                cosB = cos(latB)
                
                self.Plon = Xa+(Y*(1/cosA))
                self.Plat = Ya+(X*cosA*-1)
                self.PlonO = Xa-(Y*(1/cosA))
                self.PlatO = Ya-(X*cosA*-1)
            
        class StraightPoint():
        
            def __init__(self,lat1,lon1,lat2,lon2,width):
                d = distanceGPS(lat1,lon1,lat2,lon2)

                Ya = lat1
                Xa = lon1
                Yb = lat2
                Xb = lon2
                self.lat = Ya + ((Yb - Ya) * width / d)
                self.lon = Xa + ((Xb - Xa) * width / d)
            
        class Line(): # class that holds the information of a line (start-finish or partial)
            lat1 = 0.
            lon1 = 0.
            lat2 = 0.
            lon2 = 0.
            partiel = False

    def __init__(self,gps,lcd,ils, main_led, led_pin):
        self.gps = gps
        self.chrono_begin = False
        self.chrono_started = False
        self.start_line = False # the start-finish line must be defined
        self.last_time = 0.0
        self.sleep_time = 0
        self.lcd = lcd
        self.pitin = False
        self.pitout = False
        self.startLineCut = False
        self.ils = ils
        self.nblap = 0
        self.lap = 0
        self.npoint = 0
        self.distseg = 0

        self.main_led = main_led # the main LED is common to several processes
        self.led = False
        self.led_pin = False
        logger.info('init ChronoGPSControl led:'+str(led_pin))
        if led_pin != False:
            self.led_pin = led_pin
            self.led = LedControl(led_pin)
            self.led.start()
        
        self.lat0 = 0;
        self.lon0 = 0;
        self.time0 = 0;
        self.speed0 = 0;
        self.cap0 = 0;
        self.alt0 = 0;
    
        self.tbsessions = [] # the list is filled by the SessionControl class
        self.lcd.set_chrono(chrono) # so that the DisplayControl class knows about ChronoControl

        logger.info("ChronoControl init complete")
        self.lcd.set_display_sysmsg("ChronoControl//init complete",self.lcd.DISPLAY,2)
        
        self.fileTime = False # time associated with files (name sync)

        self.circuit = ""
        self.startlat1 = False
        self.startlon1 = False
        self.startlat2 = False
        self.startlon2 = False
        self.intline = []
        
        self.neardist = 999999
        self.neartrack = ""

        self.dD = 0
        
    def begin(self):
        if self.chrono_begin == True:
            return True
        #logger.info('begin chrono_begin:'+str(self.chrono_begin))
        self.chrono_begin = True
        self.nblap = 0
        self.nblap = 0
        self.lap = 0
        self.npoint = 0
        self.distseg = 0
        
        self.chronoStartTime = self.getTime(gps.gpstime)
        #self.chronoStartTime = self.getTime(gps.prevtime)
        
        self.chronoPrevTime = timedelta(seconds=0)
        self.chronoGpsTime = timedelta(seconds=0)
        self.dDprev = 0
        self.temps_tour = timedelta(seconds=0)
        self.best_lap = timedelta(seconds=0)
        self.temps_t = timedelta(seconds=0)
        self.temps_en_cours = timedelta(seconds=0)
        self.nbFreeze = 0
        self.nbSleep = 0
        self.temps_inter = timedelta(seconds=0)
        self.temps_i = timedelta(seconds=0)
        self.in_pitlane = False # we don't know if we are in the pitlane so, by default, we ignore it
        self.fileTime = formatGpsDateTime(self.gps,format="FILE")
        #jfk
        self.main_led.set_led_off()
        self.main_led.set_led_very_slow_flash()
        #logger.info('begin lap:'+str(self.nblap))
        
    def define_start_wcap(self,lat,lon,cap):
        # definition of the start-finish line according to the coordinates of the middle of the start-finish line and the heading
        self.startline = self.ChronoData()
        self.startline.lat = lat
        self.startline.lon = lon
        self.startline.cap = cap
        # in order not to overflow into the pitlane, we will only take 60% of the width of the track
        # self.startline.draw(TrackWidth * 0.6);
        self.startline.draw(TrackWidth); # we take the whole width of the track
        self.startlat1 = self.startline.coord1.lat
        self.startlon1 = self.startline.coord1.lon
        self.startlat2 = self.startline.coord2.lat
        self.startlon2 = self.startline.coord2.lon
        self.chronoStartTime = self.getTime(gps.gpstime)
        self.temps_t = timedelta(seconds=0)
        self.temps_i = timedelta(seconds=0)
        self.start_line = True
        self.circuit = ""
        self.intline = []
        
    def getLineWithCap(self,lat,lon,cap):
        # get coords of the line according to the coordinates of the middle of the line passed in parameter and the heading
        self.capline = self.ChronoData()
        self.capline.lat = lat
        self.capline.lon = lon
        self.capline.cap = cap
        self.capline.coords = []
        self.capline.draw(TrackWidth); # we take the whole width of the track
        self.capline.coords.append("")
        self.capline.coords[0] = self.capline.coord1.lat
        self.capline.coords.append("")
        self.capline.coords[1] = self.capline.coord1.lon
        self.capline.coords.append("")
        self.capline.coords[2] = self.capline.coord2.lat
        self.capline.coords.append("")
        self.capline.coords[3] = self.capline.coord2.lon


    def create_sfTrack(self):
        line = '{"date":"'+str(formatGpsDate(self.gps))+'"'
        line += ',"NomCircuit":"autotrack"'
        line += ',"FL":['+str(self.startlat1)+","+str(self.startlon1)+","+str(self.startlat2)+","+str(self.startlon2)+"]"
        line += '}'
        self.track = pathdata+'/tracks/autodef.trk' # location of the autodef track file
        with open(self.track, 'w') as track: # the data is overwritten with more recent data
            track.write(line+"\r\n")
            track.close()
        os.chmod(self.track, 0o777)

    
    def define_start_wcoord(self,lat1,lon1,lat2,lon2):
        # definition of the start-finish line according to the coordinates of the ends of the start-finish line
        self.startline = self.ChronoData()
        self.startlat1 = lat1
        self.startlon1 = lon1
        self.startlat2 = lat2
        self.startlon2 = lon2
        self.chronoStartTime = self.getTime(gps.gpstime)
        self.temps_t = timedelta(seconds=0)
        self.temps_i = timedelta(seconds=0)
        self.start_line = True
        self.circuit = ""
        self.intline = []
        
    def start_chrono(self):
        if self.chrono_started == True:
            return True
        if self.chrono_begin != True:
            # the stopwatch is started for the first time
            self.begin()

        if self.chrono_started != True:
            self.auto_start_line()

            if self.start_line == True:
                self.chrono_started = True
        
    def stop(self):
        if self.chrono_started != False:
            self.chrono_started = False
        self.main_led.set_led_off()
            
    def terminate(self):
        if self.led != False:
            self.led.stop()

    def is_sleep(self):
        global gps

        if self.sleep_time != gps.gpstime: # already calculated ?
            self.sleep_time = gps.gpstime
            # is it static (frozen position) since time > SleepTime ?
            if gps.gpsvitesse < 5: # if the speed is below 5km/h we are frozen
                self.nbSleep = self.nbSleep + 1 # frozen cycles are counted
            else:
                self.nbSleep = 0
        
    def getGpsData(self):
        global gps
        self.gps_gpstime    = gps.gpstime
        self.gps_latitude   = gps.latitude
        self.gps_longitude  = gps.longitude
        self.gps_prevlat    = gps.prevlat
        self.gps_prevlon    = gps.prevlon
        self.gps_last_time  = gps.last_time
        self.gps_last_speed = gps.last_speed
        self.gps_gpsvitesse = gps.gpsvitesse
        self.gps_gpsaltitude = gps.gpsaltitude
        self.gps_gpscap      = gps.gpscap
        self.Freq           = gps.Freq        
        self.corrFreq       = 1000000/self.Freq # correction to be applied to the time according to the frequency
        
    def compute(self):
         # GPS information is retrieved in one go
         # to avoid possible problems in case of changes during the calculations
        self.getGpsData();
    
        global delayed_msg

        if self.last_time != self.gps_gpstime: # calculations are made only if the time changed.
            self.last_time = self.gps_gpstime
            if self.chrono_started == True: # calculations are only performed if the stopwatch is started
                self.chronoGpsTime = self.getTime(self.gps_gpstime)
                if self.start_line == True: # calculations are only performed if the line is well defined
                    if self.chronoPrevTime == 0:
                        self.chronoPrevTime = self.chronoStartTime
                    temps = self.chronoGpsTime - self.chronoStartTime
                    #
                    # is the pitlane defined ?
                    if self.pitin != False:
                        # are we in the pitlane ?
                        if self.in_pitlane == False:
                            # are we going to get into the pitlane ?
                            self.lineCut = self.is_lineCut(self.pitin.lat1,self.pitin.lon1,self.pitin.lat2,self.pitin.lon2,self.gps_latitude,self.gps_longitude,self.gps_prevlat,self.gps_prevlon)
                            if self.lineCut == True:
                                self.in_pitlane = True # we enter the pitlane
                                self.lcd.set_display_sysmsg(" //Pit In",lcd.DISPLAY_BIG,20)
                                # here, we will make a yellow LED blink as long as we are in the pitlane
                                self.main_led.set_led_off()
                                self.main_led.set_led_slow_flash()
                        else: # we are in the pitlane
                            # will we get out of the pitlane ?
                            # if we cut a line (pitout, start or intermediate) then we are out of the pitlane
                            self.lineCut = self.is_oneLineCut()
                            if self.lineCut == True:
                                self.in_pitlane = False # we leave the pitlane
                                self.lcd.set_display_sysmsg(" //Pit Out",lcd.DISPLAY_BIG,20)
                                # here, we will turn off the yellow LED associated with the pitlane
                                self.main_led.set_led_off()
                            
                    if self.temps_i == 0:
                        self.temps_i = self.chronoStartTime
                    
                    self.startLineCut = self.is_lineCut(self.startlat1,self.startlon1,self.startlat2,self.startlon2,self.gps_latitude,self.gps_longitude,self.gps_prevlat,self.gps_prevlon)

                    self.dD = self.calculDistances(self.startlat1,self.startlon1,self.startlat2,self.startlon2,self.gps_latitude,self.gps_longitude)
                        
                    # we will take care of the timing only if we are not in the pitlane
                    if self.in_pitlane == False:
                        # if we are in the process of timing, we trigger the writing of the analysis file
                        if self.nblap > 0:
                            if self.lap != self.nblap:
                                self.npoint = 0
                                self.lap = self.nblap
                            self.npoint += 1
                            fanalys.writePoint()
                            self.lat0 = self.gps_prevlat
                            self.lon0 = self.gps_prevlon
                            self.time0 = self.gps_gpstime
                            self.speed0 = self.gps_gpsvitesse
                            self.alt0 = self.gps_gpsaltitude
                            self.cap0 = self.gps_gpscap
                        
                        # the distance travelled between 2 gps points is calculated
                        self.distseg = distanceGPS(self.gps_prevlat, self.gps_prevlon, self.gps_latitude, self.gps_longitude)
                            
                        # is the start-finish line crossed ?
                        if self.startLineCut == True:
                            dDp0 = self.calculDistances(self.startlat1,self.startlon1,self.startlat2,self.startlon2,self.gps_prevlat,self.gps_prevlon)
                            # calculation of the distance between the current point and the start-finish line
                            dDp1 = self.calculDistances(self.startlat1,self.startlon1,self.startlat2,self.startlon2,self.gps_latitude,self.gps_longitude)
                            
                            v0 = (self.gps_last_speed*1000)/3600 # speed at the previous point
                            v1 = (self.gps_gpsvitesse*1000)/3600 # speed at current point
                            vmoy = (v0+v1)/2 # average speed to travel the straight line segment
                            dc0 = dDp0*(v1/vmoy) # compensated distance before crossing the line
                            dc1 = dDp1*(v0/vmoy) # compensated distance after crossing the line
                                
                            corrtime = self.chronoGpsTime - self.chronoPrevTime

                            if self.distseg > 0: # distseg = 0 is possible, if the gps remains static
                                cormic = getMicroseconds(corrtime) * (dc0/(dc0+dc1));
                                if self.ils != False:
                                    self.ils.set_ilstime(cormic)
                                corrtime = timedelta(microseconds=cormic)
                            
                            temps_estime = self.chronoPrevTime + corrtime
                            
                            temps = temps_estime - self.chronoStartTime # temps = time passed since the start 
                            if self.nblap == 0:
                                self.temps_t = temps

                            self.temps_tour = temps - self.temps_t

                            self.temps_t = temps #
    
                            # the start-finish line is also the part of the last sector
                            self.temps_inter = temps - self.temps_i
                            self.temps_i = temps #
                            if (len(self.intline)) > 0:
                               self.temps_secteurs.append(self.temps_inter)
                            
                            # here we will write the gain or loss compared to the best lap
                            if self.best_lap == timedelta(seconds=0):
                               self.best_lap = self.temps_tour
                            else:
                                diff = timedelta(seconds=0)
                                msg = formatTimeDelta(self.temps_tour)+'//'
                                if self.temps_tour < self.best_lap:
                                    diff = self.best_lap - self.temps_tour
                                    msg += "-"+formatTimeDelta(diff,"sscc")
                                    self.best_lap = self.temps_tour
                                    self.led.set_led_fast_flash(2)
                                else:
                                    diff = self.temps_tour - self.best_lap
                                    msg += "+"+formatTimeDelta(diff,"sscc")
                                # we will display the gain or loss within 3 seconds
                                delayed_msg = msg
                            # we write in the sessions file
                            if self.nblap > 0:
                                fsession.write()
                                fsession.commit() # the file is closed and reopened so as not to lose information in the event of a power cut
    
                            if (len(self.intline)) > 0:
                               self.temps_secteurs = [] # the times of the sectors are erased

                            if self.nblap == 0:
                                self.lcd.set_display_sysmsg("Start-Finish//Line",lcd.DISPLAY,2)
                            else:
                                self.main_led.set_led_off()

                                t = formatTimeDelta(self.temps_tour)
                                buff1 = t+" Lap "+str(self.nblap)+"//"
                                buff1 = buff1+t+"//"
                                buff1 = buff1+lcd.localTime+" "+formatVitesse(self.gps_gpsvitesse)
                                self.lcd.set_display_sysmsg(buff1,lcd.DISPLAY_BIG,20)
                            
                            self.nblap += 1
                            logger.info("nblap:"+str(self.nblap))

                        else: # we'll see if we've crossed an intermediate line
                            i = 0
                            self.lineCut = False
                            while i < len(self.intline):
                                if self.lineCut == True:
                                    break
                                self.lineCut = self.is_lineCut(self.intline[i].lat1,self.intline[i].lon1,self.intline[i].lat2,self.intline[i].lon2,self.gps_latitude,self.gps_longitude,self.gps_prevlat,self.gps_prevlon)
                                j = i
                                i = i+1
                            if self.lineCut == True:
                                i = j
                                dDprev = self.calculDistances(self.intline[i].lat1,self.intline[i].lon1,self.intline[i].lat2,self.intline[i].lon2,self.gps_prevlat,self.gps_prevlon)
                                dD = self.calculDistances(self.intline[i].lat1,self.intline[i].lon1,self.intline[i].lat2,self.intline[i].lon2,self.gps_latitude,self.gps_longitude)
                            
                                v0 = self.gps_last_speed # speed at the previous point
                                v1 = self.gps_gpsvitesse # speed at current point
                                vmoy = (v0+v1)/2 # average speed to travel the straight line segment
                                dc0 = dDprev*(v1/vmoy) # compensated distance before crossing the line
                                dc1 = dD*(v0/vmoy) # compensated distance after crossing the line

                                corrtime = self.chronoGpsTime - self.chronoPrevTime

                                if self.distseg > 0: # distAB = 0 is possible, if the gps remains static
                                    cormic = getMicroseconds(corrtime) * (dc0/(dc0+dc1));
                                    corrtime = timedelta(microseconds=cormic)

                                temps_estime = self.chronoPrevTime + corrtime
                            
                                temps = temps_estime - self.chronoStartTime # temps = time passed since the start
                                self.temps_inter = temps - self.temps_i
                                # si HillRaceMode = 1 on ne réinitialise pas le temps intermédiaire
                                if HillRaceMode != 1:
                                    self.temps_i = temps #
                                
                                self.temps_secteurs.append(self.temps_inter)
                                if self.nblap > 0:
                                    self.lcd.set_display_sysmsg("Secteur "+str(i+1)+"//"+formatTimeDelta(self.temps_inter)+"//"+formatLocalTime(gps),lcd.DISPLAY_BIG,20)
                                else:
                                    self.lcd.set_display_sysmsg(formatLocalTime(gps)+"//Sect. "+str(i+1),lcd.DISPLAY_BIG,20)
    
                               
                        self.temps_en_cours = temps - self.temps_t

                        if self.chronoPrevTime != self.chronoGpsTime:
                            self.chronoPrevTime = self.chronoGpsTime
                        self.dDprev = self.dD
                #
                # the stopwatch is started but, is it static (frozen position) and since when
                if self.gps_gpsvitesse < 5: # if the speed is below 5km/h we are frozen
                    self.nbFreeze = self.nbFreeze + 1 # frozen cycles are counted
                else:
                    self.nbFreeze = 0

    def calculDistances(self,lat1,lon1,lat2,lon2,poslat,poslon):
        # calculation of the lengths of the sides of the triangle formed by the current position and the 2 points on either side of the start point
        dAB = distanceGPS(lat1,lon1,lat2,lon2)
        dAC = distanceGPS(lat1,lon1,poslat,poslon)
        dBC = distanceGPS(lat2,lon2,poslat,poslon)
        # The 3 points are placed on a plane such that A is the origin (x=0;y=0) and B (x=dAB;0)
        a = dBC
        b = dAC
        c = dAB
        #a2 = a*a
        #b2 = b*b
        #c2 = c*c
        
        cosA = (((a*a)*-1)+(b*b)+(c*c))/(2*b*c)
        #((asq*-1)+bsq+csq)/(2*distAC*distAB)
        if cosA < 0 :
            cosA = 0
        elif cosA > 1 :
            cosA = 1
        arcosA = acos(cosA)
        sinA = sin(arcosA)
        dD = sinA*dAC # distance entre le point C et la droite AB
        return dD

    def is_lineCut(self,Ya,Xa,Yb,Xb,Yc,Xc,Yd,Xd):
        # as the distances are small compared to the dimensions of the earth, the coordinates are considered to be Cartesian as on a plane
        # coordinates are provided in latitude (Y axis) and longitude (X axis)
        # the segment a-b represents the line to be crossed (start-finish line, pitlane entry-exit or sector line)
        # the segment c-d represents the line travelled (from c to d)
        T1 = (Xb-Xa)*(Yc-Ya) - (Yb-Ya)*(Xc-Xa) # triangle abc
        T2 = (Xb-Xa)*(Yd-Ya) - (Yb-Ya)*(Xd-Xa) # triangle abd
        T3 = (Xd-Xc)*(Ya-Yc) - (Yd-Yc)*(Xa-Xc) # triangle cda
        T4 = (Xd-Xc)*(Yb-Yc) - (Yd-Yc)*(Xb-Xc) # triangle cdb
        #Seg1 = T1*T2
        #Seg2 = T3*T4
        if T1*T2 < 0 and T3*T4 < 0:
               # the line segments intersect
               return True
        return False
        
    def is_oneLineCut(self):
        cut = False;
        # has the pitout been cut ?
        cut = self.is_lineCut(self.pitout.lat1,self.pitout.lon1,self.pitout.lat2,self.pitout.lon2,self.gps_latitude,self.gps_longitude,self.gps_prevlat,self.gps_prevlon)
        if cut == False:
            # was the start/finish line cut ?
            cut = self.is_lineCut(self.startlat1,self.startlon1,self.startlat2,self.startlon2,self.gps_latitude,self.gps_longitude,self.gps_prevlat,self.gps_prevlon)
            if cut == False:
                i = 0
                # has an intermediate line been cut ?
                while i < len(self.intline):
                    if cut == True:
                        break
                    cut = self.is_lineCut(self.intline[i].lat1,self.intline[i].lon1,self.intline[i].lat2,self.intline[i].lon2,self.gps_latitude,self.gps_longitude,self.gps_prevlat,self.gps_prevlon)
                    i = i+1
        return cut
        
    def getTime(self,time2delta):
        timestr = str(time2delta)
        hh = timestr[0:2]
        mm = timestr[2:4]
        ss = timestr[4:6]
        #ms = timestr[7:10]
        ms = timestr[7:9]
        try:
            #return timedelta(hours=int(hh),minutes=int(mm),seconds=int(ss),milliseconds=int(ms))
            return timedelta(hours=int(hh),minutes=int(mm),seconds=int(ss),milliseconds=int(ms)*10)
        except:
            return timedelta(hours=0,minutes=0,seconds=0,milliseconds=0)

    def auto_start_line(self):
        #logger.info('auto_start_line start_line:'+str(self.start_line))
        if self.start_line == False:
            if GpsChronoMode == 0:
                # on détermine la ligne de départ-arrivée sur le point actuel
                self.getGpsData();
                self.define_start_wcap(self.gps_latitude,self.gps_longitude,self.gps_gpscap)
                # creation of the self-defined track
                self.create_sfTrack()
                self.lcd.set_display_sysmsg("Line//Defined",lcd.DISPLAY,2)
            if GpsChronoMode > 0:
                self.neardist = 999999
                self.neartrack = ""
                #logger.debug("circuit:"+str(type(circuits)))
                for track in circuits:
                    LatFL = 0
                    LonFL = 0
                    WithCoords = False
                    if "FL" in circuits[track]:
                        # FL is defined as the latitude and longitude of the two points on either side of the line
                        LatFL = float(circuits[track]["FL"][0])
                        LonFL = float(circuits[track]["FL"][1])
                        lat1 = LatFL
                        lon1 = LonFL
                        lat2 = float(circuits[track]["FL"][2])
                        lon2 = float(circuits[track]["FL"][3])
                        WithCoords = True
                    elif "LatFL" in circuits[track]:
                        if circuits[track]["LatFL"] != "":
                            LatFL = float(circuits[track]["LatFL"])
                            LonFL = float(circuits[track]["LonFL"])
                            CapFL = float(circuits[track]["CapFL"])
                            
                            self.getLineWithCap(LatFL, LonFL, CapFL)
                            lat1 = self.capline.coords[0]
                            lon1 = self.capline.coords[1]
                            lat2 = self.capline.coords[2]
                            lon2 = self.capline.coords[3]
                            
                    distcir = distanceGPS(gps.latitude, gps.longitude, LatFL, LonFL)
                    # logger.info('distance circuit:'+str(distcir)+' '+str(self.neardist)+' '+str(TrackProximity))

                    if distcir < self.neardist: # we found an even closer circuit
                        self.neartrack = circuits[track]["NomCircuit"]
                        self.neardist = distcir
                        if distcir < TrackProximity: # we are within x m of the circuit read in parameter
                            # on va regarder si on a coupé la ligne de départ du circuit à proximité
                            # was the start/finish line cut ?
                            if self.gps.prevlat != 0:
                                cut = self.is_lineCut(lat1,lon1,lat2,lon2,self.gps.latitude,self.gps.longitude,self.gps.prevlat,self.gps.prevlon)
                                #logger.info('is prox track cut:'+str(cut))
                                
                                if cut == True:
                                    # si la définition automatique de la ligne est en cours, on l'arrête
                                    if acq != False:
                                        if acq.active == True:
                                            logger.info('AcqControl to be canceled. distcir='+str(distcir)+' near='+str(self.neardist)+' is acq:'+str(acq))
                                            acq.cancel() # on abandonne le thread d'acquisition automatique de la ligne de départ-arrivée                  
                                    self.getGpsData(); # pour avoir accès aux données du GPS avec protection du rafraichissement pendant les calculs

                                    self.lcd.set_display_sysmsg("Start Line//Cut",lcd.DISPLAY,2)
                                    self.define_start_wcoord(lat1, lon1, lat2, lon2)
                                    self.circuit = circuits[track]
                                    self.begin()
                                    self.nblap = 1 # we start with the first lap
                                    self.chrono_started = True
                                    
                                    dt0 = self.getTime(self.gps_last_time)
                                    dt1 = self.getTime(self.gps_gpstime)
                                    
                                    # calculation of the distance between the previous point and the start-finish line
                                    dDp0 = self.calculDistances(self.startlat1,self.startlon1,self.startlat2,self.startlon2,self.gps_prevlat,self.gps_prevlon)
                                    # calculation of the distance between the current point and the start-finish line
                                    dDp1 = self.calculDistances(self.startlat1,self.startlon1,self.startlat2,self.startlon2,self.gps_latitude,self.gps_longitude)
                                
                                    corrtime = dt1 - dt0;
		
                                    v0 = self.gps.last_speed # speed at the previous point
                                    v1 = self.gps.gpsvitesse # speed at current point
                                    vmoy = (v0+v1)/2 # average speed to travel the straight line segment
                                    #
                                    dc0 = dDp0*(v1/vmoy) # compensated distance before crossing the line
                                    dc1 = dDp1*(v0/vmoy) # compensated distance after crossing the line
                                #
                                    corrtime = corrtime * (dc0/(dc0+dc1));
                                    corrmic = getMicroseconds(corrtime)
                                    
                                    temps = timedelta(microseconds=corrmic)

                                    self.chronoStartTime = dt0
                                    
                                    self.temps_t = temps #
                                    self.temps_i = temps #
                           
                                    self.lat0 = self.gps_prevlat
                                    self.lon0 = self.gps_prevlon
                                    self.time0 = self.gps_gpstime
                                    self.speed0 = self.gps_gpsvitesse
                                    self.alt0 = self.gps_gpsaltitude
                                    self.cap0 = self.gps_gpscap
                           
                if self.start_line == True: # here we have just defined the start-finish line
                    # then we'll get the other intermediate lines and pitlane
                    # is the pitlane defined ?
                    self.pitin = False
                    self.pitout = False
                    if "PitIn" in self.circuit:
                        self.pitin = self.ChronoData()
                        # PitIn1 is defined in latitude, longitude of the 2 points on either side of the line
                        self.pitin.lat1 = float(self.circuit["PitIn"][0])
                        self.pitin.lon1 = float(self.circuit["PitIn"][1])
                        self.pitin.lat2 = float(self.circuit["PitIn"][2])
                        self.pitin.lon2 = float(self.circuit["PitIn"][3])
                    elif "LatPitIn" in self.circuit:
                        if self.circuit["LatPitIn"] != "":
                            self.pitin = self.ChronoData()
                            
                            self.pitin.lat = float(self.circuit["LatPitIn"])
                            self.pitin.lon = float(self.circuit["LonPitIn"])
                            self.pitin.cap = float(self.circuit["CapPitIn"])
                            self.pitin.draw();
                            self.pitin.lat1 = self.pitin.coord1.lat
                            self.pitin.lon1 = self.pitin.coord1.lon
                            self.pitin.lat2 = self.pitin.coord2.lat
                            self.pitin.lon2 = self.pitin.coord2.lon
                    if "PitOut" in self.circuit:
                        self.pitout = self.ChronoData()
                        # PitOut1 is defined in latitude, longitude of the 2 points on either side of the line
                        self.pitout.lat1 = float(self.circuit["PitOut"][0])
                        self.pitout.lon1 = float(self.circuit["PitOut"][1])
                        self.pitout.lat2 = float(self.circuit["PitOut"][2])
                        self.pitout.lon2 = float(self.circuit["PitOut"][3])
                    elif "LatPitOut" in self.circuit:
                        if self.circuit["LatPitOut"] != "":
                            self.pitout = self.ChronoData()
                            
                            self.pitout.lat = float(self.circuit["LatPitOut"])
                            self.pitout.lon = float(self.circuit["LonPitOut"])
                            self.pitout.cap = float(self.circuit["CapPitOut"])
                            self.pitout.draw();
                            self.pitout.lat1 = self.pitout.coord1.lat
                            self.pitout.lon1 = self.pitout.coord1.lon
                            self.pitout.lat2 = self.pitout.coord2.lat
                            self.pitout.lon2 = self.pitout.coord2.lon
                    if self.pitout == False:
                        self.pitin = False # pitin without pitout we remove pitin
                    
                    self.intline = []
                    nbint = 3 # number of intermediate lines
                    i = 0
                    ni = 0 # intermediate line number
                    while i < nbint:
                        ni = ni+1
                        if "Int"+str(ni) in self.circuit:
                            self.intline.append("")
                            self.intline[i] = self.ChronoData()
                            # Int1 is defined in latitude, longitude of the 2 points on either side of the line
                            self.intline[i].lat1 = float(self.circuit["Int"+str(ni)][0])
                            self.intline[i].lon1 = float(self.circuit["Int"+str(ni)][1])
                            self.intline[i].lat2 = float(self.circuit["Int"+str(ni)][2])
                            self.intline[i].lon2 = float(self.circuit["Int"+str(ni)][3])
                        elif "LatInt"+str(ni) in self.circuit:
                            if self.circuit["LatInt"+str(ni)] != "":
                                self.intline.append("")
                                self.intline[i] = self.ChronoData()
                                
                                self.intline[i].lat = float(self.circuit["LatInt"+str(ni)])
                                self.intline[i].lon = float(self.circuit["LonInt"+str(ni)])
                                self.intline[i].cap = float(self.circuit["CapInt"+str(ni)])
                                self.intline[i].draw();
                                self.intline[i].lat1 = self.intline[i].coord1.lat
                                self.intline[i].lon1 = self.intline[i].coord1.lon
                                self.intline[i].lat2 = self.intline[i].coord2.lat
                                self.intline[i].lon2 = self.intline[i].coord2.lon
                        
                        i = i+1
#
# automatic start-finish line acquisition class
class AcqControl(threading.Thread):

    def __init__(self,chrono):
        threading.Thread.__init__(self)
        self.active = False
        self.chrono = chrono
        self.gps = chrono.gps
        self.acqtime = TrackAcqTime
        if self.acqtime == 0:
            self.acqtime = 18000; # If TrackAcqTime = 0 then leave 1 hour (5*60*60) 
        self.timelimit = self.acqtime

        self.coordline = self.chrono.ChronoData()
        self.acqline = dict({"time":"","lat":False,"lon":False,"cap":False,"vit":False,"lat1":False,"lon1":False,"lat2":False,"lon2":False})
        self.acqlines = [] # table of lines to be checked
        self.lat = False;
        self.lon = False;
        self.cap = False;
        self.alt = False;
        self.vit = False;
        self.max = False;
        self.lat1 = False;
        self.lon1 = False;
        self.lat2 = False;
        self.lon2 = False;
        self.seglat1 = False;
        self.seglon1 = False;
        self.seglat2 = False;
        self.seglon2 = False;
        self.cut = False;
        self.sleep = 1; # pause 1 second by default
        self.maxsleep = 10; # maximum pause in seconds between 2 measurements
        self.pulse = 90 # to calculate the break time
        self.dist2points = 120 # distance below which we look if we cut a line
        self.md2m = 15 # minimum distance between 2 measurements
        self.timestamp = 0.
        #self.distmin = TrackWidth*2. # minimum distance to shorten the acquisition phase = 2 times the track width
        logger.info("AcqControl init complete")

    def run(self):
        self.__running = True
        self.__cancel = False
        self.active = True;
        logger.info("AcqControl is running")
        while self.__running:
            if self.lat == False:
                # we populate the first element of the table
                self.getline()
                self.acqlines.append(self.acqline) # the very first row
                self.sleep = 1
                if self.vit > 0:
                    self.sleep = self.pulse/self.vit
                if self.sleep > self.maxsleep:
                    self.sleep = self.maxsleep
                time.sleep(self.sleep)
            else:
                # only processed if the timestamp has changed
                if (self.measurement() == True):
                    self.timestamp = self.gps.gpstime
                    self.acqlines.append(self.acqline) # next row
                    
                    max = len(self.acqlines)
                    i = max - 2 # penultimate point              
                    j = max - 1 # last point
                    self.seglat2 = self.acqlines[j]["lat"]
                    self.seglon2 = self.acqlines[j]["lon"]

                    while i > -1:
                        if j - i > 2: # you need at least 3 points to start the calculation
                            dist = distanceGPS(self.acqlines[i]["lat"], self.acqlines[i]["lon"], self.acqlines[j]["lat"], self.acqlines[j]["lon"])
                            if dist < self.dist2points: # less than 90m (more than 300 km/h) between the 2 points, we look for a break
                                lat1 = self.acqlines[i]["lat1"]
                                lon1 = self.acqlines[i]["lon1"]
                                lat2 = self.acqlines[i]["lat2"]
                                lon2 = self.acqlines[i]["lon2"]
                                self.cut = self.chrono.is_lineCut(lat1,lon1,lat2,lon2,self.seglat1,self.seglon1,self.seglat2,self.seglon2)
                                if self.cut == True:
                                    k = j - 1
                                    self.chrono.getGpsData();
                                    # we cut a line, we will draw the line from the calculated coordinates
                                    # instead of drawing the line, we could indicate that we are ready to draw it
                                    self.chrono.define_start_wcap(self.acqlines[i]["lat"], self.acqlines[i]["lon"], self.acqlines[i]["cap"])
                                    # creation of the self-defined track
                                    self.chrono.create_sfTrack()
                                    
                                    self.chrono.dD = 0 # no need for distance correction
                                    self.chrono.dD = self.chrono.calculDistances(self.chrono.startlat1,self.chrono.startlon1,self.chrono.startlat2,self.chrono.startlon2,self.acqlines[j]["lat"],self.acqlines[j]["lon"])
                                    
                                    self.chrono.begin()
                                    self.chrono.nblap = 1 # we start with the first lap
                                    
                                    self.chrono.chrono_started = True
                                    
                                    dt0 = self.chrono.getTime(self.acqlines[k]["time"])
                                    dt1 = self.chrono.getTime(self.acqlines[j]["time"])
                                    
                                    # calculation of the distance between the previous point and the start-finish line
                                    dDp0 = self.chrono.calculDistances(self.chrono.startlat1,self.chrono.startlon1,self.chrono.startlat2,self.chrono.startlon2,self.acqlines[k]["lat"],self.acqlines[k]["lon"])
                                    # calculation of the distance between the current point and the start-finish line
                                    dDp1 = self.chrono.calculDistances(self.chrono.startlat1,self.chrono.startlon1,self.chrono.startlat2,self.chrono.startlon2,self.acqlines[j]["lat"],self.acqlines[j]["lon"])
                                    
                                    corrtime = dt1 - dt0;
                                    
                                    v0 = self.acqlines[k]["vit"] # speed at the previous point
                                    v1 = self.acqlines[j]["vit"] # speed at current point
                                    vmoy = (v0+v1)/2 # average speed to travel the straight line segment

                                    dc0 = dDp0*(v1/vmoy) # compensated distance before crossing the line
                                    dc1 = dDp1*(v0/vmoy) # compensated distance after crossing the line
                                #
                                    corrtime = corrtime * (dc0/(dc0+dc1));
                                    corrmic = getMicroseconds(corrtime)
                                    
                                    temps = timedelta(microseconds=corrmic)
                                    
                                    #logger.debug("temps compensé:"+str(temps))
                                    #logger.debug("temps départ:"+str(dt0))
                                    dt0mic = getMicroseconds(dt0)
                                    #logger.debug("mic départ:"+str(dt0mic))
                                    #logger.debug("temps +1:"+str(dt1))
                                    dt1mic = getMicroseconds(dt1)
                                    #logger.debug("mic +1:"+str(dt1mic))

                                    self.chrono.chronoStartTime = dt0
                                    
                                    self.chrono.temps_t = temps #
                                    self.chrono.temps_i = temps #
                                    
                                    self.chrono.lat0   = self.acqlines[k]["lat"]
                                    self.chrono.lon0   = self.acqlines[k]["lon"]
                                    self.chrono.time0  = self.acqlines[k]["time"]
                                    self.chrono.speed0 = self.acqlines[k]["vit"]
                                    self.chrono.alt0   = self.acqlines[k]["alt"]
                                    self.chrono.cap0   = self.acqlines[k]["cap"]
                                    #logger.debug("coord k:"+str(k)+" "+str(self.acqlines[k]["lat"])+","+str(self.acqlines[k]["lon"]))
                                    #logger.debug("coord i:"+str(i)+" "+str(self.acqlines[i]["lat"])+","+str(self.acqlines[i]["lon"]))
                                    #logger.debug("coord j:"+str(j)+" "+str(self.acqlines[j]["lat"])+","+str(self.acqlines[j]["lon"]))
                                    
                                    fanalys.writePoint()
                                                                      
                                    i = -1 # to exit the loop
                                    self.stop();
                        i = i - 1
                    if self.cut != True:
                        self.sleep = 1
                        if self.vit > 0:
                            self.sleep = self.pulse/self.vit
                        if self.sleep > self.maxsleep:
                            self.sleep = self.maxsleep
                        #logger.debug("sleep for "+str(self.sleep)+" secondes")
                        time.sleep(self.sleep)
                else:
                    self.sleep = 1
                    #logger.debug("sleep for "+str(self.sleep)+" secondes")
                    time.sleep(self.sleep)
        #logger.info("AcqControl cancel ?"+str(self.__cancel))
        if self.__cancel == True: #the thread, has been aborted
            logger.info("AcqControl aborted")
        if self.__cancel == False: #the thread, has not been aborted
            # we have just crossed the line that has just been defined  !
            self.chrono.lcd.set_display_sysmsg("Line//Defined",lcd.DISPLAY,2)
            #logger.debug("len acqlines after line is defined:"+str(len(self.acqlines)))
        self.active = False;
        logger.info("AcqControl ended")
                
    def getline(self):
        self.acqline = dict({"time":"","lat":False,"lon":False,"cap":False,"vit":False,"lat1":False,"lon1":False,"lat2":False,"lon2":False})
        self.lat = self.gps.latitude
        self.lon = self.gps.longitude
        self.vit = self.gps.gpsvitesse
        self.cap = self.gps.gpscap
        self.alt = self.gps.gpsaltitude
        self.chrono.getLineWithCap(self.lat, self.lon, self.cap)
        lat1 = self.chrono.capline.coords[0]
        lon1 = self.chrono.capline.coords[1]
        lat2 = self.chrono.capline.coords[2]
        lon2 = self.chrono.capline.coords[3]
        #
        self.acqline["time"] = self.gps.gpstime
        self.acqline["lat"]  = self.lat
        self.acqline["lon"]  = self.lon
        self.acqline["cap"]  = self.cap
        self.acqline["alt"]  = self.alt
        self.acqline["vit"]  = self.vit
        self.acqline["lat1"]  = lat1
        self.acqline["lon1"]  = lon1
        self.acqline["lat2"]  = lat2
        self.acqline["lon2"]  = lon2
    
    def stop(self):
        if self.__running != True:
            logger.info("AcqControl already stopped")
            return
        self.__running = False
        self.active = False;
                
    def cancel(self):
        self.__cancel = True
        self.stop()
        
    def measurement(self):
        if self.timestamp == self.gps.gpstime:
            #logger.debug(str(self.timestamp)+"="+str(self.gps.gpstime))
            return False
        self.timestamp = self.gps.gpstime
        #logger.info("len acqlines before:"+str(len(self.acqlines)))
        j = len(self.acqlines) - 1
        self.seglat1 = self.acqlines[j]["lat"]
        self.seglon1 = self.acqlines[j]["lon"]
        self.getline()
        dist = distanceGPS(self.seglat1, self.seglon1, self.acqline["lat"], self.acqline["lon"])
        if dist < self.md2m: # at least 15m between 2 measurements
            #logger.debug("dist between 2 segments:"+str(dist))
            return False
        #logger.debug("dist between 2 segments:"+str(dist))
        return True
#
# predictive time control thread
#       this thread calculates in real time the difference between the previous lap time and the current lap time prediction
class PredictiveControl(threading.Thread):

    def __init__(self,chrono):
        threading.Thread.__init__(self)
        self.active = False
        self.chrono = chrono
        self.gps = chrono.gps
        self.prevtime = False
        # tableau des distances parcourues (timeline)
        self.BT = [] # tableau du meilleur tour
        self.T0 = [] # tableau du tour précédent
        self.T1 = [] # tableau du tour en cours
        self.point = dict()
        self.lap = 0
        self.nblap = 0
        self.npoint = 0
        self.dist = 0
        self.sleep = 0.05
        logger.info("PredictiveControl init complete")
        self.started = False
        self.__running = False

    def run(self):
        self.__running = True
        self.started = True
        self.active = True;
        logger.info("PredictiveControl is running")
        while self.__running:
            if self.chrono.npoint > 0 and self.chrono.npoint != self.npoint: # on est en cours d'acquisition de points pour le tour en cours
                self.npoint = self.chrono.npoint # pour éviter de traiter plusieurs fois le même point
                if self.lap == 0:
                    self.lap = self.chrono.nblap
                if self.prevtime == False:
                    self.prevtime = self.chrono.time0
                    self.prevtime = self.chrono.chronoStartTime
                #logger.info('point:'+str(self.chrono.npoint)+'lap:'+str(self.lap)+'nblap:'+str(self.nblap)+'chrono.nblap:'+str(self.chrono.nblap))
                self.dist += self.chrono.distseg
                if self.nblap == 0: # il n'y a pas de tour précédent, on peuple T0
                    self.point = dict()
                    self.point["point"] = self.npoint
                    self.point["time"] = self.chrono.getTime(self.chrono.time0) - self.chrono.getTime(self.prevtime)
                    self.point["dist"] = self.dist # distance à calculer
                    self.T0.append(self.point) # stockage du point
                    #logger.info(str(len(self.T0)))
                    if self.lap != self.chrono.nblap: # c'est la fin du tour
                        self.nblap = self.lap
                        self.lap = self.chrono.nblap
                        self.prevtime = self.chrono.time0
                        self.dist = 0
                else: # le tour précédent est chargé, on peuple le tour courant
                    self.point = dict()
                    self.point["point"] = self.npoint
                    self.point["time"] = self.chrono.getTime(self.chrono.time0) - self.chrono.getTime(self.prevtime)
                    self.point["dist"] = self.dist # distance à calculer
                    self.T1.append(self.point) # stockage du point
                    #logger.info(str(len(self.T1)))
                    if self.lap != self.chrono.nblap: # c'est la fin du tour
                        logger.info(str(len(self.T0)))
                        logger.info(str(len(self.T1)))
                        #logger.info(str(self.T0))
                        #logger.info(str(self.T1))
                        self.lap = self.chrono.nblap
                        self.nblap = self.lap
                        # maintenant on recommence, T0 vaut T1
                        self.T0 = self.T1
                        self.T1 = []
                        self.prevtime = self.chrono.time0
                        self.dist = 0
                    else: # on essaie de prédire le temps T1 par rapport à T0
                        #logger.info(str(len(self.T0)))
                        #logger.info(str(len(self.T1)))
                        np  = len(self.T1) # nombre de points acquis sur le tour en cours
                        npt = len(self.T0) # nombre de points acquis sur le tour en précédent
                        j = len(self.T1) - 1
                        i = j
                        if i > len(self.T0) - 1:
                            i = len(self.T0) - 1
                        d0 = self.T0[i]["dist"]
                        d1 = self.T1[j]["dist"]
                        #nwt = self.chrono.temps_tour * d0 / d1
                        #nwt = self.chrono.temps_tour * (d0 * np / npt) / (d1 * np / npt)
                        nwt = self.chrono.temps_tour * (d0 * npt / np) / (d1 * npt / np)

                        if nwt < self.chrono.temps_tour:
                            diff = self.chrono.temps_tour - nwt
                            difft = "-"+formatTimeDelta(diff,"sscc")
                        else:
                            diff = nwt - self.chrono.temps_tour
                            difft = "+"+formatTimeDelta(diff,"sscc")
                        
                        self.chrono.predict_time = difft



                        #difft = nwt - self.chrono.temps_tour
                        logger.info(str(self.T0[i]))
                        logger.info(str(self.T1[j]))
                        logger.info('tt:'+str(formatTimeDelta(self.chrono.temps_tour))+'nwt:'+str(formatTimeDelta(nwt))+'d0:'+str(d0)+' d1:'+str(d1)+' t:'+str(difft))
                        #logger.info(str(formatTimeDelta(difft)))
            time.sleep(self.sleep)
        logger.info(str(self.T0))
        logger.info(str(self.T1))
        self.active = False;
        logger.info("PredictiveControl ended")
    
    def stop(self):
        if self.__running != True:
            logger.info("PredictiveControl already stopped")
            return
        self.__running = False
        self.active = False;
            
        
    
def deg2rad(dg):
    return dg/180*pi

def rad2deg(rd):
    return rd*180/pi
    
def distanceGPS(lat1,lon1,lat2,lon2):
    latA = deg2rad(lat1)
    lonA = deg2rad(lon1)
    latB = deg2rad(lat2)
    lonB = deg2rad(lon2)
    MsinlatA = sin(latA)
    MsinlatB = sin(latB)
    McoslatA = cos(latA)
    McoslatB = cos(latB)
    Mabs = abs(lonB-lonA)
    Msin = MsinlatA * MsinlatB
    Mcoslat = McoslatA * McoslatB
    Mcoslon = cos(Mabs)
    Mcos = Mcoslat*Mcoslon
    Acos = Msin + Mcos
    
    if Acos > 1:
        Acos = 1
    D = acos(Acos)
    
    return D*RT
####

def formatGpsDate(gps):
    # receives a gps object and returns a date string from gpsdate
    datestr = str(gps.gpsdate)
    JJ = datestr[0:2]
    MM = datestr[2:4]
    AA = datestr[4:6]
    d = JJ+"/"+MM+'/20'+AA
    return d

def formatGpsTime(gps):
    # receives a gps object and returns a time string from gpstime
    timestr = str(gps.gpstime)
    hh = timestr[0:2]
    mm = timestr[2:4]
    ss = timestr[4:6]
    t = hh+":"+mm+":"+ss
    return t

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

def formatLocalDateTime(gps):
    # receives a gps object and returns a date and time string from localdatetime
    dt = ""
    if gps.localdatetime != "":
        dt = gps.localdatetime.strftime('%d/%m/%y %H:%M')
    return dt

def formatLocalTime(gps):
    # receives a gps object and returns a string hours:minutes:seconds from localdatetime
    lt = ""
    if gps.localdatetime != "":
        lt = gps.localdatetime.strftime('%H:%M:%S')
    return lt
    
def formatTimeDelta(t,format="mmsscc"):
    # receives a timedelta object = returns a time in the form MM:SS.CC (in hundredths of a second)
    retour = ""
    if t == 0:
        retour = "no valid time   "
    else:
        hh = floor(t.seconds / 3600)
        mm = floor(t.seconds / 60) - (hh * 60)
        ss = round(t.seconds - ((hh * 3600) + (mm * 60)))
        if format.find("hh") > -1:
            if hh < 10:
                retour = "0"
            retour += str(int(hh))+":"           
        if format.find("mm") > -1:
            if mm < 10:
                retour = "0"
            retour += str(int(mm))+":"
        if ss < 10:
            retour += "0"
        retour += str(int(ss))
        if format.find("cc") > -1:
            cs = round(t.microseconds/10000)
            retour += "."
            if cs < 10:
                retour += "0"
            retour += str(int(cs))
    
    return retour

def formatVitesse(vitesse):
    retour = ""
    v = int(abs(vitesse))
    if v < 10:
        retour = retour+" "
    if v < 100:
        retour = retour+" "
    retour = retour+str(v)+"km/h "
    return retour
    
def getMicroseconds(timed):
    microseconds = timed.seconds*1000000+timed.microseconds
    return microseconds
    
def get_thermal():
    with open('/sys/class/thermal/thermal_zone0/temp') as t:
        temp = t.read()
    return int(temp) / 1000
    
def get_procfreq():
    with open('/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq') as f:
        procfreq = f.read()
    return int(procfreq) / 1000
    
def get_volts():
    command = 'vcgencmd measure_volts'
    proc_retval = subprocess.check_output(shlex.split(command))
    volts = str(proc_retval.strip().decode())
    return volts

def get_ufs():
    command = 'df -h'
    proc_retval = subprocess.check_output(shlex.split(command))
    ufs = str(proc_retval.strip().decode())
    Tufs = ufs.split('\n')
    T2ufs = Tufs[1].split(' ')
    j = []
    for i in T2ufs:
        if i != "":
            j.append(i)
    return j[4]

def get_ps():
    command = 'ps -ef H'
    proc_retval = subprocess.check_output(shlex.split(command))
    ps = str(proc_retval.strip().decode())
    Tps = ps.split('\n')
    M = []
    for chaine in Tps:
        if "MyChronoGPS" in chaine:
            if ".py" in chaine:
                M.append(chaine)
    return len(M)

def get_module(moduleName):
    command = 'ps -ef '
    #logger.info(command)
    proc_retval = subprocess.check_output(shlex.split(command))
    ps = str(proc_retval.strip().decode())
    Tps = ps.split('\n')
    for chaine in Tps:
        #logger.info(chaine)
        if moduleName in chaine:
            if ".py" in chaine:
                return chaine
    return False
    
def get_ipadr():
    global ipClass
    if ipClass != False:
        return str(ipClass.getip())
    return ""

def get_baudrate(device):
       command = 'stty -F {0}'.format(device)
       try:
           proc_retval = subprocess.check_output(shlex.split(command))
           baudrate = int(proc_retval.split()[1])
           return baudrate
       except:
           return -1

started = False    
logger.info("waiting for button action !")

#
##############################################
#                                            #
#     M A I N   P R O G R A M                #
#                                            #
##############################################
#
if __name__ == "__main__":
    try:
        led1 = False
        menu = False
        gps = False
        lcd = False
        chrono = False
        tracker = False
        fsession = False
        fanalys = False
        flive = False
        ipClass = False
        acq = False # thread to automatically determine a start/finish line (if the track does not exist in the list)
        ils = False # thread to simulate an ILS signal at the magnetic chronometer (if available)
        autoLine = False # automatic start line indicator available

        running = True

        # we start by reading the parameters ...
        parms = Parms(Path)
        # we continue by reading the version
        Version = ""
        fversion = pathcmd+'/VERSION'
        try:
            with open(fversion, 'r') as fversion:
                Version = fversion.read()
                fversion.close()
        except:
            logger.error("error detected in tryring read Version - "+str(sys.exc_info()[0])+" "+str(sys.exc_info()[1]))
            pass
        logger.info("Version:"+str(Version))

        if "PitMaxSpeed" in parms.params:
            PitMaxSpeed = parms.params["PitMaxSpeed"]
        if "TrackWidth" in parms.params:
            TrackWidth = parms.params["TrackWidth"]
        if "GpsChronoMode" in parms.params:
            GpsChronoMode = parms.params["GpsChronoMode"]
        logger.info("GpsChronoMode:"+str(GpsChronoMode))
        if "TrackProximity" in parms.params:
            TrackProximity = parms.params["TrackProximity"]
        if "TrackAcqTime" in parms.params:
            TrackAcqTime = parms.params["TrackAcqTime"]
        TrackPref = 'track-'
        TrackExt = '.json'
        if "TrackExt" in parms.params:
            TrackPref = False
            TrackExt = parms.params["TrackExt"] # par défaut .trk
            
        if "UseStopwatchDisplayByILS" in parms.params:
            UseStopwatchDisplayByILS = parms.params["UseStopwatchDisplayByILS"]
        if "LiveSessionMode" in parms.params:
            LiveSessionMode = parms.params["LiveSessionMode"]
        #logger.info("LiveSessionMode:"+str(LiveSessionMode))
            
        if "HillRaceMode" in parms.params:
            HillRaceMode = parms.params["HillRaceMode"]

        if GpsChronoMode > 0:
            # we will read the tracks
            dirtracks = pathdata+"/tracks"
            dirlist = os.listdir(dirtracks)
            circuits = {}
            i = 0
            for el in dirlist:
                TFD = open(dirtracks+"/"+el, 'r')
                if TrackPref != False:
                    Num = el.split('track-')
                    Num = Num[1].split(TrackExt)
                else:
                    Num = el.split(TrackExt)
                Id = Num[0]
                circuits[Id] = json.loads(TFD.read())
                TFD.close()

        led1 = LedControl(LED1_GPIO_PIN) # LED 1 (yellow) is associated to many processes
        led1.start()

        menu = MenuControl(led1) # led 1 associated with main button
        menu.start()
        last_state = 1
        
        # before starting the screen control, we will look for the CharacterSize parameter
        if "CharacterSize" in parms.params:
            CharacterSize = parms.params["CharacterSize"]
        
        lcd = DisplayControl()
        lcd.start()

        lcd.set_display_time()

        #
        gps = GpsControl(lcd)
        gps.start()
        
        #jfk: peut-être à lancer si paramètre ils = on ?
        if UseStopwatchDisplayByILS != 0:
            ils = IlsControl(ILS_GPIO_PIN, LED2_GPIO_PIN)
            ils.start()
        
        chrono = ChronoControl(gps,lcd,ils,led1,LED3_GPIO_PIN) # LED3 (green) is managed by ChronoControl
        if ils != False:
            chrono.ils.set_chrono(chrono)
        
        #jfk: peut-être à lancer si paramètre live = on ?
        logger.info("LiveSessionMode:"+str(LiveSessionMode))
        if LiveSessionMode != 0:
            flive = LiveSession(chrono)
            flive.start()

        ipClass = IpControl(chrono)
        ipClass.start()        
        
        fsession = SessionControl(chrono)
        
        fanalys = AnalysisControl(chrono)
        
        predict = PredictiveControl(chrono)
        #predict.start() # n'a pas l'air de fonctionner correctement alors, on ne le démarre pas pour l'instant.
        
        #jfk: si on déporte la gestion du Tracker dans le programme principal, çà commencera ici
        # tracker = TrackingControl(chrono)
        # tracker.start()
        
        prev_state = 0
        
        #we will launch the GPS or SIMU program
        # if the program is launched with arguments then sys.argv[1] contains the name of the file containing the NMEA frames to be simulated, we launch the simulator
        # or run the GPS program
        if "GPSCmd" in parms.params:
            cmdgps = parms.params["GPSCmd"]
        if "SimuCmd" in parms.params:
            cmdsimu = parms.params["SimuCmd"]
        
        l = len(sys.argv)
        i = 0
        while i < l:
            i = i + 1
        fnamesimu = ""
        if l >= 2:
            fnamesimu = sys.argv[1]
        if fnamesimu != "": # we run a simulation
            #cmdos = "python "+pathcmd+"/"+cmdsimu+".py "+fnamesimu+" > "+pathlog+"/"+cmdsimu+".log &"
            #cmdos = python_bin+" "+pathcmd+"/"+cmdsimu+".py &"
            module = cmdsimu
            cmdos = python_bin+" "+pathcmd+"/"+cmdsimu+".py "+fnamesimu+" &"
        else:
            module = cmdgps
            #cmdos = "python "+pathcmd+"/"+cmdgps+".py > "+pathlog+"/"+cmdgps+".log &"
            cmdos = python_bin+" "+pathcmd+"/"+cmdgps+".py &"
        print(cmdos)
        isModule = get_module(module)
        logger.info(str(isModule))
        
        if isModule == False:
            try:
                os.system(cmdos)
            except:
                running = False
            time.sleep(5)

        #dbg = 0
        while running:
            #current_state = button1.get_state()
            #current_state = running_state
            current_state = menu.get_state()
            #if dbg > 100:
            #    dbg = 0
            #    print("current_state:"+str(current_state))
            #dbg = dbg+1
            
            if current_state != prev_state:
                prev_state = current_state
            if current_state == POWER_OFF:
                running = False
            if (current_state != last_state):
                last_state = current_state
                if current_state == STOP:
                    led1.set_led_fast_flash(3)
                    #logger.debug('chrono stop')
                    chrono.stop()
                    lcd.set_display_time()
                elif current_state == READY:
                    if chrono.chrono_begin != True:
                        chrono.begin()
                    #logger.info('main current_state:'+str(current_state))
                    #logger.info('menu current_state:'+str(menu.get_state()))
                    #logger.info('main lap:'+str(chrono.nblap))
                    lcd.set_display_ready()
                elif current_state == RUNNING:
                    chrono.start_chrono()
                    lcd.set_display_chrono(chrono)

            if (gps.gpscomplete == True):
                if (gps.gpsfix == gps.VALID):
                    if GpsChronoMode > 0: # automatic or semi-automatic operation
                        chrono.auto_start_line()
                        if GpsChronoMode == 2:  # fully automatic operation
                            if (current_state != RUNNING): # we don't time
                                if current_state == STOP:
                                    if chrono.circuit != False and chrono.circuit != "":
                                        distcir = distanceGPS(gps.latitude, gps.longitude, chrono.startlat1,chrono.startlon1)
                                        if distcir < TrackProximity: # we are near the circuit
                                            # if the GPS point acquisition thread is running, it is stopped to force the use of the nearby circuit
                                            if acq.active != False:
                                                logger.info("we are near a circuit ("+str(distcir)+"m), GPS point acquisition thread is stopped. ")
                                                acq.stop()
                                            if gps.gpsvitesse > int(parms.params["SpeedOmeter"]):
                                                #button1.button_state = READY
                                                #running_state = READY
                                                menu.running_state = READY
                                                chrono.begin()
                                    else: # we will try to automatically determine a start/finish line
                                        if chrono.start_line != False: # the line is determined, the stopwatch is started                                  
                                            #button1.button_state = READY
                                            #running_state = READY
                                            menu.running_state = READY
                                            chrono.begin()
                                        else:
                                            if acq == False:
                                                # if the GPS point acquisition thread is not started, it is started
                                                acq = AcqControl(chrono) # automatic definition of the start-finish line
                                                acq.start()
                                else:
                                    #logger.debug("current_sate:"+str(current_state))
                                    if acq != False:
                                        #logger.debug("acq.active:"+str(acq.active))
                                        # if the GPS point acquisition thread is running, it is stopped
                                        if acq.active != False:
                                            acq.stop()
                                    if gps.gpsvitesse > int(parms.params["SpeedOmeter"]):
                                        if chrono.circuit != False:
                                            #button1.button_state = RUNNING
                                            #running_state = READY
                                            menu.running_state = RUNNING
                    
                    if GpsChronoMode == 0: # manual operation
                        if chrono.start_line != False: # the line is determined, the stopwatch is started                                  
                            if (current_state != RUNNING): # we don't time
                                menu.running_state = RUNNING
                                chrono.start_chrono()

                    if (current_state == RUNNING): # we are timing it
                        chrono.compute()
                        # we check if we have not strayed from the circuit, in which case we go into stop mode
                        if chrono.start_line == True: # the line is well defined
                            distcir = distanceGPS(gps.latitude, gps.longitude, chrono.startlat1,chrono.startlon1)
                            if distcir > TrackProximity: # we moved away from the circuit
                                #button1.button_state = STOP
                                #running_state = STOP
                                menu.running_state = STOP
                                current_state = STOP
                                if chrono.circuit != False:
                                    #logger.info("distance circuit:"+str(distcir)+"/"+str(TrackProximity))
                                    chrono.circuit = False # the circuit object is deleted
                                    chrono.start_line = False # the start line is cleared
                    #
                    chrono.is_sleep() #
                    # if the position has been frozen for more than x gps cycles, the stopwatch is stopped
                    if chrono.nbSleep > int(parms.params["SleepTime"]) :
                       #button1.button_state = STOP
                       #running_state = STOP
                       menu.running_state = STOP
                       chrono.nbSleep = 0
                       current_state = STOP

                    if (current_state == STOP):
                        fsession.stop()
                        fanalys.stop()
            # the frame is read, the buffer is cleared
            gps.clear_buff()
                
            if delayed_msg != "":
                if dTimer == False:
                    dTimer = Timer(3.0, send_delayed)
                    dTimer.start()  # after 3 seconds, the message is sent
                
            time.sleep(0.01)
            if gps.gpsactiv != True:
                running = False
        #
        if predict != False:
            predict.stop()
            if predict.started == True:
                predict.join()
        #
        chrono.terminate() # arrête proprement la classe ChronoControl
        #
        #logger.debug("menu:"+str(menu))
        if menu != False:
            menu.stop()
            menu.join()
        #logger.debug("gps:"+str(gps))
        if gps != False:
            if gps.gpsactiv == True:
                gps.stop()
            gps.join()
        #logger.debug("tracker:"+str(tracker))
        if tracker != False:
            tracker.stop()
            tracker.join()
        #logger.debug("fsession:"+str(fsession))
        if fsession != False:
            fsession.stop()
            #fsession.join()
        #logger.debug("fanalys:"+str(fanalys))
        if fanalys != False:
            fanalys.stop()
            #fanalys.join()
        #logger.debug("flive:"+str(flive))
        if flive != False:
            flive.stop()
            flive.join()
        #logger.debug("led1:"+str(led1))
        if led1 != False:
            led1.stop()
            led1.join()
        #logger.debug("lcd:"+str(lcd))
        if lcd != False:
            lcd.stop()
            logger.info("main lcd stop")
            lcd.join()
        #logger.debug("ipClass:"+str(ipClass))
        if ipClass != False:
            ipClass.stop()
            ipClass.join()
        #logger.debug("acq:"+str(acq))
        if acq != False:
            acq.stop()
            acq.join()
        #logger.debug("ils:"+str(ils))
        if ils != False:
            ils.stop()
            ils.join()
        #logger.debug("END of main program MyChronoGPS")
                
    except KeyboardInterrupt:
        logger.info("User Cancelled (Ctrl C)")
        if menu != False:
            menu.stop()
        if gps != False:
            gps.stop()
        if lcd != False:
            lcd.stop()
        if led1 != False:
            led1.stop()
        if tracker != False:
            tracker.stop()
        if fsession != False:
            fsession.stop()
        if fanalys != False:
            fanalys.stop()
        if flive != False:
            flive.stop()
        if ipClass != False:
            ipClass.stop()
        if acq != False:
            acq.stop()
        if ils != False:
            ils.stop()
        if predict != False:
            predict.stop()
            
    except:
        print(traceback.print_exc())
        print("Unexpected error - ", str(sys.exc_info()))
        if menu != False:
            menu.stop()
        if gps != False:
            gps.stop()
        if lcd != False:
            lcd.stop()
        if led1 != False:
            led1.stop()
        if tracker != False:
            tracker.stop()
        if fsession != False:
            fsession.stop()
        if fanalys != False:
            fanalys.stop()
        if flive != False:
            flive.stop()
        if ipClass != False:
            ipClass.stop()
        if acq != False:
            acq.stop()
        if ils != False:
            ils.stop()
        if predict != False:
            predict.stop()
        raise
        
    finally:
        logger.info("END of main program MyChronoGPS")

#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_BUTTON
#   controls the buttons associated with MyChronoGPS
#   detects actions on buttons and writes in the BUTTON pipe, the button Id and the complete action (PRESS or LONGPRESS)
#
###########################################################################
from MyChronoGPS_Paths import Paths
Path = Paths();

import os
import wiringpi
import time
from datetime import timedelta, datetime, tzinfo

from serial import Serial
import threading
import sys

python_ver = sys.version
python_num = python_ver[0:1]
python_bin = "python"+python_num

from math import *
import json

from MyChronoGPS_Parms import Parms

ButtonNumber = 0

BUTTON1_ID = 1
BUTTON1_GPIO_PIN = 12
BUTTON2_ID = 2
BUTTON2_GPIO_PIN = 22

os.system('gpio export '+str(BUTTON1_GPIO_PIN)+' in')
os.system('gpio export '+str(BUTTON2_GPIO_PIN)+' in')
time.sleep(0.5)

io=wiringpi.GPIO(wiringpi.GPIO.WPI_MODE_GPIO_SYS)

STOP = 0
READY = 1
RUNNING = 2

PRESS = 1
LONGPRESS = 2

LED_OFF = 0
LED_ON = 1
LED_FLASH = 2

FREE = 0
BUSY = 1

ON = 1
OFF = 0

pathdata = Path.pathdata
pathlog = pathdata+'/log'

#######################################################################################
# we will use the logger to replace logger.info
#######################################################################################
import logging
from logging.handlers import TimedRotatingFileHandler
FORMATTER = logging.Formatter("%(asctime)s — %(name)s — %(funcName)s — %(levelname)s — %(lineno)d — %(thread)d — %(message)s")
LOG_FILE = pathlog+"/MyChronoGPS_BUTTON.log"
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
logger.info('MyChronoGPS_BUTTON starting')
logger.info('running in '+python_bin+' version '+python_ver)
#######################################################################################

class ButtonControl(threading.Thread):
    NOTPRESSED = 0
    PRESSED = 1
    pipe_name = os.environ['HOME']+'/MyChronoGPS/pipes/BUTTON'
        
    def __init__(self, button_id, gpio_pin):
        threading.Thread.__init__(self)
        self.gpio_pin = gpio_pin
        self.button_id = button_id
        self.__current_state = self.NOTPRESSED

        self.__running = False
        self.button_state = self.NOTPRESSED
        self.click = OFF # pas de click
        logger.info("ButtonControl %s init complete" % (str(self.button_id)) )
    
    def run(self):
        self.__running = True
        loop = 0
        longpress = 1 / 0.05
        while self.__running:
            if io.digitalRead(self.gpio_pin):
                logger.info("read ok")
                if self.__current_state == self.NOTPRESSED:
                    self.__current_state = self.PRESSED
                    logger.info("press")
                    self.click = OFF # the button is pressed, the click will be triggered when the button is released
                loop += 1
                if loop > longpress:
                    self.button_state = LONGPRESS
                    logger.info("longpress")
            else:
                #logger.info("no read")
                if self.__current_state == self.PRESSED:
                    self.click = ON
                    logger.info("click")
                    self.__current_state = self.NOTPRESSED   
                else:
                    self.button_state = self.NOTPRESSED
                    
            if self.click == ON:
                logger.info("click")
                loop = 0
                self.click = OFF
                self.button_state = PRESS

            if self.button_state == PRESS or self.button_state == LONGPRESS:
                # send the status of the button
                logger.info("send")
                str2write = str(self.button_id)+" %s" % (self.button_state)
                self.write(str2write)
                self.button_state = self.NOTPRESSED

            time.sleep(0.05)
            
    def get_state(self):
        return self.button_state
            
    def reset_state(self):
        self.button_state = self.NOTPRESSED
            
    def write(self,line):
        global running
        try:
            logger.info("try to write "+str(line))
            pipe = os.open(self.pipe_name, os.O_WRONLY, os.O_NONBLOCK)
            if True:
                os.write(pipe, (line+"\r\n").encode())
                os.close(pipe)

                logger.info("write "+str(line))

        except:
            logger.info("cannot use named pipe ",self.pipe_name)
            logger.info("running:",running)
            running = False
            logger.info("running:",running)
            self.__running = False
        
    def stop(self):
        self.button_state = self.NOTPRESSED
        self.__running = False

started = False    
logger.info("waiting for button action !")

if __name__ == "__main__":
    try:
        
        # we start by reading the parameters
        parms = Parms(Path)
        if "ButtonNumber" in parms.params:
            ButtonNumber = parms.params["ButtonNumber"]
        if "GpsChronoMode" in parms.params:
            GpsChronoMode = parms.params["GpsChronoMode"]

        button1 = False
        button2 = False
        
        if ButtonNumber > 0:
            running = True
            button1 = ButtonControl(BUTTON1_ID, BUTTON1_GPIO_PIN) # declaration of button 1
            button1.start()
        if ButtonNumber > 1:
            button2 = ButtonControl(BUTTON2_ID, BUTTON2_GPIO_PIN) # declaration of button 2
            button2.start()
        last_state = 1

        while running:
            #current_state = button1.get_state()
            #if current_state == PRESS or current_state == LONGPRESS:
            #    # send the status of the button
            #    str = "1 %s" % (current_state)
            #    button1.write(str)
            #    button1.reset_state()

            time.sleep(0.05)
        #
        logger.info("Terminator",running)
        if button1 != False:
            button1.stop()
        if button2 != False:
            button2.stop()
                
    except KeyboardInterrupt:
        logger.info("User Cancelled (Ctrl C)")
        if button1 != False:
            button1.stop()
            
    except:
        logger.info("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        if button1 != False:
            button1.stop()
        raise
        
    finally:
        if button1 != False:
            button1.stop()

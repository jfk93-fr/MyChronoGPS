#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_TE2in13V3
#   control of the displays on a Waveshare 2.13inch Touch e-Paper HAT screen 
#   reads the CHRONO file in cache, formats the message and displays it on the screen
#   reads the Touch screen and active some functions
#
###########################################################################
from MyChronoGPS_Paths import Paths
Path = Paths();

cmdgps =  "MyChronoGPS_TE2in13V3"
pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathlog = pathdata+'/log/'

import os
import time
import sys

fontdir = pathdata+'/fonts/'
picdir = os.path.join(os.path.dirname(os.path.realpath(__file__)),'img')
pichome = os.path.join(picdir, 'home.png')
picup   = os.path.join(picdir, 'arrow-up-bold.png')
picret  = os.path.join(picdir, 'arrow-left-bold.png')
picdown = os.path.join(picdir, 'arrow-down-bold.png')

libdir = pathdata+'/lib/'
if os.path.exists(libdir):
    sys.path.append(libdir)
print(str(libdir))
from TP_lib import gt1151
from TP_lib import epd2in13_V3

from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont
import traceback
import threading

import subprocess

RST = 0

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
print("DEBUG:"+str(logging.DEBUG))
print("INFO:"+str(logging.INFO))
print("level"+str(logger.level))
logger.setLevel(logging.INFO)
print("level"+str(logger.level))
logger.info('debut de '+cmdgps)

#######################################################################################
# list of commands
DISPLAY = "D"
DISPLAY_BIG = "H"
DISPLAY_SMALL = "S"
DISPLAY_MENU = "M"
CLEAR = "C"
#BLACK = "B"
CONTRAST = "A"
POWER_OFF = "X"

HOME = "H"
RET = "R"
UP = "U"
DOWN = "D"

flag_t = 1

def pthread_irq() :
    logger.info("pthread running")
    while flag_t == 1 :
        if(gt.digital_read(gt.INT) == 0) :
            GT_Dev.Touch = 1
        else :
            GT_Dev.Touch = 0
        time.sleep(0.002)
    logger.info("thread:exit")

def Read_BMP(File, x, y):
    newimage = Image.open(os.path.join(picdir, File))
    image.paste(newimage, (x, y))

class Screen():

    buff1 = ""
    buff2 = ""
    buff3 = ""
    buff4 = ""
    line1 = ""
    line2 = ""
    line3 = ""
    line4 = ""

    def __init__(self):
        global epd
        self.epd = epd

        
        # Create blank image for drawing.
        # Make sure to create image with mode '1' for 1-bit color.
        self.width = self.epd.width
        self.height = self.epd.height
        print('width='+str(self.width))
        print('height='+str(self.height))
        self.image = Image.new('1', (self.height, self.width), 255)
        
        # Get drawing object to draw on image.
        self.draw = ImageDraw.Draw(self.image)
        
        # clear the image.
        self.draw.rectangle((0,0,self.height,self.width), fill=255)
        
        # Draw some shapes.
        # First define some constants to allow easy resizing of shapes.
        self.padding = 0
        self.top = self.padding
        self.bottom = self.width-self.padding-1
        # Move left to right keeping track of the current x position for drawing shapes.
        self.x = 0
        
        #self.ttf = "arial.ttf"    # Definition font = arial.ttf
        self.ttf = os.path.join(fontdir, 'Font.ttc')    # Definition font = 
        self.fontsize = 36
        self.font = ImageFont.truetype(self.ttf,self.fontsize)    
        self.fontbigsize = 52
        self.fontbig = ImageFont.truetype(self.ttf,self.fontbigsize)    
        self.fontsmallsize = 24
        self.fontsmall = ImageFont.truetype(self.ttf,self.fontsmallsize)

        self.cache = pathdata+'/cache/DISPLAY'
        logger.debug(self.cache)
        self.message = ""
        #
        # variables pour gérer les affichages de menu et autres
        self.stateDisplay = 0
        self.laststate = 0

    def lire_cache(self):
        if os.path.exists(self.cache) == False:
            time.sleep(0.2)
            #return False
            return True
        with open(self.cache, 'r') as cache:
            logger.debug("read cache")
            message = cache.read()
            logger.debug(message)
        logger.debug("["+str(message)+"]/["+str(self.message)+"]")
        if message == self.message:
            time.sleep(0.2)
            return True
        self.message = message # pour éviter de réécrire un message déjà affiché
        commande = message[0:1]
        texte = message[1:]

        if commande == DISPLAY:        
            logger.debug(message)
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
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

            self.draw.text((self.x, self.top), line1,  font=self.font, fill=0)
            self.draw.text((self.x, self.top+62), line2,  font=self.font, fill=0)

            logger.debug("Normal...")

            
        elif commande == DISPLAY_BIG:        
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.height,self.width), fill=255)
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

            self.draw.text((self.x, self.top), line1,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+24), line2,  font=self.fontbig, fill=0)
            self.draw.text((self.x, self.bottom-26), line3,  font=self.fontsmall, fill=0)

            logger.debug("Big...")

        elif commande == DISPLAY_SMALL:        
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
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

            self.draw.text((self.x, self.top), line1,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+30), line2,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+60), line3,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+90), line4,  font=self.fontsmall, fill=0)

            logger.debug("Small...")

        elif commande == DISPLAY_MENU:
            # the character following the command is the number of the line (from 0 to 3) to be highlighted
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.width,self.height), outline=0, fill=0)
            # we will only write the first line on several floors (4 for the moment)
            st1 = ""
            st2 = ""
            st3 = ""
            st4 = ""
            brightline = 0 # to not highlight if there is an error on the line number
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

            bright=[255,255,255,255]
            fill=[0,0,0,0]
            bright=[0,0,0,0]
            fill=[255,255,255,255]
            if brightline > 4:
                brightline = 0
            if brightline > 0:
                brightline = brightline - 1
                bright[brightline] = 0
                fill[brightline] = 1

            self.draw.rectangle((0,0,self.top+16,self.width), outline=0, fill=fill[0])
            self.draw.text((self.top, self.x), line1,  font=self.fontsmall, fill=bright[0])

            self.draw.rectangle((0,self.top+16,self.width,self.top+32), outline=0, fill=fill[1])
            self.draw.text((self.top+16, self.x), line2,  font=self.fontsmall, fill=bright[1])

            self.draw.rectangle((0,self.top+32,self.width,self.top+48), outline=0, fill=fill[2])
            self.draw.text((self.top+32, self.x), line3,  font=self.fontsmall, fill=bright[2])

            self.draw.rectangle((0,self.top+48,self.width,self.top+64), outline=0, fill=fill[3])
            self.draw.text((self.top+48, self.x), line4,  font=self.fontsmall, fill=bright[3])
            
        elif commande == CLEAR: 
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.top, self.x), " ",  font=self.font, fill=0)
            logger.debug("Clear...")
            #self.epd.init()
            #self.epd.Clear(0xFF)
            
        elif commande == POWER_OFF: # a stop to the programm is requested
            self.buff1 = ""
            self.buff2 = ""
            self.buff3 = ""
            self.buff4 = ""
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=0)
            self.draw.text((self.top, self.x), "",  font=self.font, fill=0)
            logger.debug("Goto Sleep...")
            #return False
            
        else:
            logger.debug("commande invalide:"+commande)
            line1 = "invalid command:"+commande
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=0)
            self.draw.text((self.top, self.x), line1,  font=self.font, fill=0)

        # partial update
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()

        time.sleep(0.2)
        return True

    def boucle(self):
        running = True

        self.image = Image.new('1', (self.epd.height, self.epd.width), 255)
        self.draw = ImageDraw.Draw(self.image)
        self.epd.init(self.epd.FULL_UPDATE)
        self.epd.displayPartBaseImage(self.epd.getbuffer(self.image))
        self.epd.init(self.epd.PART_UPDATE)
        
        while running == True:
            #self.epd.init(self.epd.PART_UPDATE)
            #gt.GT_Reset()
            # Read the touch input
            gt.GT_Scan(GT_Dev, GT_Old)
            logger.debug("State "+str(self.stateDisplay)+"/"+str(GT_Dev.X[0])+"/"+str(GT_Old.X[0])+"/"+str(GT_Dev.Y[0])+"/"+str(GT_Old.Y[0])+"/"+str(GT_Dev.S[0])+"/"+str(GT_Old.S[0]))
            #if(self.stateDisplay == 0 and GT_Old.X[0] == GT_Dev.X[0] and GT_Old.Y[0] == GT_Dev.Y[0] and GT_Old.S[0] == GT_Dev.S[0]):
            if(self.stateDisplay == 0 and self.touch() == False):
                logger.debug("lire cache")
                running = self.lire_cache()
            else:
                logger.debug("dialog")
                self.dialog()
                logger.debug("running loop:"+str(running)+" State "+str(self.stateDisplay))
        logger.debug("end of loop")

    def touch(self):
        #self.epd.ReadBusy()
        #if GT_Dev.Touch == 0:
        #    return False
        if GT_Dev.TouchCount == 0:
            return False
        if GT_Dev.X[0] == 0 and GT_Dev.Y[0] == 0 and GT_Dev.S[0] == 0:
            return False
        dev = GT_Dev.X[0] + (GT_Dev.Y[0] * 256) + (GT_Dev.S[0] * 256 * 256)
        old = GT_Old.X[0] + (GT_Old.Y[0] * 256) + (GT_Old.S[0] * 256 * 256)
        if dev == old:
            return False

        self.draw.rectangle((self.height-8,0,self.height,8), outline=0, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        return True

    def dialog(self):
        running = True
        ct = 0
        while running == True:
            if self.stateDisplay > 0:
                if self.stateDisplay == self.laststate:
                    if ct > 60: # 300 cycles de 0.1" = 30 secondes
                        # au bout d'un certain temps d'inactivité, on sort du dialogue
                        self.stateDisplay = 0
                        running = False
                        ct = 0
                    logger.debug("ct:"+str(ct))
                    ct += 1
                else:
                    ct = 0
                    self.laststate = self.stateDisplay
            logger.debug("GT_Dev.Touch: "+str(GT_Dev.Touch))
            #if(GT_Dev.Touch):
            #if self.touch() == True:
            #    running = self.performState()
            if running == True:
                running = self.performState()
            
            logger.debug(str(running))
            #time.sleep(0.5)
            time.sleep(0.1)
            # Read the touch input
            gt.GT_Scan(GT_Dev, GT_Old)
            #if(GT_Old.X[0] == GT_Dev.X[0] and GT_Old.Y[0] == GT_Dev.Y[0] and GT_Old.S[0] == GT_Dev.S[0]):
            #    continue
            

        self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
        line = "end of dialog"
        self.draw.text((self.x, self.top), line,  font=self.font, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))

        self.epd.ReadBusy()
        self.message = ""
        logger.debug('end of dialog')

    def performState(self):
        running = True
        logger.debug("state:"+str(self.stateDisplay))
        if self.stateDisplay == 0: # on vient du chronomètre
            if self.touch() == True:
                self.displayMenuG()
            #self.displayMenuG()
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
        elif self.stateDisplay == 1: # on vient du menu principal
            if self.touch() == True:
                running = self.performMenuG()
            #running = self.performMenuG()
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
        elif self.stateDisplay == 2:
            #if self.touch() == True:
            #    self.displayCmds()
            self.displayCmds()
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
            #self.stateDisplay = 0
            #running = False    
        elif self.stateDisplay == 21: # on vient du menu commandes
            if self.touch() == True:
                running = self.performCmds()
                #self.stateDisplay = 0
                #running = False
            #running = self.performMenuG()
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
        elif self.stateDisplay == 210: # on vient du choix arrêt rpi
            self.displayChoice()
            self.stateDisplay = 2100
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
        elif self.stateDisplay == 2100: # on vient de la confirmation du choix
            if self.touch() == True:
                running = self.performChoice()
                #self.stateDisplay = 0
                #running = False
            #running = self.performMenuG()
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
        elif self.stateDisplay == 211: # on vient du choix redémarrage rpi
            self.displayChoice()
            self.stateDisplay = 2110
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
        elif self.stateDisplay == 2110: # on vient de la confirmation du choix
            if self.touch() == True:
                running = self.performChoice()
                #self.stateDisplay = 0
                #running = False
            #running = self.performMenuG()
            logger.debug("running:"+str(running))
            logger.debug("state:"+str(self.stateDisplay))
        
        else:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), str(self.stateDisplay)+" inconnu",  font=self.font, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            logger.debug("Etat inconnu")
            self.stateDisplay = 0
            running = False
        #GT_Dev.TouchpointFlag = 0
        #GT_Dev.Touch = 0
        logger.debug("running:"+str(running))
        return running
        
    def get_touch(self):
        zone = 0
        x = 250 - GT_Dev.Y[0]
        y = GT_Dev.X[0]
        # zone du choix à confirmer
        if self.stateDisplay == 2100 or self.stateDisplay == 2110:
            # Menu confirmation affiché
            # zone rectangles du menu
            if y > 41 and x < 126:
                zone = 1
            elif y > 41 and x > 125:
                zone = 2
        # zone icônes du menu principal
        elif x < 41 and y < 61:
            zone = RET
        #elif x < 31 and y > 30 and y < 62:
        elif x < 41 and y > 60:
            zone = HOME
        elif x > 209 and y < 61:
            zone = UP
        elif x > 209 and y > 60:
            zone = DOWN
        elif self.stateDisplay == 1:
            # Menu principal affiché
            # zone rectangles du menu principal
            if x > 40 and x < 120 and y < 61:
                zone = 1
            elif x > 119 and y < 61 :
                zone = 2
            elif x > 40 and x < 120 and y > 60:
                zone = 3
            elif x > 119 and x < 210 and y > 60 :
                zone = 4
        elif self.stateDisplay == 21:
            # Menu commandes affiché
            # zone rectangles du menu
            if x > 40 and x < 210 and y < 61:
                zone = 1
            elif x > 40 and x < 210 and y > 60:
                zone = 2
        return zone
    
    def displayMenuG(self):
        # affichage du menu 1
        logger.debug("Arrêt ? "+str(GT_Dev.X[0])+"/"+str(GT_Old.X[0])+"/"+str(GT_Dev.Y[0])+"/"+str(GT_Old.Y[0])+"/"+str(GT_Dev.S[0])+"/"+str(GT_Old.S[0]))
        logger.debug("Flag T TF TC "+str(GT_Dev.Touch)+"/"+str(GT_Dev.TouchpointFlag)+"/"+str(GT_Dev.TouchCount))
        self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
        
        self.displayIcons()

        self.draw.rectangle((40,0,119,60), outline=0, fill=255)
        self.draw.rectangle((120,0,209,60), outline=0, fill=255)
        self.draw.rectangle((40,61,119,121), outline=0, fill=255)
        self.draw.rectangle((120,61,210,121), outline=0, fill=255)
        l1c1 = [16,46,"CMDs"]
        l1c2 = [16,125,"GPS"]
        l2c1 = [81,46,"Status"]
        l2c2 = [81,125,"Datas"]

        font = ImageFont.truetype(self.ttf,20)

        self.draw.text((l1c1[1], l1c1[0]), l1c1[2],  font=font, fill=0)
        self.draw.text((l1c2[1], l1c2[0]), l1c2[2],  font=font, fill=0)
        self.draw.text((l2c1[1], l2c1[0]), l2c1[2],  font=font, fill=0)
        self.draw.text((l2c2[1], l2c2[0]), l2c2[2],  font=font, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
    
    def performMenuG(self):
        running = True
        zone = self.get_touch()
        
        if logger.level == logging.DEBUG:
            logger.debug("Sortir d'Arrêt "+str(GT_Dev.X[0])+"/"+str(GT_Old.X[0])+"/"+str(GT_Dev.Y[0])+"/"+str(GT_Old.Y[0])+"/"+str(GT_Dev.S[0])+"/"+str(GT_Old.S[0]))
            logger.debug("Flag T TF TC "+str(GT_Dev.Touch)+"/"+str(GT_Dev.TouchpointFlag)+"/"+str(GT_Dev.TouchCount))
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            line = "Sortie Zone "+str(zone)
            self.draw.text((self.x, self.top), line,  font=self.fontsmall, fill=0)
            line = "X="+str(GT_Dev.X[0])+",Y="+str(GT_Dev.Y[0])+",S="+str(GT_Dev.S[0])
            self.draw.text((self.x, self.top+30), line,  font=self.fontsmall, fill=0)
            line = "X="+str(GT_Old.X[0])+",Y="+str(GT_Old.Y[0])+",S="+str(GT_Old.S[0])
            self.draw.text((self.x, self.top+60), line,  font=self.fontsmall, fill=0)
    
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            time.sleep(3)
        
        # test de la position pour savoir si on arrête vraiment ou si on sort d'arrêt
        if zone == HOME or zone == RET:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Home",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 0
            running = False
        elif zone == 1:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "CMDs",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 2
            #running = False
        elif zone == 2:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "GPS",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 3
            #running = False
        elif zone == 3:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Status",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 4
            #running = False
        elif zone == 4:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Datas",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 5
            #running = False
        else:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Zone non traitée",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)
            #self.stateDisplay = 0
            #running = False
        return running

    def displayIcons(self):
        # read png file on window
        logger.debug("3.read png file on window...")
        # epd.Clear(0xFF)
        img = Image.open(picret)
        img = img.resize((40, 40),Image.NEAREST)
        self.image.paste(img, (0,10))    
        img = Image.open(pichome)
        img = img.resize((40, 40),Image.NEAREST)
        self.image.paste(img, (0,80))    
        img = Image.open(picup)
        img = img.resize((40, 40),Image.NEAREST)
        self.image.paste(img, (210,10))    
        img = Image.open(picdown)
        img = img.resize((40, 40),Image.NEAREST)
        self.image.paste(img, (210,80))    
    
    def displayCmds(self):
        # affichage du menu commande
        logger.debug("Arrêt ? "+str(GT_Dev.X[0])+"/"+str(GT_Old.X[0])+"/"+str(GT_Dev.Y[0])+"/"+str(GT_Old.Y[0])+"/"+str(GT_Dev.S[0])+"/"+str(GT_Old.S[0]))
        logger.debug("Flag T TF TC "+str(GT_Dev.Touch)+"/"+str(GT_Dev.TouchpointFlag)+"/"+str(GT_Dev.TouchCount))
        self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
        
        self.displayIcons()

        self.draw.rectangle((40,0,209,60), outline=0, fill=255)
        self.draw.rectangle((40,61,209,121), outline=0, fill=255)
        l1c1 = [16,46,"Arrêt RPi"]
        l2c1 = [81,46,"Rdémarrage RPi"]

        font = ImageFont.truetype(self.ttf,20)

        self.draw.text((l1c1[1], l1c1[0]), l1c1[2],  font=font, fill=0)
        self.draw.text((l2c1[1], l2c1[0]), l2c1[2],  font=font, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 21
    
    def performCmds(self):
        running = True
        zone = self.get_touch()
        logger.debug("performCmds:"+str(zone))
        
        if logger.level == logging.DEBUG:
            logger.debug("Sortir d'Arrêt "+str(GT_Dev.X[0])+"/"+str(GT_Old.X[0])+"/"+str(GT_Dev.Y[0])+"/"+str(GT_Old.Y[0])+"/"+str(GT_Dev.S[0])+"/"+str(GT_Old.S[0]))
            logger.debug("Flag T TF TC "+str(GT_Dev.Touch)+"/"+str(GT_Dev.TouchpointFlag)+"/"+str(GT_Dev.TouchCount))
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            line = "Sortie Zone "+str(zone)
            self.draw.text((self.x, self.top), line,  font=self.fontsmall, fill=0)
            line = "X="+str(GT_Dev.X[0])+",Y="+str(GT_Dev.Y[0])+",S="+str(GT_Dev.S[0])
            self.draw.text((self.x, self.top+30), line,  font=self.fontsmall, fill=0)
            line = "X="+str(GT_Old.X[0])+",Y="+str(GT_Old.Y[0])+",S="+str(GT_Old.S[0])
            self.draw.text((self.x, self.top+60), line,  font=self.fontsmall, fill=0)
    
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            time.sleep(3)
        
        # test de la position pour savoir si on arrête vraiment ou si on sort d'arrêt
        if zone == HOME:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Home",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 0
            running = False
        elif zone == RET:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Ret",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            logger.debug("displayMenuG")
            self.displayMenuG()
            #time.sleep(3)

            #self.stateDisplay = 2
        elif zone == 1:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Arrêt RPi",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 210
            #running = False
        elif zone == 2:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Redémarrage RPi",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 211
            #running = False
        else:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Zone non traitée",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)
            self.stateDisplay = 2
            #running = False
        return running
    
    def displayChoice(self):
        # affichage d'une demande de confirmation
        logger.debug("Arrêt ? "+str(GT_Dev.X[0])+"/"+str(GT_Old.X[0])+"/"+str(GT_Dev.Y[0])+"/"+str(GT_Old.Y[0])+"/"+str(GT_Dev.S[0])+"/"+str(GT_Old.S[0]))
        logger.debug("Flag T TF TC "+str(GT_Dev.Touch)+"/"+str(GT_Dev.TouchpointFlag)+"/"+str(GT_Dev.TouchCount))
        self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
        
        #self.displayIcons()
        font = ImageFont.truetype(self.ttf,16)
        lib = "Vous avez demandé "
        if self.stateDisplay == 210:
            lib += "Arrêt RPi"
        elif self.stateDisplay == 211:
            lib += "Redémarrage RPi"
        lib += ", voulez-vous continuer ?"

        #self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
        self.draw.rectangle((0,0,self.height,20), outline=0, fill=255)
        self.draw.text((0,0), lib,  font=font, fill=0)

        l1c1 = [40,6,"OUI"]
        l2c1 = [40,131,"NON"]

        self.draw.text((l1c1[1], l1c1[0]), l1c1[2],  font=font, fill=0)
        self.draw.text((l2c1[1], l2c1[0]), l2c1[2],  font=font, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
    
    def performChoice(self):
        running = True
        zone = self.get_touch()
        logger.debug("performChoice:"+str(zone))
        
        if logger.level == logging.DEBUG:
            logger.debug("Sortir d'Arrêt "+str(GT_Dev.X[0])+"/"+str(GT_Old.X[0])+"/"+str(GT_Dev.Y[0])+"/"+str(GT_Old.Y[0])+"/"+str(GT_Dev.S[0])+"/"+str(GT_Old.S[0]))
            logger.debug("Flag T TF TC "+str(GT_Dev.Touch)+"/"+str(GT_Dev.TouchpointFlag)+"/"+str(GT_Dev.TouchCount))
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            line = "Sortie Zone "+str(zone)
            self.draw.text((self.x, self.top), line,  font=self.fontsmall, fill=0)
            line = "X="+str(GT_Dev.X[0])+",Y="+str(GT_Dev.Y[0])+",S="+str(GT_Dev.S[0])
            self.draw.text((self.x, self.top+30), line,  font=self.fontsmall, fill=0)
            line = "X="+str(GT_Old.X[0])+",Y="+str(GT_Old.Y[0])+",S="+str(GT_Old.S[0])
            self.draw.text((self.x, self.top+60), line,  font=self.fontsmall, fill=0)
    
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            time.sleep(3)
        
        font = ImageFont.truetype(self.ttf,16)

        lib1 = "Arrêt RPi en cours"
        if self.stateDisplay == 2110:
            lib1 = "Redémarrage RPi en cours"
        # test de la position
        if zone == 1:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), lib1,  font=font, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            time.sleep(3)
            self.okChoice()

            #self.stateDisplay = 0
            #running = False
        elif zone == 2:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Abandon",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)

            self.stateDisplay = 0
            running = False
        else:
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
            self.draw.text((self.x, self.top), "Zone non traitée",  font=self.fontsmall, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            #time.sleep(3)
            self.stateDisplay = 0
            #running = False
        return running
        
    def okChoice(self):
        self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        if self.stateDisplay == 2100: # arrêt RPi demandé
            try:
                os.system("sudo shutdown -h now")
            except OSError as err:
                self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
                lib = ("OS error: {0}".format(err))
                self.draw.text((self.x, self.top), lib,  font=self.fontsmall, fill=0)
                self.epd.displayPartial(self.epd.getbuffer(self.image))
                self.epd.ReadBusy()
            except:
                lib = ("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
                self.draw.text((self.x, self.top), lib,  font=self.fontsmall, fill=0)
                self.epd.displayPartial(self.epd.getbuffer(self.image))
                self.epd.ReadBusy()
                raise
        
        if self.stateDisplay == 2110: # redémarrage RPi demandé
            try:
                os.system("sudo reboot")
            except OSError as err:
                self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=255)
                lib = ("OS error: {0}".format(err))
                self.draw.text((self.x, self.top), lib,  font=self.fontsmall, fill=0)
                self.epd.displayPartial(self.epd.getbuffer(self.image))
                self.epd.ReadBusy()
            except:
                lib = ("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
                self.draw.text((self.x, self.top), lib,  font=self.fontsmall, fill=0)
                self.epd.displayPartial(self.epd.getbuffer(self.image))
                self.epd.ReadBusy()
                raise
        
        #self.stateDisplay = 0
        #running = False
        #if self.stateDisplay = 2100:

if __name__ == '__main__':
    try:
        logger.info("MyChronoGPS_TE2in13V3")
        
        epd = epd2in13_V3.EPD()
        gt = gt1151.GT1151()
        GT_Dev = gt1151.GT_Development()
        GT_Old = gt1151.GT_Development()
        
        logger.info("init and Clear")
        
        epd.init(epd.FULL_UPDATE)
        gt.GT_Init()
        epd.Clear(0xFF)
        
        #logger.info("wait 15 sec")
        #time.sleep(15)
        #logger.info("end wait")
    
        t = threading.Thread(target = pthread_irq)
        t.setDaemon(True)
        t.start()
    
        # Drawing on the image
        font15 = ImageFont.truetype(os.path.join(fontdir, 'Font.ttc'), 15)
        font24 = ImageFont.truetype(os.path.join(fontdir, 'Font.ttc'), 24)
        font36 = ImageFont.truetype(os.path.join(fontdir, 'Font.ttc'), 36)
        
        Screen().boucle()
        
        epd.init(epd.FULL_UPDATE)
        #gt.GT_Init()   
        epd.Clear(0xFF)
        #epd.Clear(0x00)
        flag_t = 0
        #epd.sleep()
        time.sleep(2)
        t.join()
        epd.Dev_exit()
                
    except KeyboardInterrupt:
        print("User Cancelled (Ctrl C)")
            
    except:
        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        raise
        
    finally:
        print("END")

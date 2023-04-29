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

#picdir = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'pic/2in13')
#fontdir = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'pic')
#libdir = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'lib')
fontdir = pathdata+'/fonts/'
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
CONTRAST = "A"
POWER_OFF = "X"

flag_t = 1

def pthread_irq() :
    print("pthread running")
    while flag_t == 1 :
        if(gt.digital_read(gt.INT) == 0) :
            GT_Dev.Touch = 1
        else :
            GT_Dev.Touch = 0
    print("thread:exit")

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
        #self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=0)
        #self.draw.rectangle((0,0,self.height,self.width), fill=0)
        self.draw.rectangle((0,0,self.height,self.width), fill=255)
        #self.draw.rectangle((0, 0, 250, 40), fill = 0)
        
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

        #self.font = font24
        #self.fontbig = font36
        #self.fontsmall = font15

        self.cache = pathdata+'/cache/DISPLAY'
        print(self.cache)

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
        
        #self.epd.init(self.epd.PART_UPDATE)
        #self.epd.displayPartial(self.epd.getbuffer(self.image))

        #self.image = Image.new('1', (self.epd.height, self.epd.width), 255)
        #self.draw = ImageDraw.Draw(self.image)
        #self.epd.displayPartBaseImage(self.epd.getbuffer(self.image))

        if commande == DISPLAY:        
            logger.debug(message)
            # Draw a black filled box to clear the image.
            #self.draw.rectangle((0,0,self.width,self.height), outline=0, fill=0)
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
            logger.debug(line1)
            logger.debug(line2)

            #self.draw.text((self.x, self.top), line1,  font=self.font, fill=255)
            #self.draw.text((self.x, self.top+32), line2,  font=self.font, fill=255)
            #print("line1="+str(line1)+",x="+str(self.x)+",y="+str(self.top))
            self.draw.text((self.x, self.top), line1,  font=self.font, fill=0)
            #print("line2="+str(line2)+",x="+str(self.x)+",y="+str(self.top+62))
            self.draw.text((self.x, self.top+62), line2,  font=self.font, fill=0)

            
        elif commande == DISPLAY_BIG:        
            logger.debug('BIG'+message)
            # Draw a black filled box to clear the image.
            #self.draw.rectangle((0,0,self.width,self.height), outline=0, fill=0)
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
            logger.debug(line1)
            logger.debug(line2)
            logger.debug(line3)

            #self.draw.text((self.x, self.top), line1,  font=self.fontsmall, fill=255)
            #self.draw.text((self.x, self.top+16), line2,  font=self.fontbig, fill=255)
            #self.draw.text((self.x, self.top+50), line3,  font=self.fontsmall, fill=255)

            self.draw.text((self.x, self.top), line1,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+24), line2,  font=self.fontbig, fill=0)
            self.draw.text((self.x, self.bottom-26), line3,  font=self.fontsmall, fill=0)

        elif commande == DISPLAY_SMALL:        
            # Draw a black filled box to clear the image.
            #self.draw.rectangle((0,0,self.width,self.height), outline=0, fill=0)
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

            #self.draw = ImageOps.invert(self.draw)
            #self.draw.text((self.x, self.top), line1,  font=self.fontsmall, fill=255)
            #self.draw.text((self.x, self.top+16), line2,  font=self.fontsmall, fill=255)
            #self.draw.text((self.x, self.top+32), line3,  font=self.fontsmall, fill=255)
            #self.draw.text((self.x, self.top+48), line4,  font=self.fontsmall, fill=255)
            self.draw.text((self.x, self.top), line1,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+30), line2,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+60), line3,  font=self.fontsmall, fill=0)
            self.draw.text((self.x, self.top+90), line4,  font=self.fontsmall, fill=0)

        elif commande == DISPLAY_MENU:
            # le caractère qui suit la commande correspond au numéro de la ligne (de 0 à 3) à écrire en surbrillance
            # Draw a black filled box to clear the image.
            self.draw.rectangle((0,0,self.width,self.height), outline=0, fill=0)
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

            #self.draw = ImageOps.invert(self.draw)
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
            
        elif commande == CLEAR: # effacement de l'écran
            logging.info("Clear...")
            #self.epd.init()
            #self.epd.Clear(0xFF)
            
        elif commande == POWER_OFF: # arrêt du programme demandé
            #self.disp.clear()
            self.buff1 = ""
            self.buff2 = ""
            self.buff3 = ""
            self.buff4 = ""
            logging.info("Clear...")
            self.epd.init()
            self.epd.Clear(0xFF)
            logging.info("Goto Sleep...")
            self.epd.sleep()
            #self.disp.display()
            return False
            
        else:
            #print("commande invalide:",commande)
            logger.info("commande invalide:"+commande)
            line1 = "invalid command:"+commande
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=0)
            self.draw.text((self.top, self.x), line1,  font=self.font, fill=255)

        # Display image.
        # on va enregistrer l'image dans un fichier
        self.image.save("essai.bmp", "BMP")
        #img5 = self.image.transpose(Image.ROTATE_90)        
        #img5.save("essai90.bmp", "BMP")
        #img6 = self.image.transpose(Image.ROTATE_180)        
        #img6.save("essai180.bmp", "BMP")
        

        # partial update
        #self.epd.displayPartBaseImage(self.epd.getbuffer(self.image))
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        
        #self.epd.init(self.epd.PART_UPDATE)
        #self.epd.displayPartial(self.epd.getbuffer(self.image))
        
        #self.epd.Clear(0xFF)
        #self.epd.display(self.epd.getbuffer(self.image.rotate(180,expand=True)))
        #self.epd.display(self.epd.getbuffer(self.image))
        #self.epd.sleep()
        

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
            running = self.lire_cache()

if __name__ == '__main__':
    try:
        logging.info("epd2in13_V3 Touch Demo")
        
        epd = epd2in13_V3.EPD()
        gt = gt1151.GT1151()
        GT_Dev = gt1151.GT_Development()
        GT_Old = gt1151.GT_Development()
        
        logging.info("init and Clear")
        
        epd.init(epd.FULL_UPDATE)
        gt.GT_Init()
        epd.Clear(0xFF)
    
        t = threading.Thread(target = pthread_irq)
        t.setDaemon(True)
        t.start()
    
        # Drawing on the image
        font15 = ImageFont.truetype(os.path.join(fontdir, 'Font.ttc'), 15)
        font24 = ImageFont.truetype(os.path.join(fontdir, 'Font.ttc'), 24)
        font36 = ImageFont.truetype(os.path.join(fontdir, 'Font.ttc'), 36)
        
        Screen().boucle()
                
    except KeyboardInterrupt:
        print("User Cancelled (Ctrl C)")
            
    except:
        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        raise
        
    finally:
        print("END")

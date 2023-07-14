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

from MyChronoGPS_Parms import Parms

import os
import glob
import time
import sys
import json
import subprocess
import shlex

import time
from datetime import timedelta, datetime, tzinfo
from math import *

main_module =  "MyChronoGPS"
cmdgps =  "MyChronoGPS_TE2in13V3"
pathcmd = Path.pathcmd
pathdata = Path.pathdata
pathlog = pathdata+'/log'

python_ver = sys.version
python_num = python_ver[0:1]
python_bin = "/usr/bin/python"+python_num
pipe_name = Path.pathdata+'/pipes/BUTTON'
cmd_stop = "12"

cmd_start = "sudo sh "+pathcmd+"/start_gps.sh > "+pathlog+"/"+"start_gps.log 2>&1"


fontdir = pathdata+'/fonts/'
picdir = os.path.join(os.path.dirname(os.path.realpath(__file__)),'img')
picend  = os.path.join(picdir, 'location-exit.png')
pichome = os.path.join(picdir, 'home.png')
picup   = os.path.join(picdir, 'arrow-up-bold.png')
picnext = os.path.join(picdir, 'arrow-right-bold.png')
picret  = os.path.join(picdir, 'arrow-left-bold.png')
picdown = os.path.join(picdir, 'arrow-down-bold.png')

libdir = pathdata+'/lib/'
if os.path.exists(libdir):
    sys.path.append(libdir)
#print(str(libdir))
from TP_lib import gt1151
from TP_lib import epd2in13_V3

from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont
import traceback
import threading

import subprocess

autotrack = Path.pathdata+"/tracks/Autotrack.trk"

from operator import itemgetter, attrgetter
dirsess = Path.pathdata+"/sessions"

RST = 0

#######################################################################################
# we will use the logger to replace print
#######################################################################################
import logging
from logging.handlers import TimedRotatingFileHandler
FORMATTER = logging.Formatter("%(asctime)s — %(name)s — %(funcName)s — %(levelname)s — %(lineno)d — %(thread)d — %(message)s")
LOG_FILE = pathlog+"/"+cmdgps+".log"
#print(LOG_FILE)

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
#print("DEBUG:"+str(logging.DEBUG))
#print("INFO:"+str(logging.INFO))
#print("level"+str(logger.level))

logger.setLevel(logging.INFO)

#print("level"+str(logger.level))
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

def get_module(moduleName):
    command = 'ps -ef '
    logger.debug(command)
    proc_retval = subprocess.check_output(shlex.split(command))
    ps = str(proc_retval.strip().decode())
    Tps = ps.split('\n')
    for chaine in Tps:
        fnd = chaine.find(str(moduleName+".py"))
        if fnd > -1:
            return chaine
    return False

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
        global parms
        self.epd = epd
        
        # Create blank image for drawing.
        # Make sure to create image with mode '1' for 1-bit color.
        self.width = self.epd.width
        self.height = self.epd.height

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
        # variables pour gérer les affichages de maps et autres
        self.stateDisplay = 0
        self.laststate = 0
        
        # variables pour gérer les différentes maps
        self.tMaps = []
        self.pileW = []

        self.mapL = 0 # ligne courante de l'affichage (numéro de fenêtre)
        self.item = 0 # ligne de fenêtre

        self.createMaps()
        
        self.ztouch = [] # zone touchée
        
        self.session = False


#######################################################################
# fonctions de gestion des maps    
#######################################################################
    def addMap(self,id,window=[0,0,254,121],hwin=122,header=False):
        #self.level += 1
        if self.searchMap(id) != False: #est-ce que la map existe déjà ?
            logger.info("la map "+str(id)+" existe déjà")
            return False
        logger.debug("création map:"+str(id))
        dict = {}
        dict["id"] = id
        dict["level"] = len(self.tMaps)
        dict["witem"] = [] # élément fenêtre
        dict["hwin"] = hwin # hauteur fenêtre
        dict["window"] = window # rect = [x0,y0,x1,y1] "[[coin supérieur gauche[x0,y0], [coin inférieur droit[x1,y1]]"
        dict["header"] = header # si True: la 1ère fenêtre est toujours affichées.
        dict["nav"] = [] # éléments de navigation
        self.tMaps.append(dict)
        logger.debug(str(self.tMaps))
        self.mapLevel = len(self.tMaps)-1
        self.mapL = 0
        return len(self.tMaps)
        
    def searchMap(self,id):
        logger.debug("recherche map:"+str(id))
        i = 0
        while i < len(self.tMaps):
            map = self.tMaps[i]
            logger.debug(str(i)+":"+str(map))
            if "id" in map:
                if map["id"] == id:
                    logger.debug("map trouvée:"+str(map["id"])+", level:"+str(i))
                    return map
            i += 1
        return False
        
    def addWindow(self,id,func=False,pid=0,xtra=False):
        dict = {}
        dict["id"] = id
        dict["line"] = len(self.tMaps[self.mapLevel]["witem"])
        dict["item"] = []
        dict["func"] = func
        dict["xtra"] = xtra #paramètres à passer à la fonction
        dict["parent"] = pid
        self.tMaps[self.mapLevel]["witem"].append(dict)
        logger.debug(str(self.tMaps))
        return
        
    def addItem(self,txt=False,img=False,rect=False,vars=False):
        dict = {}
        dict["txt"] = txt # position du texte, texte & taille police = [x,y,"lib",tp]  
        dict["img"] = img # position de l'image & chemin accès image = [x,y,"img"]
        dict["rect"] = rect # rect = [x0,y0,x1,y1]] "[[coin supérieur gauche[x0,y0], [coin inférieur droit[x1,y1]]" 
        dict["vars"] = vars # vars = [v0,v1,...,vn]] "[variables de remplacement des ?"

        if dict["txt"] != False:
            tp = 24
            if len(dict["txt"]) == 4:
                tp = dict["txt"][3] # taille police = dernier élément du tableau
            font = ImageFont.truetype(self.ttf,tp)
            lib  = dict["txt"][2]
            dict["lngt"] = font.getlength(lib)
        
        self.tMaps[self.mapLevel]["witem"][self.mapL]["item"].append(dict)
        logger.debug(str(self.tMaps))

    def addNav(self,x,y,img,l,func=False):
        dict = {}
        dict["x"] = x
        dict["y"] = y
        dict["img"] = img
        dict["lib"] = l
        dict["func"] = func
        self.tMaps[self.mapLevel]["nav"].append(dict)
        
#######################################################################
    def display(self,Level):
        logger.debug("Level:"+str(Level))

        self.draw.rectangle((0,0,self.height,self.width), fill=255)

        logger.debug("map Level "+str(self.tMaps[Level]))
        
        # Affichage des fenêtres
        i = self.mapL
        maxi = len(self.tMaps[Level]["witem"]) - 1

        offset = 0
        h = self.tMaps[Level]["hwin"]
        nbW = self.width / h
        iw = 0
        running = True
        logger.debug("i:"+str(i)+",maxi:"+str(maxi)+",h:"+str(h)+",nbW:"+str(nbW))
        logger.debug("witem:"+str(self.tMaps[Level]["witem"]))
        if len(self.tMaps[Level]["witem"]) == 0:
            # pas de fenêtres à afficher !
            running = False
        header = self.tMaps[Level]["header"]
        if header == True:
            i = 0
        while running == True:
            offset = h*iw
            logger.debug("offset:"+str(offset))
            try:
                win = self.tMaps[Level]["witem"][i]
            except:
                logger.setLevel(logging.DEBUG)
                logger.debug("tMaps:"+str(self.tMaps))
                logger.debug("mapLevel:"+str(self.mapLevel))
                logger.debug("Level:"+str(Level))
                logger.debug("mapL:"+str(self.mapL))
                logger.debug("i:"+str(i))
                logger.debug("witem:"+str(self.tMaps[Level]["witem"]))
                self.showDebug("display error")
                running = False
                break
            logger.debug(str(win))
            rect = []
            rect.append(self.tMaps[Level]["window"][0])
            rect.append(self.tMaps[Level]["window"][1])
            rect.append(self.tMaps[Level]["window"][2])
            rect.append(self.tMaps[Level]["window"][3])
            rect[1] = rect[1]+offset
            rect[3] = rect[3]+offset
            self.draw.rectangle(rect, outline=0, fill=255)
            logger.debug("i:"+str(i)+",witem:"+str(self.tMaps[Level]["witem"]))
            for itm in self.tMaps[Level]["witem"][i]["item"]:
                if itm["rect"] != False:
                    self.draw.rectangle(itm["rect"], outline=0, fill=255)
                if itm["txt"] != False:
                    tp = 24
                    if len(itm["txt"]) == 4:
                        tp = itm["txt"][3] # taille police = dernier élément du tableau
                    font = ImageFont.truetype(self.ttf,tp)
                    x = itm["txt"][0]
                    y  = itm["txt"][1]+offset
                    lib  = itm["txt"][2]
                    
                    if "vars" in itm:
                        logger.debug("vars:"+str(itm["vars"]))
                        if itm["vars"] != False:
                            for variable in itm["vars"]:
                                logger.debug("variable:"+str(variable))
                                lib = lib.format(var = variable)
                    
                    logger.debug("itm:"+str(itm["txt"]))
                    logger.debug("i:"+str(i)+",x:"+str(x)+",y:"+str(y)+",lib:"+str(lib)+",offset:"+str(offset))
                    self.draw.text((x, y), lib,  font=font, fill=0)
                if itm["img"] != False:
                    x = itm["img"][0]
                    y = itm["img"][1]+offset
                    picture = itm["img"][2]
                    #print(str(picture))
                    img = Image.open(picture)
                    img = img.resize((40, 40),Image.NEAREST)
                    self.image.paste(img, (x,y))
            iw += 1
            if header == True:
                i = self.mapL
                header = False
            i += 1
            if iw > nbW:
                running = False
            if i > maxi:
                running = False

        # Affichage de la navigation
        for icon in self.tMaps[Level]["nav"]:
            if icon["img"] != False:
                x = icon["x"]
                y = icon["y"]
                xp = icon["img"][0]
                yp = icon["img"][1]
                picture = icon["img"][2]
                logger.debug("pic:"+str(picture))
                img = Image.open(picture)
                img = img.resize((40, 40),Image.NEAREST)
                logger.debug("x:"+str(x)+",y:"+str(y))
                self.image.paste(img, (xp,yp))
        
        return self.image
#######################################################################


    def lire_cache(self):
        if os.path.exists(self.cache) == False:
            time.sleep(0.2)
            return True
        with open(self.cache, 'r') as cache:
            message = cache.read()
        if message == self.message:
            time.sleep(0.2)
            return True
        self.message = message # pour éviter de réécrire un message déjà affiché
        commande = message[0:1]
        texte = message[1:]

        if commande == DISPLAY:        
            logger.debug(message)
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.height,self.width), fill=255)
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
            self.draw.rectangle((0,0,self.height,self.width), fill=255)
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

            #logger.debug("Small...")

        elif commande == DISPLAY_MENU:
            # the character following the command is the number of the line (from 0 to 3) to be highlighted
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.width,self.height), fill=0)
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
            self.draw.text((self.x, self.top), line1,  font=self.fontsmall, fill=bright[0])

            self.draw.rectangle((0,self.top+16,self.width,self.top+32), outline=0, fill=fill[1])
            self.draw.text((self.x, self.top+16), line2,  font=self.fontsmall, fill=bright[1])

            self.draw.rectangle((0,self.top+32,self.width,self.top+48), outline=0, fill=fill[2])
            self.draw.text((self.x, self.top+32), line3,  font=self.fontsmall, fill=bright[2])

            self.draw.rectangle((0,self.top+48,self.width,self.top+64), outline=0, fill=fill[3])
            self.draw.text((self.x, self.top+48), line4,  font=self.fontsmall, fill=bright[3])
            
        elif commande == CLEAR: 
            # Draw a white filled box to clear the image.
            self.draw.rectangle((0,0,self.height,self.width), fill=255)
            self.draw.text((self.x, self.top), " ",  font=self.font, fill=0)
            logger.debug("Clear...")
            
        elif commande == POWER_OFF: # a stop to the programm is requested
            self.buff1 = ""
            self.buff2 = ""
            self.buff3 = ""
            self.buff4 = ""
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=0)
            self.draw.text((self.x, self.top), "",  font=self.font, fill=0)
            logger.debug("Goto Sleep...")
            
        else:
            logger.debug("commande invalide:"+commande)
            line1 = "invalid command:"+commande
            self.draw.rectangle((0,0,self.height,self.width), outline=0, fill=0)
            self.draw.text((self.x, self.top), line1,  font=self.font, fill=0)

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
        
        self.level = 0        
        
        while running == True:
            # Read the touch input
            gt.GT_Scan(GT_Dev, GT_Old)
            if(self.stateDisplay == 0 and self.touch() == False):
                running = self.lire_cache()
            else:
                self.dialog()

    def touch(self):
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
        logger.debug("def dialog:")
        running = True
        ct = 0
        while running == True:
            if self.stateDisplay > 0:
                if self.stateDisplay == self.laststate:
                    if ct > 1200: # 300 cycles de 0.1" = 30 secondes
                        # au bout d'un certain temps d'inactivité, on sort du dialogue
                        self.stateDisplay = 0
                        logger.info("trop de temps")
                        running = False
                        ct = 0
                    ct += 1
                else:
                    ct = 0
                    self.laststate = self.stateDisplay
            else:
                ct = 0

            if running == True:
                running = self.performState()

            time.sleep(0.1)

            # Read the touch input
            gt.GT_Scan(GT_Dev, GT_Old)
            

        self.mapLevel = 0
        self.mapL = 0
        
        self.message = ""

    def performState(self):
        running = True
        if self.stateDisplay == 0: # on vient du chronomètre
            self.displayMenuG()
        elif self.stateDisplay == 1: # on vient du dialogue
            if self.touch() == True:
                running = self.performMenuG()
        else:
            self.showDebug(str(self.stateDisplay)+" inconnu")
            self.stateDisplay = 0
            running = False

        return running
        
    def get_touch(self):
        zone = 0
        x = 250 - GT_Dev.Y[0]
        y = GT_Dev.X[0]

        for touch in self.tMaps[self.mapLevel]["nav"]:
            tx = touch["x"]
            ty = touch["y"]
            lib = touch["lib"]
            func = touch["func"]
            txt = "hors zone"
            if x > tx[0]-1 and x < tx[1]+1 and y > ty[0]-1 and y < ty[1]+1:
                zone = touch
                break
        if zone == 0: # on recherche une touche dans une fenêtre
            tx = (self.tMaps[self.mapLevel]["window"][0],self.tMaps[self.mapLevel]["window"][2])
            ty = (self.tMaps[self.mapLevel]["window"][1],self.tMaps[self.mapLevel]["window"][3])
            zy = 0
            line = self.mapL # numéro de la première fenêtre affichée
            while zy < self.width:
                if x > tx[0]-1 and x < tx[1]+1 and y > zy+ty[0]-1 and y < zy+ty[1]+1:
                    zone = {}
                    zone = self.tMaps[self.mapLevel]["witem"][line]
                    break                
                zy = zy + self.tMaps[self.mapLevel]["hwin"]
                line += 1
        #        
        return zone
    
    def displayMenuG(self):
        self.display(self.mapLevel)

        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True        
    
    def performMenuG(self):
        running = True
        self.ztouch = self.get_touch()
        if self.ztouch == 0:
            self.errorZone()
            return False
        namefunc = self.ztouch.get("func", print(str(self.ztouch)))
        if namefunc == False:
            self.showDebug("Procédure non trouvée")
            self.stateDisplay = 0
            self.mapLevel = 0
            return False
        
        retfunc = namefunc()

        self.stateDisplay = 0
        return retfunc
            
    def errorZone(self):
        self.showDebug("Zone non traitée")
        
        self.stateDisplay = 0
        self.mapLevel = 0
        return False

    def showDebug(self,lib="?",fontsize=False):
        if logger.level != logging.DEBUG:
            return False
        if fontsize ==False:
            fontsize = self.fontsmallsize
        self.showMessage(lib,fontsize)
        time.sleep(1)

    def showMessage(self,lib="?",fontsize=False):
        if fontsize ==False:
            fontsize = self.fontsmallsize
        font = ImageFont.truetype(self.ttf,fontsize)
        self.draw.rectangle((0,0,self.height,self.width), fill=255)
        self.draw.text((self.x, self.top), lib,  font=font, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()        
        time.sleep(0.5)
        
    def home(self):
        self.showDebug("Home")

        self.mapLevel = 0
        self.mapL = 0

        running = self.displayMenuG()
        return running
        
    def end(self):
        self.showDebug("END")

        self.mapLevel = 0
        self.mapL = 0
        self.stateDisplay = 0
        return False
        
    def returnParent(self):
        # les données du parent sont dans la pile
        backscreen = self.depile()
        self.showDebug("retour parent:"+str(backscreen))
        if backscreen == 0:
            self.mapLevel = 0
            self.stateDisplay = 0
            return False
        self.stateDisplay = 0
        return True
        
    def downMenu(self):
        self.stateDisplay = 0
        level = self.mapLevel
        line = self.mapL
        maxl = len(self.tMaps[level]["witem"])-1
        if line < maxl:
            line += 1
        self.mapL = line
        return True
        
    def upMenu(self):
        self.showDebug("Up")

        self.stateDisplay = 0
        level = self.mapLevel
        line = self.mapL
        maxl = len(self.tMaps[level]["witem"])-1
        self.showDebug("line:"+str(line)+",maxl:"+str(maxl))
        if line > 0:
            line -= 1
        self.mapL = line
        return True
        
    def next(self):
        self.showDebug("Next")

        self.stateDisplay = 0
        level = self.mapLevel
        line = self.mapL
        if self.tMaps[level]["header"] == True:
            line += 1

        if "func" in self.tMaps[level]["witem"][line]:
            self.showDebug("appel fonction Window")
            window = self.tMaps[level]["witem"][line]
            namefunc = window.get("func", print(str(window)))
            if namefunc == False:
                self.showDebug("Procédure non trouvée")
                self.stateDisplay = 0
                self.mapLevel = 0
                return False
            
            retfunc = namefunc()

            self.stateDisplay = 0
            return retfunc

        self.mapLevel = 0
        self.mapL = 0
        return True
        
    def menuCMDs(self):
        map = self.searchMap("Menu Commandes")
        if map != False:
            self.display(map["level"])
            self.empile()
            self.mapLevel = map["level"]
            self.mapL = 0
        else:
            self.mapLevel = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True
        
    def nettoiePile(self):
        self.pileW = []
        
    def empile(self):
        dict = {}
        dict["level"] = self.mapLevel
        dict["line"] = self.mapL
        self.pileW.append(dict)
        
    def depile(self):
        if len(self.pileW) == 0:
            return True        

        i = len(self.pileW) - 1
        self.mapLevel = self.pileW[i]["level"]
        self.mapL = self.pileW[i]["line"]

        return True
        
    def request_MyChronoGPS(self):
        map = self.searchMap("MyChronoGPS")
        if map != False:
            self.empile()
            self.mapL = 0
            self.display(map["level"])
            self.mapLevel = map["level"]
        else:
            self.mapLevel = 0
            self.mapL = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True
        
    def startGPS(self):
        font = ImageFont.truetype(self.ttf,18)
        self.showDebug("Démarrage MyChronoGPS en cours",font)
        #
        isModule = get_module(main_module)
        if isModule == False:
            try:
                os.system(cmd_start)
                msg = "start command successfully send"
            except:
                msg = "Unexpected error:"+str(sys.exc_info()[0])+str(sys.exc_info()[1])
                logger.info(str(msg))
                self.showDebug(msg,font)
                time.sleep(3)
                self.stateDisplay = 0
                self.level = 0
                return False
        else:
            msg = "MyChronoGPS is already running"

        self.showDebug(msg,font)
        time.sleep(3)

        self.stateDisplay = 0
        self.level = 0
        return False        
        
    def stopGPS(self):
        font = ImageFont.truetype(self.ttf,18)
        self.showDebug("Arrêt MyChronoGPS en cours",font)
        #
        isModule = get_module(main_module)
        if isModule != False:
            try:
                pipelcd = os.open(pipe_name, os.O_WRONLY, os.O_NONBLOCK)
                os.write(pipelcd, (cmd_stop+"\r\n").encode())
                os.close(pipelcd)
                msg = "stop command successfully send"
            except:
                msg = "Unexpected error:"+str(sys.exc_info()[0])+str(sys.exc_info()[1])
                logger.info(str(msg))
                self.showDebug(msg,font)
                time.sleep(3)
                self.stateDisplay = 0
                self.level = 0
                return False
        else:
            msg = "MyChronoGPS is not running"
        
        self.showDebug(msg,font)
        time.sleep(3)

        self.stateDisplay = 0
        self.level = 0
        return False        
        
    def request_stopRPi(self):
        map = self.searchMap("Demande Arrêt RPi")
        if map != False:
            self.empile()
            self.mapL = 0
            self.display(map["level"])
            self.mapLevel = map["level"]
            self.mapL = 0
        else:
            self.mapLevel = 0
            self.mapL = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True
        
    def request_clearAutoTrack(self):
        map = self.searchMap("Demande Effacement Auto Track")
        if map != False:
            self.empile()
            self.mapL = 0
            self.display(map["level"])
            self.mapLevel = map["level"]
            self.mapL = 0
        else:
            self.mapLevel = 0
            self.mapL = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True

    def getUseDBTrack(self):
        map = self.searchMap("Utilisation DB Track")
        if map != False:
            # affichage de la zone touchée

            # recherche du paramètre UseDBTrack actuel
            self.dbtracks = 0
            el_parms = parms.get_parms("UseDBTrack")
            if "UseDBTrack" in parms.params:
                self.dbtracks = int(el_parms)
            # affichage de UseDBTrack dans la fenêtre état
            values = []
            if self.dbtracks == 1:
                values.append("actif")
                values.append("DB Tracks OFF")
            else:
                values.append("inactif")
                values.append("DB Tracks ON")

            i = 0
            for item in map["witem"][0]["item"]:
                if "vars" in item:
                    if item["vars"] != False:
                        for variable in item["vars"]:
                            variable = values[i]
                            item["vars"][0] = variable
                            i += 1

            self.empile()
            self.mapL = 0

            self.display(map["level"])

            self.mapLevel = map["level"]
            self.mapL = 0
        else:
            self.mapLevel = 0
            self.mapL = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True

    def getUseAutoTrack(self):
        logLevel = logger.level
        #logger.setLevel(logging.DEBUG)
        map = self.searchMap("Utilisation AutoTrack")
        self.showDebug("getUseAutoTrack en cours")
        logger.debug(str(map))
        if map != False:
            # affichage de la zone touchée

            # recherche du paramètre AutoTrackMode actuel
            self.autotrack = 0
            el_parms = parms.get_parms("AutoTrackMode")
            if "AutoTrackMode" in parms.params:
                self.autotrack = int(el_parms)
            # affichage de AutoTrackMode dans la fenêtre état
            values = []
            if self.autotrack == 1:
                values.append("actif")
                values.append("AutoTrack OFF")
            else:
                values.append("inactif")
                values.append("AutoTrack ON")

            i = 0
            for item in map["witem"][0]["item"]:
                if "vars" in item:
                    if item["vars"] != False:
                        for variable in item["vars"]:
                            variable = values[i]
                            item["vars"][0] = variable
                            i += 1

            self.empile()
            self.mapL = 0

            self.display(map["level"])

            self.mapLevel = map["level"]
            self.mapL = 0
        else:
            self.mapLevel = 0
            self.mapL = 0
            logger.setLevel(logLevel)
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        logger.setLevel(logLevel)
        return True

    def getTracker(self):
        map = self.searchMap("Utilisation Tracker")
        if map != False:
            # affichage de la zone touchée
        
            # recherche du paramètre GpsTrackerMode actuel
            self.tracker = 0
            el_parms = parms.get_parms("GpsTrackerMode")
            if "GpsTrackerMode" in parms.params:
                self.tracker = int(el_parms)
            # affichage de GpsTrackerMode dans la fenêtre état
            values = []
            if self.tracker == 1:
                values.append("actif")
                values.append("Tracker OFF")
            else:
                values.append("inactif")
                values.append("Tracker ON")

            i = 0
            for item in map["witem"][0]["item"]:
                if "vars" in item:
                    if item["vars"] != False:
                        for variable in item["vars"]:
                            variable = values[i]
                            item["vars"][0] = variable
                            i += 1

            self.empile()
            self.mapL = 0

            self.display(map["level"])

            self.mapLevel = map["level"]
            self.mapL = 0
        else:
            self.mapLevel = 0
            self.mapL = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True

    def stopRPi(self):
        font = ImageFont.truetype(self.ttf,18)
        self.draw.rectangle((0,0,self.height,self.width), fill=255)
        self.draw.text((self.x, self.top), "Arrêt RPi en cours",  font=font, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        time.sleep(2)
        self.draw.rectangle((0,0,self.height,self.width), fill=255)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        
        try:
            os.system("sudo shutdown -h now")
            msg = "shutdown command successfully send"
        except:
            msg = "Unexpected error:"+str(sys.exc_info()[0])+str(sys.exc_info()[1])
            logger.info(str(msg))
            self.draw.rectangle((0,0,self.height,self.width), fill=255)
            self.draw.text((self.x, self.top), msg,  font=font, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            time.sleep(3)
            self.stateDisplay = 0
            self.level = 0
            return False

        self.stateDisplay = 0
        self.level = 0
        return False
        
    def request_restartRPi(self):
        map = self.searchMap("Demande Redémarrage RPi")
        if map != False:
            #self.nettoiePile()
            #self.mapL = 0
            self.empile()
            self.mapL = 0
            self.display(map["level"])
            self.mapLevel = map["level"]
            self.mapL = 0
        else:
            self.mapLevel = 0
            self.mapL = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True
        
    def restartRPi(self):
        font = ImageFont.truetype(self.ttf,18)
        self.draw.rectangle((0,0,self.height,self.width), fill=255)
        self.draw.text((self.x, self.top), "Redémarrage RPi en cours",  font=font, fill=0)
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        time.sleep(2)
        
        try:
            os.system("sudo reboot")
            msg = "reboot command successfully send"
        except:
            msg = "Unexpected error:"+str(sys.exc_info()[0])+str(sys.exc_info()[1])
            logger.info(str(msg))
            self.draw.rectangle((0,0,self.height,self.width), fill=255)
            self.draw.text((self.x, self.top), msg,  font=font, fill=0)
            self.epd.displayPartial(self.epd.getbuffer(self.image))
            self.epd.ReadBusy()
            time.sleep(3)
            self.stateDisplay = 0
            self.level = 0
            return False

        self.stateDisplay = 0
        self.mapLevel = 0
        return False
        
    def clearAutoTrack(self):
        logLevel = logger.level
        self.showDebug("clearAutoTrack en cours")
        
        mydict = dict()

        if os.path.isfile(autotrack):
            try:
                os.remove(autotrack)
                mydict["msg"] = "autodef track successfully removed"
                mydict["return"] = 0
            except OSError as err:
                print("OS error: {0}".format(err))
                mydict["msg"] = "OS error: {0}".format(err)
                mydict["return"] = 8
            except:
                print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
                mydict["msg"] = "Unexpected error:", sys.exc_info()[0], sys.exc_info()[1]
                raise
        else:
                mydict["msg"] = "no autodef track to remove"
                mydict["return"] = 0

        self.showDebug(str(mydict["return"]))
        self.showMessage(str(mydict["msg"]))
        
        logger.level = logLevel
        
        self.stateDisplay = 0
        self.mapLevel = 0
        return True
        
    def switchUseDBTrack(self):
        logLevel = logger.level
                
        # recherche du paramètre UseDBTrack actuel
        self.dbtracks = 0
        el_parms = parms.get_parms("UseDBTrack")
        if "UseDBTrack" in parms.params:
            self.dbtracks = int(el_parms)
            self.showDebug("UseDBTrack:"+str(self.dbtracks))
        if self.dbtracks == 1:
            self.dbtracks = 0
            status_dbtracks = "OFF"
        else:
            self.dbtracks = 1
            status_dbtracks = "ON"
            
        parms.set_parms("UseDBTrack",self.dbtracks)
        self.showDebug("dbtracks "+str(status_dbtracks))

        logger.level = logLevel
        self.stateDisplay = 0
        self.mapLevel = 0
        return True
        
    def switchUseAutoTrack(self):
        logLevel = logger.level
                
        # recherche du paramètre AutoTrackMode actuel
        self.autotrack = 0
        el_parms = parms.get_parms("AutoTrackMode")
        if "AutoTrackMode" in parms.params:
            self.autotrack = int(el_parms)
            self.showDebug("AutoTrackMode:"+str(self.autotrack))
        if self.autotrack == 1:
            self.autotrack = 0
            status_autotrack = "OFF"
        else:
            self.autotrack = 1
            status_autotrack = "ON"
            
        parms.set_parms("AutoTrackMode",self.autotrack)
        self.showDebug("autotrack "+str(status_autotrack))

        logger.level = logLevel
        self.stateDisplay = 0
        self.mapLevel = 0
        return True
        
    def switchTracker(self):
        logLevel = logger.level
                
        # recherche du paramètre GpsTrackerMode actuel
        self.tracker = 0
        el_parms = parms.get_parms("GpsTrackerMode")
        if "GpsTrackerMode" in parms.params:
            self.tracker = int(el_parms)
            self.showDebug("GpsTrackerMode:"+str(self.tracker))
        if self.tracker == 1:
            self.tracker = 0
            status_tracker = "OFF"
        else:
            self.tracker = 1
            status_tracker = "ON"
            
        parms.set_parms("GpsTrackerMode",self.tracker)
        self.showDebug("tracker "+str(status_tracker))

        logger.level = logLevel
        self.stateDisplay = 0
        self.mapLevel = 0
        return True
        
    def menuSessions(self):
        map = self.searchMap("Menu Sessions")
        if map != False:
            self.empile()
            self.mapL = 0
            self.display(map["level"])
            self.mapLevel = map["level"]

            # creation window liste des sessions
            map["witem"] = [] # effacement des fenêtres précédemment crées
            
            p = "Sessions"
            
            # # ligne titre
            l = "Liste Sessions"
            self.addWindow(l,False,p)
            t = [46,2,l,20] # position du texte, libellé & taille police (défaut = 24 si absent)
            self.addItem(t)
            
            # recherche des sessions et création d'un tableau
            listeSessions = self.getSessions()
            logger.debug("liste sessions:"+str(listeSessions))
            for line in listeSessions:
                self.mapL += 1

                # ligne détail
                l = "Session"
                f = self.detailSession
                x = line["fichier"]
                self.addWindow(l,f,p,x)
                
                t = [40,2,line["date_session"],14]
                self.addItem(t)
                t = [89,2,line["heure_session"],14]
                self.addItem(t)
                t = [124,2,line["circuit_session"],14]
                self.addItem(t)

            # touches de navigation pour la map Menu Sessions
            self.addTL3(picret,"RET",self.returnParent)
            self.addML3(pichome,"HOME",self.home)
            self.addBL3(picend,"END",self.end)
            self.addTR3(picup,"UP",self.upMenu)
            self.addMR3(picnext,"NEXT",self.next)
            self.addBR3(picdown,"DOWN",self.downMenu)

            map = self.searchMap("Menu Sessions")
            self.mapLevel = map["level"]
            self.mapL = 0

        else:
            self.mapLevel = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True
        
    def listdirectory(self,path): 
        fichier=[] 
        l = glob.glob(path+'/*') 
        for i in l: 
            if os.path.isdir(i): fichier.extend(listdirectory(i)) 
            else: fichier.append(i) 
        return fichier
        
    def getSessions(self):
        result = []
        listfic = self.listdirectory(dirsess)
        for fic in listfic:
            statinfo = os.stat(fic)
            if statinfo.st_size > 0:
                # on recherche les extensions .txt
                extension = os.path.splitext(fic)
                if extension[1] == '.txt':
                    session = dict()
                    session["fichier"] = fic
                    FD = open(fic, 'r')
                    info = FD.read()
                    T = info.split(";") # c'est au format csv avec le séparateur ";" 
                    session["date_session"] = T[0][0:2]+T[0][3:5]+T[0][8:10]
                    session["heure_session"] = T[1][0:2]+T[0][3:5]
                    session["circuit_session"] = T[2]
                    session["sort"] = str(T[0][6:10])+str(T[0][3:5])+str(T[0][0:2])+str(session["heure_session"])
                    FD.close()
                    result.append(session)
        result = sorted(result, key=lambda d: d["sort"], reverse=True)
        return result
        
    def getChronos(self,fic):
        result = []
        session = dict()
        FD = open(fic, 'r')
        info = FD.read()
        Tinfo = info.split('\n')
        logger.debug(str(len(Tinfo)))
        logger.debug("info:"+str(Tinfo))
        line = Tinfo[0].split(";")
        session["date"] = line[0]
        session["heure"] = line[1]
        session["circuit"] = line[2]

        i = 1
        chrono = []
        best = False
        blap = False
        bin1 = False
        bin2 = False
        bin3 = False
        bin4 = False
        session["best"] = ""
        session["bin1"] = ""
        session["bin2"] = ""
        session["bin3"] = ""
        while i < len(Tinfo):
            lap = dict()
            line = Tinfo[i].split(";")
            logger.debug("line:"+str(line))
            if len(line) < 4:
                break
            lap["date"] = line[0]
            lap["heure"] = line[1]
            lap["lap"] = line[2]
            lap["time"] = line[3]
            if best == False or best > lap["time"]:
                best = lap["time"]
                blap = lap["lap"]
            if len(line) > 4:
                lap["int1"] = line[4]
                if bin1 == False or bin1 > lap["int1"]:
                    bin1 = lap["int1"]
            if len(line) > 5:
                lap["int2"] = line[5]
                if bin2 == False or bin2 > lap["int2"]:
                    bin2 = lap["int2"]
            if len(line) > 6:
                lap["int3"] = line[6]
                if bin3 == False or bin3 > lap["int3"]:
                    bin3 = lap["int3"]
            if len(line) > 7:
                lap["int4"] = line[7]
                if bin4 == False or bin4 > lap["int4"]:
                    bin4 = lap["int4"]
            chrono.append(lap)
            i += 1
            
        session["chrono"] = chrono
        session["best"] = best
        session["blap"] = blap
        session["bin1"] = bin1
        session["bin2"] = bin2
        session["bin3"] = bin3
        session["bin4"] = bin4
        
        idealTime = timedelta(seconds=0)
        if bin1 != False:
            dt = getTime(bin1)
            idealTime += dt
        if bin2 != False:
            dt = getTime(bin2)
            idealTime += dt
        if bin3 != False:
            dt = getTime(bin3)
            idealTime += dt
        if bin4 != False:
            dt = getTime(bin4)
            idealTime += dt
        idt = formatTimeDelta(idealTime)
        session["idt"] = idt
        
        result.append(session)
        
        return session
        
    def detailSession(self):
        self.showDebug("detailSession en travaux")

        map = self.searchMap("Detail Session")
        if map != False:
            self.empile()

            if self.tMaps[self.mapLevel]["header"] == True:
                self.mapL += 1
            file_session = self.tMaps[self.mapLevel]["witem"][self.mapL]["xtra"]

            self.mapL = 0
            self.mapLevel = map["level"]

            self.display(map["level"])

            # creation window 
            map["witem"] = [] # effacement des fenêtres précédemment crées
            
            p = "Menu Sessions"

            l = "Detail Session"
            f = self.listeChronos
            self.addWindow(l,f,p)            
            
            # recherche de la session et création d'un tableau des chronos
            session = self.getChronos(file_session)
            self.session = session

            l = str(session["circuit"])
            t = [40,2,l,18]
            self.addItem(t)
            l = str(session["date"])
            t = [40,22,l,18]
            self.addItem(t)
            l = str(session["heure"])
            t = [140,22,l,18]
            self.addItem(t)
            l = str(len(session["chrono"]))+" tours"
            t = [40,42,l,18]
            self.addItem(t)
            l = "best L"+str(session["blap"])
            t = [40,62,l,18]
            self.addItem(t)
            l = str(session["best"])
            t = [140,62,l,18]
            self.addItem(t)
            if session["idt"] != "00:00.00":
                l = "ideal Time"
                t = [40,82,l,18]
                self.addItem(t)
                l = str(session["idt"])
                t = [140,82,l,18]
                self.addItem(t)
            
            # touches de navigation pour la map Detail Session
            self.addTL3(picret,"RET",self.returnParent)
            self.addML3(pichome,"HOME",self.home)
            self.addBL3(picend,"END",self.end)
            self.addMR3(picnext,"NEXT",self.next)

            self.mapLevel = map["level"]
            self.mapL = 0

        else:
            self.mapLevel = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True

    def listeChronos(self):
        self.showDebug("listeChronos en travaux")
    
        map = self.searchMap("Liste Chronos")
        if map != False:
            self.empile()
            self.mapL = 0
            self.display(map["level"])
            self.mapLevel = map["level"]

            # creation window liste des chronos
            map["witem"] = [] # effacement des fenêtres précédemment crées
            
            p = "Sessions" # à affiner
            
            # # ligne titre
            l = "Liste Chronos"
            self.addWindow(l,False,p)
            t = [46,2,"Tour",20] # position du texte, libellé & taille police (défaut = 24 si absent)
            self.addItem(t)
            t = [100,2,"Temps",20] # position du texte, libellé & taille police (défaut = 24 si absent)
            self.addItem(t)
            
            # examen des chronos
            listeChronos = self.session["chrono"]
            logger.debug("liste chronos:"+str(listeChronos))
            for line in listeChronos:
                self.mapL += 1

                # ligne détail
                l = "Chrono"
                f = self.detailChrono
                x = line
                self.addWindow(l,f,p,x)
                
                t = [46,2,line["lap"],14]
                self.addItem(t)
                l = line["time"]
                if line["time"] == self.session["best"]:
                    l += " **"
                t = [100,2,l,14]
                self.addItem(t)

            # touches de navigation pour la map Menu Sessions
            self.addTL3(picret,"RET",self.returnParent)
            self.addML3(pichome,"HOME",self.home)
            self.addBL3(picend,"END",self.end)
            self.addTR3(picup,"UP",self.upMenu)
            self.addMR3(picnext,"NEXT",self.next)
            self.addBR3(picdown,"DOWN",self.downMenu)

            self.mapLevel = map["level"]
            self.mapL = 0

        else:
            self.mapLevel = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True
    
        
    def detailChrono(self):
        self.showDebug("detailChrono en travaux")

        map = self.searchMap("Detail Chrono")
        if map != False:
            self.empile()

            if self.tMaps[self.mapLevel]["header"] == True:
                self.mapL += 1                
            
            chrono = self.tMaps[self.mapLevel]["witem"][self.mapL]["xtra"]

            self.mapL = 0
            self.mapLevel = map["level"]

            self.display(map["level"])

            # creation window 
            map["witem"] = [] # effacement des fenêtres précédemment crées
            
            p = "Menu Sessions"

            l = "Detail Chrono"
            self.addWindow(l,False,p)
            
            l = str(self.session["circuit"])
            t = [40,2,l,18]
            self.addItem(t)
            l = str(chrono["date"])
            t = [40,22,l,18]
            self.addItem(t)
            l = str(chrono["heure"])
            t = [140,22,l,18]
            self.addItem(t)
            l = "Tour: "+str(chrono["lap"])
            t = [40,42,l,18]
            self.addItem(t)
            l = str(chrono["time"])
            t = [140,42,l,18]
            self.addItem(t)
            l = ""
            if "int1" in chrono:
                l += str(chrono["int1"])
            t = [40,62,l,18]
            self.addItem(t)
            l = ""
            if "int2" in chrono:
                l += str(chrono["int2"])
            t = [140,62,l,18]
            self.addItem(t)
            l = ""
            if "int3" in chrono:
                l += str(chrono["int3"])
            t = [40,82,l,18]
            self.addItem(t)
            l = ""
            if "int4" in chrono:
                l += str(chrono["int4"])
            t = [140,82,l,18]
            self.addItem(t)
            
            # touches de navigation pour la map Detail Session
            self.addTL3(picret,"RET",self.returnParent)
            self.addML3(pichome,"HOME",self.home)
            self.addBL3(picend,"END",self.end)

            self.mapLevel = map["level"]
            self.mapL = 0

        else:
            self.mapLevel = 0
            return False
        self.epd.displayPartial(self.epd.getbuffer(self.image))
        self.epd.ReadBusy()
        self.stateDisplay = 1
        return True
        
    def createMaps(self):
        self.mapLevel = -1
        if self.addMap("Menu Principal",[40,0,209,60],61) == False:
            return False

        # fenêtres de la map Menu Principal
        # fenêtre 1 = CMDs
        f = self.menuCMDs
        l = "CMDs"
        self.addWindow(l,f)
        t = [46,16,l] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        # fenêtre 2 = Sessions
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.menuSessions
        l = "Sessions"
        self.addWindow(l,f)
        t = [46,16,l] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)

        # touches de navigation pour la map Menu Principal
        self.addML1(picend,"END",self.end)

#        # Menu Commandes
        if self.addMap("Menu Commandes",[40,0,209,60],61) == False:
            return False
        
        p = "CMDs" # fenêtre parente

        # fenêtre 1 = MyChronoGPS
        f = self.request_MyChronoGPS
        #f = self.request_("MyChronoGPS")
        l = "MyChronoGPS"
        self.addWindow(l,f,p)
        t = [46,16,l] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        # fenêtre 2 = Redémarrage RPi
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.request_restartRPi
        l = "Redémarrage RPi"
        self.addWindow(l,f,p)
        t = [46,16,l,20] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        # fenêtre 3 = Arrêt RPi
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.request_stopRPi
        l = "Arrêt RPi"
        self.addWindow(l,f,p)
        t = [46,16,l] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        # fenêtre 4 = Effacement Auto Track
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.request_clearAutoTrack
        l = "Effacement Auto Track"
        self.addWindow(l,f,p)
        t = [46,16,l,16] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        # fenêtre 5 = Utilisation DB Track
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.getUseDBTrack
        l = "Utilisation DB Track"
        self.addWindow(l,f,p)
        t = [46,16,l,16] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        # fenêtre 6 = AutoTrack ON/OFF
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.getUseAutoTrack
        l = "Utilisation AutoTrack"
        self.addWindow(l,f,p)
        t = [46,16,l,16] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        # fenêtre 7 = Utilisation Tracker
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.getTracker
        l = "Tracker"
        self.addWindow(l,f,p)
        t = [46,16,l,16] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)

        # touches de navigation pour la map Menu Commandes
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)
        self.addTR3(picup,"UP",self.upMenu)
        self.addBR3(picdown,"DOWN",self.downMenu)

#        # Menu MyChronoGPS
        if self.addMap("MyChronoGPS",[40,0,209,60],61) == False:
            return False
       
        p = "MyChronoGPS" # fenêtre parente

        # fenêtre 1 = démarrage MyChronoGPS
        f = self.startGPS
        l = "Démarrage MyChronoGPS"
        self.addWindow(l,f,p)
        t = [54,4,"Démarrer",20] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        t = [54,34,"MyChronoGPS",20] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t)
        #
        # fenêtre 2 = arrêt MyChronoGPS
        self.mapL = len(self.tMaps[self.mapLevel]["witem"])
        f = self.stopGPS
        l = "Arrêt MyChronoGPS"
        self.addWindow(l,f,p)
        t = [54,4,"Arrêter",20] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t, False)
        t = [54,34,"MyChronoGPS",20] # position du texte, libellé & taille police (défaut = 24 si absent)
        self.addItem(t, False)
        #

        # touches de navigation pour la map Menu MyChronoGPS
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)
        self.addTR3(picup,"UP",self.upMenu)
        self.addBR3(picdown,"DOWN",self.downMenu)

#        # Menu Demande Arrêt RPi
        if self.addMap("Demande Arrêt RPi",[40,0,254,122]) == False:
            return False
       
        p = "CMDs" # fenêtre parente

        # fenêtre 1 = libellé 
        l = "Arrêt RPi"
        self.addWindow(l)
        r = [40,0,250,20]
        t = [40,0,"Vous demandez 'Arrêt RPi'",16]
        self.addItem(t, False, r)
        t = [40,20,"voulez-vous continuer ? ",16]
        self.addItem(t, False)
        t = [60,60,"OUI",32]
        self.addItem(t)
        t = [160,60,"NON",32]
        self.addItem(t)
        self.addNav([40,124],[41,122],False,"OUI",self.stopRPi)
        self.addNav([146,250],[41,122],False,"NON",self.end)

        # touches de navigation pour la map Menu Demande Arrêt RPi
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)

#        # Menu Demande Redémarrage RPi
        if self.addMap("Demande Redémarrage RPi",[40,0,254,122]) == False:
            return False
       
        p = "CMDs" # fenêtre parente

        # fenêtre 1 = libellé 
        l = "Redémarrage RPi"
        self.addWindow(l)
        r = [40,0,250,40]
        t = [40,0,"Vous demandez 'Redémarrage RPi',",16]
        self.addItem(t, False, r)
        t = [40,20,"voulez-vous continuer ? ",16]
        self.addItem(t, False)
        t = [60,60,"OUI",32]
        self.addItem(t)
        t = [160,60,"NON",32]
        self.addItem(t)
        self.addNav([40,124],[41,122],False,"OUI",self.restartRPi)
        self.addNav([146,250],[41,122],False,"NON",self.end)

        # touches de navigation pour la map Menu Demande Arrêt RPi
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)

#        # Menu Demande Effacement Auto Track
        if self.addMap("Demande Effacement Auto Track",[40,0,254,122]) == False:
            return False
       
        p = "CMDs" # fenêtre parente

        # fenêtre 1 = libellé 
        l = "Effacement Auto Track"
        self.addWindow(l)
        r = [40,0,250,40]
        t = [40,0,"Vous demandez 'Effacement Auto Track',",16]
        self.addItem(t, False, r)
        t = [40,20,"voulez-vous continuer ? ",16]
        self.addItem(t, False)
        t = [60,60,"OUI",32]
        self.addItem(t)
        t = [160,60,"NON",32]
        self.addItem(t)
        self.addNav([40,124],[41,122],False,"OUI",self.clearAutoTrack)
        self.addNav([146,250],[41,122],False,"NON",self.end)

        # touches de navigation pour la map Menu Effacement Auto Track
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)

#        # Menu Utilisation DB Track
        if self.addMap("Utilisation DB Track",[40,0,254,122]) == False:
            return False
       
        p = "CMDs" # fenêtre parente

        # fenêtre 1 = libellé 
        l = "Utilisation DB Track"
        self.addWindow(l)
        
        r = [40,0,250,40]
        t = [40,0,"DB Tracks actuellement",16]
        self.addItem(t, False, r)
        t = [40,20,"{var}",16] # à remplacer par l'état actuel de l'utilisation de la DataBase (Actif / Inactif)
        v = ["status"]
        self.addItem(t, False, False, v)
        
        t = [60,70,"{var}",28] # à remplacer par l'action sur l'utilisation de la DataBase (ON / OFF)
        v = ["action"]
        self.addItem(t, False, False, v)
        
        self.addNav([40,250],[61,122],False,"?",self.switchUseDBTrack)

        # touches de navigation pour la map Menu Demande Utilisation DB Track
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)

#        # Menu Utilisation AutoTrack
        if self.addMap("Utilisation AutoTrack",[40,0,254,122]) == False:
            return False
       
        p = "CMDs" # fenêtre parente

        # fenêtre 1 = libellé 
        l = "Utilisation AutoTrack"
        self.addWindow(l)
        
        r = [40,0,250,40]
        t = [40,0,"AutoTracks actuellement",16]
        self.addItem(t, False, r)
        t = [40,20,"{var}",16] # à remplacer par l'état actuel de l'utilisation de AutoTrackMode (Actif / Inactif)
        v = ["status"]
        self.addItem(t, False, False, v)
        
        t = [60,70,"{var}",28] # à remplacer par l'action sur l'utilisation de AutoTrackMode (ON / OFF)
        v = ["action"]
        self.addItem(t, False, False, v)
        
        self.addNav([40,250],[61,122],False,"?",self.switchUseAutoTrack)

        # touches de navigation pour la map Menu Demande Utilisation AutoTrack
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)

#        # Menu Utilisation Tracker
        if self.addMap("Utilisation Tracker",[40,0,254,122]) == False:
            return False
       
        p = "CMDs" # fenêtre parente

        # fenêtre 1 = libellé 
        l = "Utilisation Tracker"
        self.addWindow(l)
        r = [40,0,250,40]
        t = [40,0,"Le Tracker est actuellement",16]
        self.addItem(t, False, r)
        t = [40,20,"{var}",16] # à remplacer par l'état actuel du Tracker (Actif / Inactif)
        v = ["status"]
        self.addItem(t, False, False, v)
        
        t = [60,70,"{var}",32] # à remplacer par l'action sur le Tracker (ON / OFF)
        v = ["action"]
        self.addItem(t, False, False, v)
        
        self.addNav([40,250],[61,122],False,"?",self.switchTracker)

        # touches de navigation pour la map Utilisation Tracker
        self.addTL3(picret,"RET",self.returnParent)
        self.addML3(pichome,"HOME",self.home)
        self.addBL3(picend,"END",self.end)

#        # Menu Sessions
        if self.addMap("Menu Sessions",[40,0,209,122],20,True) == False:
            return False

#        # Detail Session
        if self.addMap("Detail Session",[40,0,209,122]) == False:
            return False

#        # Liste Chronos
        if self.addMap("Liste Chronos",[40,0,209,122],20,True) == False:
            return False

#        # Detail Chrono
        if self.addMap("Detail Chrono",[40,0,209,122]) == False:
            return False

        self.mapLevel = 0
        self.mapL = 0
        return True

# ajout des images de navigation
###################
# TL3         TR3 # Top Left / Top Right (3 Lignes)
###################
# ML3         MR3 # Middle Left / Middle Right
###################
# BL3         BR3 # Bottom Left / Bottom Right
###################
#
###################
#                 #
# TL2         TR2 # Top Left / Top Right (2 Lignes)
#                 #
###################
#                 #
# BL2         BR2 # Bottom Left / Bottom Right (2 Lignes)
#                 #
###################
#
###################
#                 #
# ML1         MR1 # Middle Left / Middle Right (1 Ligne)
#                 #
###################
#
    def addML1(self,pic,lib,func):
        x = [0,39] # valeur x et x+1 de la zone navigation
        y = [0,121] # valeur y et y+1 de la zone navigation
        img = [0,41,pic]
        self.addNav(x,y,img,lib,func)

    def addTL3(self,pic,lib,func):
        x = [0,39] # valeur x et x+1 de la zone navigation
        y = [0,40] # valeur y et y+1 de la zone navigation
        img = [0,4,pic]
        self.addNav(x,y,img,lib,func)

    def addML3(self,pic,lib,func):
        x = [0,39] # valeur x et x+1 de la zone navigation
        y = [41,81] # valeur y et y+1 de la zone navigation
        img = [0,45,pic]
        self.addNav(x,y,img,lib,func)

    def addBL3(self,pic,lib,func):
        x = [0,39] # valeur x et x+1 de la zone navigation
        y = [82,121] # valeur y et y+1 de la zone navigation
        img = [0,86,pic]
        self.addNav(x,y,img,lib,func)

    def addTR3(self,pic,lib,func):
        x = [210,249] # valeur x et x+1 de la zone navigation
        y = [0,40] # valeur y et y+1 de la zone navigation
        img = [210,4,pic]
        self.addNav(x,y,img,lib,func)

    def addMR3(self,pic,lib,func):
        x = [210,249] # valeur x et x+1 de la zone navigation
        y = [41,81] # valeur y et y+1 de la zone navigation
        img = [210,45,pic]
        self.addNav(x,y,img,lib,func)

    def addBR3(self,pic,lib,func):
        x = [210,249] # valeur x et x+1 de la zone navigation
        y = [82,121] # valeur y et y+1 de la zone navigation
        img = [210,86,pic]
        self.addNav(x,y,img,lib,func)       
        
def getTime(time2delta):
    timestr = str(time2delta)
    logger.debug(str(timestr))
    mm = timestr[0:2]
    ss = timestr[3:5]
    ms = timestr[6:8]
    logger.debug(str(mm))
    logger.debug(str(ss))
    logger.debug(str(ms))
    try:
        return timedelta(hours=0,minutes=int(mm),seconds=int(ss),milliseconds=int(ms)*10)
    except:
        return timedelta(hours=0,minutes=0,seconds=0,milliseconds=0)
def formatTimeDelta(t,format="mmsscc"):
    # receives a timedelta object = returns a time in the form MM:SS.CC (in hundredths of a second)
    retour = ""
    if t == 0:
        retour = "no valid time   "
    else:
        hh = floor(t.seconds / 3600)
        mm = floor(t.seconds / 60) - (hh * 60)
        ss = floor(t.seconds - ((hh * 3600) + (mm * 60)))
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
            cs = floor(t.microseconds/10000)
            retour += "."
            if cs < 10:
                retour += "0"
            retour += str(int(cs))
    
    return retour

if __name__ == '__main__':
    try:
        logger.info("MyChronoGPS_TE2in13V3")

        # we start by reading the parameters ...
        parms = Parms(Path)
        
        epd = epd2in13_V3.EPD()
        gt = gt1151.GT1151()
        GT_Dev = gt1151.GT_Development()
        GT_Old = gt1151.GT_Development()
        
        logger.info("init and Clear")
        
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

        # déclenchement de la boucle principale
        Screen().boucle()
        
        epd.init(epd.FULL_UPDATE)
        epd.Clear(0xFF)
        flag_t = 0
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
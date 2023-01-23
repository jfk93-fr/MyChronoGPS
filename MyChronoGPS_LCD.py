#!/usr/bin/env python3
# coding: utf8
###########################################################################
#
# MyChronoGPS_LCD
#   contrôle des affichages sur un écran LCD 
#   lit le named pipe DISPLAY, formate le message et l'affiche sur l'écran LCD
#
###########################################################################
VERSION = "1.01"
import os
#import wiringpi
import time
from lcd16x2_I2C import LCD16x2_I2C
#from datetime import timedelta, datetime, tzinfo
# from time import time, localtime, strftime, sleep
#from serial import Serial
#import threading
import sys
#import RPi_I2C_driver
#import json

class FIFOLCD():
    buff1 = ""
    buff2 = ""
    line1 = ""
    line2 = ""

    def __init__(self):
        self.lcd = LCD16x2_I2C()
        self.fifo = os.environ['HOME']+'/MyChronoGPS/pipes/DISPLAY'
        fileObj = os.path.exists(self.fifo)
        if fileObj == False:
            self.creer_fifo()
            fileObj = os.path.exists(self.fifo)

    def creer_fifo(self):
        try:
            os.mkfifo(self.fifo, 0o777)
            print("fifo is ready")
        except OSError:
            print("OSError")
            pass

    def lire_fifo(self):
        with open(self.fifo, 'r',0) as fifo:
            print("read fifo")
            #message = fifo.read().strip()
            message = fifo.read()
            print("msg:",message)
            #os.close(fifo)
        commande = message[0:1]
        print(commande)
        texte = message[1:]
        if commande == "C":
            self.lcd.clear()
            self.buff1 = ""
            self.buff2 = ""
        elif commande == "B":
            self.lcd.dark()
            self.buff1 = ""
            self.buff2 = ""
        elif commande == "D":
            haut = ""
            bas = ""
            if texte.find('//') > 0:
                haut, bas = texte.split('//')
                texte = '{}\n\r{}'.format(haut, bas)
            if texte.find('\r\n') > 0:
                print('cr found')
                haut, bas = texte.split('\r\n')
                texte = '{}\n\r{}'.format(haut, bas)
            print('Message: %s' % (texte))
            line1 = texte+"                "
            line2 = ""
            if haut != "":
                line1 = haut+"                "
            if bas != "":
                line2 = bas+"                "
                line2 = line2[0:16]
            line1 = line1[0:16]
            if line1 != self.buff1:
                self.lcd.lcd_display_string(line1, 1)
                self.buff1 = line1
            if line2 != "":
                if line2 != self.buff2:
                    self.lcd.lcd_display_string(line2, 2)
                    self.buff2 = line2
            
        else:
            print("commande invalide:",commande)
        time.sleep(0.2)

    def boucle(self):
        try:
            while True:
                self.lire_fifo()
        except KeyboardInterrupt:
            print("fifo is beeing removed")
            os.remove(self.fifo)
            self.lcd.clean()


i   f __name__ == '__main__':
    try:
        FIFOLCD().boucle()
                
    except KeyboardInterrupt:
        print("User Cancelled (Ctrl C)")
            
    except:
        print("Unexpected error - ", sys.exc_info()[0], sys.exc_info()[1])
        raise
        
    finally:
        print("END")

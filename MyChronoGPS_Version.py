#!/usr/bin/env python3
# coding: utf8

class Versions(): # classe qui retient les informations version + chemins d'accès

    def __init__(self):
        self.VERSION = "1.16"
        self.pathcmd = '/home/pi/MyChronoGPS'
        self.pathdata = self.pathcmd
        self.pathcache = self.pathdata+'/cache'
        self.pathlog = self.pathdata+'/log'
        self.pathweb = '/var/www/html'

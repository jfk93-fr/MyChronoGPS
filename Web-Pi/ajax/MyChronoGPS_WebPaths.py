#!/usr/bin/env python3
# coding: utf8
class Paths(): # classe qui retient les informations chemins d'accès

    def __init__(self):
        self.pathweb = '/var/www/html'
        fic = self.pathweb+'/ajax/HOME.txt'
        FD = open(fic, 'r')
        rec = FD.read()
        HOME = rec.rstrip('\n')
        #HOME='/home/pi'
        self.pathcmd = HOME+'/MyChronoGPS'
        self.pathdata = self.pathcmd
        self.pathcache = self.pathdata+'/cache'
        self.pathlog = self.pathdata+'/log'
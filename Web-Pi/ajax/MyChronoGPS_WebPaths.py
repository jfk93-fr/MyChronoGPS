#!/usr/bin/env python3
# coding: utf8
class Paths(): # classe qui retient les informations chemins d'accès

    def __init__(self):
        self.pathweb = '/var/www/html'
        self.pathcmd='/home/USER/MyChronoGPS' # variable USER modifiée à l'installation 
        self.pathdata = self.pathcmd
        self.pathcache = self.pathdata+'/cache'
        self.pathlog = self.pathdata+'/log'

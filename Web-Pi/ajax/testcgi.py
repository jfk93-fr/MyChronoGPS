#! /usr/bin/python 
# -*- coding: utf-8 -*-

# Il faut donner des droits en exécution sur ce fichier :
# sudo chmod +x /usr/lib/cgi-bin/stop_gps.py

import cgi
 
print("Content-Type:application/json; charset=UTF-8\n")
cgi.print_environ()

import os
print(os.getenv('HOME'))
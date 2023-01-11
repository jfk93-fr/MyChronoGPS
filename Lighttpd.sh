#!/bin/sh

# Installation Lighttpd
sudo apt-get install -y lighttpd

# Installation PHP
sudo apt-get install php7.4-fpm php7.4-mbstring php7.4-mysql php7.4-curl php7.4-gd php7.4-zip php7.4-xml -y

# Configuration lighttpd
sudo lighttpd-enable-mod fastcgi
sudo lighttpd-enable-mod fastcgi-php

sudo cp ./lighttpd/10-cgi.conf /etc/lighttpd/conf-available/10-cgi.conf       
sudo cp ./lighttpd/15-fastcgi-php.conf /etc/lighttpd/conf-available/15-fastcgi-php.conf       

sudo lighttpd-enable-mod cgi

# Vérification installation
sudo lighttpd -t -f /etc/lighttpd/lighttpd.conf

# Redémarrage lighttpd
sudo service lighttpd force-reload

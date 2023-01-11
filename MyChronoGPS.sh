#!/bin/bash

if [ ! -d analysis ]; then
sudo mkdir analysis
fi
if [ ! -d cache ]; then
sudo mkdir cache
fi
if [ ! -d log ]; then
sudo mkdir log
fi
if [ ! -d pipes ]; then
sudo mkdir pipes
fi
if [ ! -d sessions ]; then
sudo mkdir sessions
fi
if [ ! -d traces ]; then
sudo mkdir traces
fi

sudo cp ./Web-Pi/index.html /var/www/html/index.html         
sudo cp ./Web-Pi/MyChronoGPS.html /var/www/html/MyChronoGPS.html
sudo cp ./Web-Pi/MyChronoGPS-Analysis.html /var/www/html/MyChronoGPS-Analysis.html
sudo cp ./Web-Pi/MyChronoGPS-Cmd.html /var/www/html/MyChronoGPS-Cmd.html
sudo cp ./Web-Pi/MyChronoGPS-Dashboard.html /var/www/html/MyChronoGPS-Dashboard.html
sudo cp ./Web-Pi/MyChronoGPS-DesignTrack.html /var/www/html/MyChronoGPS-DesignTrack.html
sudo cp ./Web-Pi/MyChronoGPS-Live.html /var/www/html/MyChronoGPS-Live.html
sudo cp ./Web-Pi/MyChronoGPS-Sessions.html /var/www/html/MyChronoGPS-Sessions.html
sudo cp ./Web-Pi/MyChronoGPS-Tracks.html /var/www/html/MyChronoGPS-Tracks.html

sudo cp ./Web-Pi/ajax /var/www/html/ajax -r
sudo cp ./Web-Pi/css /var/www/html/css -r
sudo cp ./Web-Pi/GoogleMaps /var/www/html/GoogleMaps -r
sudo cp ./Web-Pi/Icones /var/www/html/Icones -r
sudo cp ./Web-Pi/img /var/www/html/img -r
sudo cp ./Web-Pi/js /var/www/html/js -r
sudo cp ./Web-Pi/Leaflet /var/www/html/Leaflet -r

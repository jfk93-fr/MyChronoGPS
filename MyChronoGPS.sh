#!/bin/sh
_wiringpi=$(ls /usr/local/lib/python*/dist-packages | grep -c wiringpi) || true
if [ "$_wiringpi" ]
then
	if [ "$_wiringpi" = "0" ]
	then
		sudo pip3 install wiringpi
	else
		echo "wiringpi already instaleld"
	fi
fi

# Is Lighttpd installed
#if [ ! -d /etc/lighttpd ] 
#then 
	echo "do you want to install Lighttpd ? Y or N"
	read rep
	if [ $rep = "Y" ] || [ $rep = "y" ]
	then
		sh ./Lighttpd.sh
		echo "Lighttpd successfully installed"
	fi	
#else 
#	echo "Lighttpd already installed" 
#fi

echo "sudoers will be edited to give rights to www-data"
echo "change of rights for MyChronoGPS"
if [ ! -f www-data_AUTH ]
then
	echo "www-data_AUTH file is missing"
	exit 4
else
	echo "copy of www-data_AUTH in /etc/sudoers.d"
	sudo cp ./www-data_AUTH /etc/sudoers.d
fi

# creation of working directories
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
#
_web=$(ls /var/www/html | grep -c MyChronoGPS) || true
if [ "$_web" ]
then
	if [ "$_web" != "0" ]
	then
		echo "It seems that the folders and web files are already installed."
		echo "The files will be overwritten."
	fi
fi
echo "creation of folders and web files"
sudo cp ./Web-Pi/index.html /var/www/html/index.html         
sudo cp ./Web-Pi/MyChronoGPS.html /var/www/html/MyChronoGPS.html
sudo cp ./Web-Pi/MyChronoGPS-Cmd.html /var/www/html/MyChronoGPS-Cmd.html
sudo cp ./Web-Pi/MyChronoGPS-Dashboard.html /var/www/html/MyChronoGPS-Dashboard.html
sudo cp ./Web-Pi/MyChronoGPS-Parms.html /var/www/html/MyChronoGPS-Parms.html
sudo cp ./Web-Pi/MyChronoGPS-Sessions.html /var/www/html/MyChronoGPS-Sessions.html

sudo cp ./Web-Pi/ajax /var/www/html -r

sudo chown -R www-data:www-data /var/www
echo "usermod -a -G www-data "$USER
sudo usermod -a -G www-data $USER
#sudo chmod -R g+rwX /var/www
#sudo chmod -R 777 /var/www
sudo chmod -R u+wx,g+wx,o+wx /var/www
#echo "Pres enter to continue"
#read rep

echo "change USER in Web environment" $HOME $USER
sudo echo $HOME > /var/www/html/ajax/HOME.txt
sudo echo $USER > /var/www/html/ajax/USER.txt
sudo sed -r 's/USER/'$USER'/' ./Web-Pi/ajax/MyChronoGPS_WebPaths.py > /var/www/html/ajax/MyChronoGPS_WebPaths.py
sudo echo "<?php \$ajaxroot = '"$HOME"/'; ?>" > /var/www/html/ajax/ajaxroot.php

sudo cp ./Web-Pi/css /var/www/html -r
sudo cp ./Web-Pi/Icones /var/www/html -r
sudo cp ./Web-Pi/img /var/www/html -r
sudo cp ./Web-Pi/js /var/www/html -r

sudo cp ./Web-Pi/Leaflet/html /var/www -r
echo "Have a GoogleMaps API key ? (Y-N)"
read rep
if [ $rep = "Y" ] || [ $rep = "y" ]
then
	echo "installation of GoogleMaps instead of Leaflet"
	sudo cp ./Web-Pi/GoogleMaps/html /var/www -r
	echo "While editing the file,"
	echo "Replace the value 'Your_API_Key' with the value of your GoogleMaps API key "
	echo "press enter to continue"
	read dummy
	sudo nano /var/www/html/js/key.js
	#echo "var myKey = '"$KEY"';" >> /var/www/html/js/key.js
fi
#
echo "changing access rights of www-data"
sudo chown -R www-data:www-data /var/www
sudo usermod -a -G www-data $USER
sudo chmod -R g+rwX /var/www

sudo chown -R www-data:www-data $HOME/MyChronoGPS

sudo chmod -R u+wx,g+wx,o+wx $HOME/MyChronoGPS

if [ -d cache ]; then
	sudo mount -t tmpfs -o size=2M,mode=0777 tmpfs $HOME/MyChronoGPS/cache
fi
if [ -d pipes ]; then
	sudo mount -t tmpfs -o size=20M,mode=0777 tmpfs $HOME/MyChronoGPS/pipes
fi

sudo chown -R www-data:www-data $HOME/MyChronoGPS

sudo chmod -R u+wx,g+wx,o+wx $HOME/MyChronoGPS

echo "The cache is mounted in memory at Raspberry startup"
sudo echo "tmpfs "$HOME"/MyChronoGPS/cache tmpfs size=2M,mode=0777 0 0" > MyChronoGPS_fstab
sudo echo "tmpfs "$HOME"/MyChronoGPS/pipes tmpfs size=20M,mode=0777 0 0" >> MyChronoGPS_fstab

sudo sh ./MyChronoGPS_fstab.sh

sudo chown -R www-data:www-data $HOME/MyChronoGPS

sudo chmod -R u+wx,g+wx,o+wx $HOME/MyChronoGPS

#!/bin/sh
_web=$(ls /var/www/html | grep -c MyChronoGPS) || true

if [ "$_web" = "0" ]
then
	echo "It seems that MyChronoGPS was not installed."
	echo "press enter to continue"
	read
	exit 4
fi

echo "creation of folders and sample files"
sudo cp ./sample/analysis ./ -r         
sudo cp ./sample/sessions ./ -r        

sudo chown -R www-data:www-data $HOME/MyChronoGPS
sudo chmod -R u+wx,g+wx,o+wx $HOME/MyChronoGPS

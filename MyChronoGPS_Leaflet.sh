#!/bin/sh
_web=$(ls /var/www/html | grep -c MyChronoGPS) || true

if [ "$_web" = "0" ]
then
	echo "It seems that MyChronoGPS was not installed."
	exit 4
fi

echo "installation of Leaflet instead of GoogleMaps"
sudo cp ./Web-Pi/Leaflet/html /var/www -r
echo "changing access rights of www-data"
sudo chown -R www-data:www-data /var/www
sudo chmod -R g+rwX /var/www

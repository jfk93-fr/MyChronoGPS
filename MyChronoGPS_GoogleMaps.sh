#!/bin/sh
_web=$(ls /var/www/html | grep -c MyChronoGPS) || true

if [ "$_web" = "0" ]
then
	echo "It seems that MyChronoGPS was not installed."
	exit 4
fi

echo "Have a GoogleMaps API key ? (Y-N)"
read rep
if [ $rep = "Y" ] || [ $rep = "y" ]
then
	echo "installation of GoogleMaps instead of Leaflet"
	if [ -f /var/www/html/js/key.js ]
	then
		echo "key.js file already exists"
		echo "save key.js file in key.js.bak"
		sudo cp /var/www/html/js/key.js /var/www/html/js/key.js.bak
		sudo cp ./Web-Pi/GoogleMaps/html /var/www -r
		sudo cp /var/www/html/js/key.js.bak /var/www/html/js/key.js
	else
		sudo cp ./Web-Pi/GoogleMaps/html /var/www -r
	fi
	
	echo "While editing the file,"
	echo "Replace the value 'Your_API_Key' with the value of your GoogleMaps API key "
	echo "press enter to continue"
	read dummy
	sudo nano /var/www/html/js/key.js
	echo "changing access rights for key.js"
	sudo chown www-data:www-data /var/www/html/js/key.js
	sudo chmod g+rwX /var/www/html/js/key.js
	#echo "var myKey = '"$KEY"';" >> /var/www/html/js/key.js
fi

#!/bin/sh
echo "changing access rights of www-data"
sudo chown -R www-data:www-data /var/www
sudo chmod -R g+rwX /var/www

sudo chown -R www-data:www-data $HOME/MyChronoGPS
sudo chmod -R u+wx,g+wx,o+wx $HOME/MyChronoGPS

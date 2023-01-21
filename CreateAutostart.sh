#!/bin/sh

# Démarrage Automatique du Tableau de Bord"

if [ ! -f ./StartDashboard ]; then
	echo "autostart file not found"
	exit
fi

if [ ! -d /home/pi/.config/lxsession ]; then
	echo "create lxsession directory"
	su mkdir /home/pi/.config/lxsession
fi
if [ ! -d /home/pi/.config/lxsession/LXDE-pi ]; then
	echo "create LXDE-pi directory"
	su mkdir /home/pi/.config/lxsession/LXDE-pi
fi
su cp ./StartDashboard /home/pi/.config/lxsession/LXDE-pi/autostart

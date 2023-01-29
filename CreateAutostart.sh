#!/bin/sh

# Démarrage Automatique du Tableau de Bord"

if [ ! -f ./StartDashboard ]; then
	echo "autostart file not found"
	exit
fi

if [ ! -d $HOME/.config/lxsession ]; then
	echo "create lxsession directory"
	sudo mkdir $HOME/.config/lxsession
fi
if [ ! -d $HOME/.config/lxsession/LXDE-pi ]; then
	echo "create LXDE-pi directory"
	sudo mkdir $HOME/.config/lxsession/LXDE-pi
fi
echo "create autostart"
sudo cp ./StartDashboard $HOME/.config/lxsession/LXDE-pi/autostart
sudo cat $HOME/.config/lxsession/LXDE-pi/autostart

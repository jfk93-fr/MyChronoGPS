#!/bin/sh -e
#
# MyChronoGPS_fstab.sh
#
_MyChronoGPS=$(sudo cat /etc/fstab | grep -c MyChronoGPS) || true
if [ "$_MyChronoGPS" ]
then
    if [ "$_MyChronoGPS" != "0" ]
    then
        printf "fstab is already adapted for MyChronoGPS %s\n"
        exit 4
    fi
fi

if [ ! -f ./MyChronoGPS_fstab ]; then
	echo "the fstab file to be copied was not found"
	exit
fi

sudo cp /etc/fstab fstab.bak
sudo cat MyChronoGPS_fstab >> /etc/fstab
echo "fstab is now adapted for MyChronoGPS"
exit 0

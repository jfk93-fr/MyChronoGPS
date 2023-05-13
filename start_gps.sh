#!/bin/sh -e
#
# start_gps.sh
#
_MyChronoGPS=$(ps -ef | grep -c MyChronoGPS.py) || true
if [ "$_MyChronoGPS" ]
then
    if [ "$_MyChronoGPS" != "1" ]
    then
        printf "MyChronoGPS is already running %s\n" "$_MyChronoGPS"
        exit 4
    fi
fi

read _home < /var/www/html/ajax/HOME.txt
echo "répertoire HOME="$_home
read _user < /var/www/html/ajax/USER.txt
echo "USER="$_user

#su $_user -c "/usr/bin/python3 "$_home"/MyChronoGPS/MyChronoGPS.py >> "$_home"/MyChronoGPS/log/MyChronoGPS.log 2>&1 &"
su $_user -c "/usr/bin/python3 "$_home"/MyChronoGPS/MyChronoGPS.py > "$_home"/MyChronoGPS/log/MyChronoGPS.log 2>&1 &"
exit 0

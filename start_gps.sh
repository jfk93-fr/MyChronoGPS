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

_GPS=$(ps -ef | grep -c MyChronoGPS_OLED) || true
if [ "$_GPS" ]
then
  if [ "$_GPS"  != "1" ]
  then
      printf "GPS_OLED is already running %s\n" "$_GPS"
  else
      if [ -p $HOME"/MyChronoGPS/cache/DISPLAY"  ]
	  then
          rm $HOME/projets/MyChronoGPS/cache/DISPLAY
		  echo "DISPLAY removed"
	  fi
  fi
fi

su $USER -c "/usr/bin/python3 "$HOME"/MyChronoGPS/MyChronoGPS.py > "$HOME"/MyChronoGPS/log/MyChronoGPS.log 2>&1 &"
exit 0

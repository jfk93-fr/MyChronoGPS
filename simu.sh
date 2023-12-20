#!/bin/sh
# python3 $HOME/MyChronoGPS/MyChronoGPS_Simulator.py $HOME/MyChronoGPS/traces/$1 "10"
freq = 10

if [ $2 ]
then
	freq=$2			
fi

python3 $HOME/MyChronoGPS/MyChronoGPS_Simulator.py $HOME/MyChronoGPS/sample/simu/$1 $freq

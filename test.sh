#!/bin/sh
_pwd=$(pwd)
echo $_pwd
echo $HOME


_wiringpi=$(ls /usr/local/lib/python*/dist-packages | grep -c wiringpi) || true
if [ "$_wiringpi" = "0" ]
then
	echo "sudo pip3 install wiringpi"
else
	echo "wiringpi already installed"
fi

exit 0 

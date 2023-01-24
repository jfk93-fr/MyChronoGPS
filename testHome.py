#!/usr/bin/env python3
# coding: utf8
import os
print(os.environ['HOME']+'/MyChronoGPS')
myenv = os.environ.get('HOME')
print(myenv+'/MyChronoGPS')
print(os.getenv('HOME'))
print(str(os.environ))

#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_WebPaths import Paths
Path = Paths();

dira = Path.pathweb+"/userdata/"
dirf = Path.pathdata
import glob 
import os
import json
import cgi
import zipfile

dataurl = cgi.FieldStorage()

os.chdir(dirf)

fileid = dataurl.getvalue('file')
zipid = fileid+".zip"
zip = zipfile.ZipFile(dira+zipid,'w')

zip.write("analysis/analysis-"+fileid+".json")
zip.write("sessions/session-"+fileid+".txt")
zip.close

lien = "../userdata/"+zipid

print('Content-Type: text-plain; charset=utf-8\r\n\r\n')
print('<html>')
print('<head>')
print('<meta http-equiv="refresh" content="0; url='+lien+'">')
print('</head>')
print('<body>')
print('</body>')
print('</html>')

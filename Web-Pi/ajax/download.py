#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
from MyChronoGPS_Version import Versions
Version = Versions();

dira = Version.pathweb+"/userdata/"
dirf = Version.pathdata
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
#zip.write(dirf+"analysis/analysis-"+fileid+".json")
#zip.write(dirf+"sessions/session-"+fileid+".txt")
zip.write("analysis/analysis-"+fileid+".json")
zip.write("sessions/session-"+fileid+".txt")
zip.close

lien = "../userdata/"+zipid
#print("Content-Disposition: attachment; filename=\""+zipid+"\"\r\n")
#print('Content-Type: application/zip;\r\n\r\n')
##
#FD = open(dira+zipid, 'r')
#print(FD.read())
##info = FD.read()
#FD.close()
#
#if info == "":
#    info = "vide"
#print(info)
print('Content-Type: text-plain; charset=utf-8\r\n\r\n')
print('<html>')
print('<head>')
print('<meta http-equiv="refresh" content="0; url='+lien+'">')
print('</head>')
#print('<body onload="window.close();">')
#print('<body onload="window.location = \''+lien+'\'">') ok
print('<body>')
#print('<script>')
#print('  window.addEventListener("load", function(event) {')
#print('    window.open(\''+lien+'\');')
#print('    window.close();')
#print('  });')
#print('</script>')



print('</body>')
print('</html>')
#print('<body><p>Vos fichiers sont pr&ecirc;ts &agrave; &ecirc;tre t&eacute;l&eacute;charger</p>')
#print('<p>Cliquez sur ce <a href="'+lien+'" download="'+zipid+'">lien</a> pour les stcocker sur votre ordinateur</p></body></html>')

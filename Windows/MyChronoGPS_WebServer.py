#!/usr/bin/env python3
# coding: utf8
#from http.server import CGIHTTPRequestHandler, HTTPServer
import http.server

import os, sys


port = 8080
ip = '127.0.0.1'
adresseserveur = (ip, port)
serveur = http.server.HTTPServer 
gestionnaire = http.server.CGIHTTPRequestHandler
gestionnaire.cgi_directories = ["/ajax"]

#repertoire = './www'
#repertoire = 'www'


def main():
    try:
        #os.chdir(repertoire)
        #serveur = HTTPServer((ip, port), CGIHTTPRequestHandler)
        httpd = serveur(adresseserveur, gestionnaire)
        print("Démarrage du serveur CGI: http://{}:{}".format(
            ip, port)
        )
        #serveur.serve_forever()
        httpd.serve_forever()
    except FileNotFoundError as e:
        #sys.stderr.write("ERREUR! Le répertoire '{}' n'existe pas!\n".format(repertoire))
        sys.stderr.write("ERREUR! Le fichier n'existe pas!\n")
        raise e
    except KeyboardInterrupt:
        #serveur.socket.close()
        httpd.socket.close()


if __name__ == '__main__':
    main()

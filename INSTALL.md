MyChronoGPS
==
Installation du Logiciel
-
MyChronoGPS fonctionne sur des Raspberry 2,3,4 et zero
Les rpi 3 et au delà ou zeroW v2 sont recommandés 

### Préparation de la carte SD #
La préparation de la carte SD s'effectue avec l'outil Pi Imager.
A partir d'un PC Windows, télécharger Raspberry Pi Imager et l'installer.
A partir d'un Raspberry, Pi Imager est déjà installé.

#### Liste des actions
- Lancez Pi Imager
- Choisissez l'OS selon le Raspberry destiné à accueillir MyChronoGPS (32-bit tout type de rpi, 64-bit rpi 3,4,400) de préférence avec l'environnement de bureau.
- Allez dans les paramètres de Pi Imager et effectuez les actions
	- Cochez la case Enable SSH
		(La case Username and password est automatiquement cochée)
	- Laissez Username à **pi** et entrez le password, **chrono** par exemple, notez le password.
	- Cochez la case Configure wireless LAN et entrez les paramètres de votre réseau Wifi local.
	- Cochez la case Set locale settings et entrez votre zone géographique et le type de clavier.
	- Sauvegardez les paramètres.
- Installez la carte SD dans le lecteur et Allez dans Choose Storage.
	Le lecteur est automatiquement sélectionné, s'il y en a plusieurs choisir le lecteur dans lequel la carte SD cible est installée.
- Retirez la carte SD et installez-là dans le Raspberry cible.

### Installation de la carte SD #
La suite de l'installation s'effectue à partir du rpi ou via une connexion ssh.
- Installez la carte SD dans le lecteur du Raspberry cible.
- Démarrez le Raspberry.

### Verification et/ou Configuration du Raspberry
Passer la commande :
{% highlight shell_session %}
	$ sudo raspi-config
{% endhighlight %}

Allez dans
3 - Interface Options
	P5 I2C => Oui
	P6 Serial Port => shell:non / serial port hardware:oui

A la fin de la configuration faire un reboot
{% highlight shell_session %}
	$ sudo reboot
{% endhighlight %}

Installer les outils I2C pour Python (déjà installé sur les versions récentes)
Mettre à jour le système (s'il y a longtemps que ça n'a pas été fait)
{% highlight shell_session %}
	$ sudo apt update
	$ sudo apt upgrade -y
{% endhighlight %}

Une fois le système mis à jour, lancez l’installation des outils permettant de communiquer avec les périphériques i2c en Python (python-smbus).
{% highlight shell_session %}
	$ sudo apt-get install -y python-smbus
{% endhighlight %}

Les outils de diagnostic (i2c-tools) sont déjà installés.
Si ce n'est pas le cas,
{% highlight shell_session %}
	$ sudo apt-get install -y i2c-tools
{% endhighlight %}

L’installation terminée, on peut déjà tester si les modules sont bien chargés

Vérifier l’adresse du périphérique avec i2cdetect
{% highlight shell_session %}
	$ sudo i2cdetect -y 1 # pour les anciens modèles : sudo i2cdetect -y 0
{% endhighlight %}

Si pip n'est pas installé, l'installer en passant les commandes
{% highlight shell_session %}
	$ sudo apt-get update
	$ sudo apt-get install python-pip
{% endhighlight %}

Si besoin, installer l'interface série
{% highlight shell_session %}
	$ sudo pip install pyserial
	$ sudo pip install gpio
{% endhighlight %}


Ensuite, il est nécessaire d'installer un serveur web pour avoir accès aux outils de visualisation des sessions et de la gestion des circuits.
Il est également nécessaire pour l'affichage du tableau de bord sur un écran LCD. 

Installation de MyChronoGPS sur le rpi
--------------------------------------

A partir du dossier /home/pi lancez les commandes suivantes :
{% highlight shell_session %}
	$ sudo rm -rf MyChronoGPS
	$ git clone https://github.com/jfk93-fr/MyChronoGPS.git
	$ chmod -R 755 MyChronoGPS
	$ cd MyChronoGPS/
{% endhighlight %}

La procédure d'installation proprement dite de MyChronoGPS s'effectue par la commande :
{% highlight shell_session %}
	$ sh MyChronoGPS.sh 
{% endhighlight %}

Plusieurs questions sont posées.
Si Lighttpd n'est pas installé, la procédure d'installation demande si on doit l'installer, c'est préférable, aussi répondre **Y**

La procédure d'installation demande si on doit changer les droits de **www-data** dans visudo.
Si Lighttpd est installé, répondre **Y**

La procédure d'installation demande si on a une clé API pour GoogleMaps et si on veut l'utiliser.
Si oui, le fichier key.js est édité et il faut remplacer {% highlight shell_session %}'Your_API_Key'{% endhighlight %} par la valeur de votre clé.

A la fin de l'installation, redémarrer le système
{% highlight shell_session %}
	$ sudo reboot
{% endhighlight %}

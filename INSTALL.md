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

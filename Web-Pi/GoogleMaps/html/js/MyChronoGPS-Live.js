var latitude     = '';
var longitude    = '';

var FL;
var Int1;
var Int2;
var Int3;
const π = Math.PI;

var objStart = new Object(); // Tableau des coordonnées de la ligne de départ
var Tabint = new Array(); // Tableau des coordonnées des intérmédiaires (partiels)
var objPitIn = new Object(); // Tableau des coordonnées de l'entrée de la pitlane
var objPitOut = new Object(); // Tableau des coordonnées de la sortie de la pitlane
var pitDef = false; // indicateur pitlane définie oui/non
var inPit = false; // indicateur dans pitlane oui/non
var pitcap = 0; // cap de la pitlane

var thisCircuit;
var dateSession = false;

var FirstPoint = false; // points gps de départ ou de début de tour
var Point0 = false; // points gps précédent
var Point1 = false; // points gps actuel

var time_start = false;
var time_arrival = false; 
var time_sect = new Array(false,false,false);
var time_prev = new Array(false,false,false);
var vmax = 0;
var timeLap = "";
var timecut = 0;
var icut = 0;
var timeSect = new Array();
var Chrono = new Array(); // tableau pour afficher les chronos précédents sur le tableau de bord (jusqu'à 5)

var marktemp = '';
var tabMarktemp = new Array();
var tabLinetemp = new Array();
var imark = 0;

var Colors = ['khaki','aqua','blue','red','green','indigo','yellow','orange','pink','brown','lime','cyan','purple','teal'];
var nb_colors = Colors.length;

//////////////////////////////////////////////////////

var currentmarker = '';
var circle = '';
var timer = '';
var retour_geolocation = false;

var lat;
var lng;

var zoomfr = 6; // zoom initial pour afficher la France dans la map
// le centre de la France !
var latfr = 46.71488676953859;
var lngfr = 2.6913890507936644;

// Rayon de la terre en mètres (sphère IAG-GRS80)
var RT = 6378137;

var largeur_piste = 15; // largeur de la piste en mètre; utilisée pour déterminer le franchissement du point de départ

var map = false;
var tab_marker=new Array();

var NewCircuit = false;

var icon_image_on="Icones/finish-bleu.png";
var icon_image_off="Icones/finish-noir.png";

var icon_image=icon_image_off;

var nbw = 0;

// variables du simulateur
var is_simu = false;
var simupoint = 0;
var simu_sens = 1;
var simu_freq = 1;
var simuline = "";
var simup0 = "";
var simup1 = "";
var playmotion = true;
var dashboard_time = "00:00:00";
var simucycle = 10; // nombre de cycles avant changement des informations du tableau de bord (L1 uniquement)
var dashboard_cycle = 0; // compteur de cycles
var tabShow = new Array(); // pile des tours à montrer
const gravit = 9.80665;
var gkmh = (gravit * 3600)/ 1000;
var Frequence = 1; // fréquence d'échantillonage du GPS

var mobpoint = "";
var vitessep0 = 0;
var play_live = true;

loadCircuits();

function dataCircuitsReady() {
	if (typeof(Circuit) != 'object') {
		var el = document.getElementById("zone-info");
		if (el) {
			el.innerHTML = 'problème détecté';
			el.innerHTML = Circuit;
		}
		return false;
	}
	
	loadLiveCoords();
}	

function dataLiveReady() {
	document.getElementById('live').style.display = 'none';
	is_map_ready();
}	

function is_map_ready() {
	if (nbw > 20) {
		alert("googlemap ne semble pas démarrer, vérifier votre connexion internet");
		return;
	}
	nbw++;
	if (!map) {
		timer = setTimeout(is_map_ready, 1000);
	}
	else {
		clearTimeout(timer);
		go();
	}
}

// Initialize API Googlemap
function initGooglemap() {
  document.getElementById('map').style.display = 'block';
  map = true;
}
// Initialize and add the map
function initMap() {
	if (thisCircuit.Latcenter === false) {
		if (!thisCircuit.Latitude) {
			thisCircuit.Latitude = thisCircuit.FL[0];
		}
		thisCircuit.Latcenter = thisCircuit.Latitude;
	}
	if (thisCircuit.Loncenter === false)     {
		if (!thisCircuit.Longitude) {
			thisCircuit.Longitude = thisCircuit.FL[1];
		}
		thisCircuit.Loncenter = thisCircuit.Longitude;
	}
	lat = thisCircuit.Latcenter*1;
	if (!lat)
		lat = thisCircuit.Latitude;
	lon = thisCircuit.Loncenter*1;
	if (!lon)
		lon = thisCircuit.Longitude;

	lat = thisCircuit.Latitude*1;
	lon = thisCircuit.Longitude*1;

	if (lat*lon == 0) {
		// pas de latitude ou de longitude valide, on va se centrer en France
		lat = latfr;
		lon = lngfr;
		zoom = zoomfr;
	}
	else {
		if (!thisCircuit.Zoom)
			thisCircuit.Zoom = 16;
		var zoom = thisCircuit.Zoom*1;
	}

    optionsMap = {
         zoom: zoom,
         center: new google.maps.LatLng(lat,lon),
         draggableCursor:"crosshair",
         mapTypeId: google.maps.MapTypeId.SATELLITE
    };
	
	map = new google.maps.Map(document.getElementById('map'), optionsMap);
	var markerpoint = {lat: lat, lng: lon};
	currentmarker = new google.maps.Marker({
		position: markerpoint, title: thisCircuit.NomCircuit
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank.png'
		,draggable: true
	});
	var info = 	'<div style="font: 1em \'trebuchet ms\',verdana, helvetica, sans-serif;">' +
				'	<table align="center">' +
				'		<tr>' +
				'			<td colspan="2" align="center">';
	if (thisCircuit.URL) {
		info += '				<a href="'+thisCircuit.URL+'" target="_blank">';
	}
	info += 	'<B>'+thisCircuit.NomCircuit+'</B>';
	if (thisCircuit.URL) {
		info += '</a>';
	}
	info +=		'			</td>' +
				'		</tr>';
	if (thisCircuit.Adresse) {
		info += '		<tr>' +
				'			<td colspan="2" align="center">'+thisCircuit.Adresse+'</td>' +
				'		</tr>' +
				'		<tr>' +
				'			<td>'+thisCircuit.CodePostal+'</td><td>'+thisCircuit.Ville+'</td>' +
				'		</tr>' +
				'		<tr>' +
				'			<td colspan="2" align="center">'+thisCircuit.LongCircuit+' m</td>' +
				'		</tr>';
	}
	info +=		'	</table>' +
				'</div>';
	
	infoBulle = new google.maps.InfoWindow({
		content: info
	});
	
	google.maps.event.addListener(currentmarker, 'mouseover', function() {
		document.getElementById("zone-info").innerHTML = '<B>'+thisCircuit.NomCircuit+'</B>';
	});

	google.maps.event.addListener(currentmarker, 'click', function() {
  	    infoBulle.open(map, currentmarker);
	});

	google.maps.event.addListener(map, 'mousemove', function(event) {
		mouseMove(event);
	});

	google.maps.event.addListener(map, 'center_changed', function(event) {
		var center = map.getCenter();
		el = document.getElementById("Latcenter");
		if (el)
			el.value = center.lat();
		el = document.getElementById("Loncenter");
		if (el)
			el.value = center.lng();
	});

	google.maps.event.addListener(map, 'zoom_changed', function(event) {
		var zoom = map.getZoom();
		el = document.getElementById("Zoom");
		if (el)
			el.value = zoom;
	});

	currentmarker.setMap(map);
	
	showLines();
	
}


function point2Line(line) {
	var obj = false;
	if (line > 0) {
		if (Tabint[line-1])
			obj = Tabint[line-1];
	}
	if (line == 0)
		obj = objStart;
	if (line == -1)
		obj = objPitIn;
	if (line == -2)
		obj = objPitOut;
	
	if (obj.line) {
		setCenter(obj.coord[0],obj.coord[1]); // maintenant, on fait juste un recentrage sans changer le zoom
		return;
	}	
}

function resetScreen() {
	// On recentre la map avec le zoom d'origine
	var zoom = thisCircuit.Zoom*1;
	map.setZoom(zoom);
	lat = thisCircuit.Latcenter*1;
	lon = thisCircuit.Loncenter*1;
	var googleLatLng = new google.maps.LatLng(lat,lon); 
	map.setCenter(googleLatLng);
}

function setCenter(zlat=thisCircuit.Latcenter*1,zlon=thisCircuit.Loncenter*1) {
	var googleLatLng = new google.maps.LatLng(zlat,zlon); 
	map.setCenter(googleLatLng);
}
function setMaxZoom(zlat=thisCircuit.Latcenter*1,zlon=thisCircuit.Loncenter*1,max=20) {
	setCenter(zlat,zlon);
	var oldz = map.getZoom();
	var newz = oldz + max;
	if (newz !='NaN') {
		map.setZoom(newz);
	}
}
function setOriginZoom(zlat=thisCircuit.Latcenter*1,zlon=thisCircuit.Loncenter*1,max=20) {
	var newz = thisCircuit.Zoom*1;
	setCenter(zlat,zlon);
	if (newz !='NaN') {
		map.setZoom(newz);
	}
}

function accueil() {
	document.getElementById('live').style.display = 'none';
	objStart = new Object(); // Tableau des coordonnées de la ligne de départ
	Tabint = new Array(); // Tableau des coordonnées des intérmédiaires (partiels)
	objPitIn = new Object(); // Tableau des coordonnées de l'entrée de la pitlane
	objPitOut = new Object(); // Tableau des coordonnées de la sortie de la pitlane
}

function go()
{
	if (timer) {
		clearTimeout(timer);
	}
	document.getElementById('live').style.display = 'block';
	// la première ligne du fichier, contient normalement le circuit sur lequel le live a été enregistré

	if (!Array.isArray(Live)) {
		// on n'a pas réussi à charger les coordonnées
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = 'problème détecté';
			el.innerHTML = Live;
		return false;
	}

	Ev = eval(Live[0]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les coordonnées
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = retour.msgerr;
		// tout recommencer dans quelques secondes
		timer = setTimeout(go, 3000);	
		return false;
	}
	
	if (Ev.circuit) {
		thisCircuit = Ev.circuit[0];
		thisPoint = Ev.point[0];
		thisCircuit.altitude = thisPoint.altitude;
		thisCircuit.cap = thisPoint.cap;
		thisCircuit.lap = thisPoint.lap;
		thisCircuit.neartrk = thisPoint.neartrk;
		thisCircuit.pointgps = thisPoint.pointgps;
		thisCircuit.timestamp = thisPoint.timestamp;
		thisCircuit.vitesse = thisPoint.vitesse;
	}
	else {
		thisCircuit = Ev[0];
		thisPoint = Ev[0];
	}

	if (thisCircuit.date)
		dateSession = thisCircuit.date;
	
	var is_FL = thisCircuit.hasOwnProperty('FL');

	if (!thisCircuit.timestamp) {
		Ev = eval(Live[1]);
		Point1 = Ev[0];
	}
	else {
		Point1 = thisPoint;
	}

	// on va chercher le circuit correspondant
	latitude = Point1.pointgps[0];
	longitude = Point1.pointgps[1];
	
	var trackfound = scanCircuit();
	
	//
	// si le circuit existe dans la première ligne du fichier et qu'on a trouvé la définition de la ligne de départ/arrivée,
	// on prend les coordonnées inscrites pour afficher la map.
	// sinon, on utilise le point gps indiqué dans la première ligne du fichier pour rechercher le circuit.
	if (trackfound)
		initCircuit(trackfound); // on complète les informations du circuit avec les données lues dans la base
	else {
		if (thisCircuit.hasOwnProperty('FL')) {
			thisCircuit.Latitude = thisCircuit.FL[0];
			thisCircuit.Longitude = thisCircuit.FL[1];
		}
		else {
			thisCircuit.Latitude = thisCircuit.pointgps[0];
			thisCircuit.Longitude = thisCircuit.pointgps[1];
		}
		thisCircuit.Latcenter = thisCircuit.Latitude;
		thisCircuit.Loncenter = thisCircuit.Longitude;
	}

	initMap();
	
	displayMap();
	
	showMobile();
}

function initCircuit(track) {
	if (!thisCircuit) // si le nom du circuit est absent alors on réinitialise complètement l'objet circuit
		thisCircuit = new Object();
	for (property in track) {
		if (!thisCircuit[property])
			thisCircuit[property] = track[property];
	}
}

function scanCircuit() {
	var trackfound = false;
	if (Circuit == false)
		return trackfound
	if (Circuit.msgerr != '')
		return trackfound
	// on scrute les circuits
	for (var i=0; i < Circuit.circuits.length; i++) {
		if (Circuit.circuits[i].Latitude) {
			distcir = distanceGPS(new Array(latitude,longitude),new Array(Circuit.circuits[i].Latitude,Circuit.circuits[i].Longitude));
			if (distcir < 1000) {
				trackfound = Circuit.circuits[i];
				var el = document.getElementById('NomCircuit');
				if (el)
					el.innerHTML = Circuit.circuits[i].NomCircuit;
			}
		}
	}
	return trackfound;
}

function drawLine(objline) {
	// si les coodonnées du segment de droite sont fournies, on trace le segment de droite avec ces coordonnées
	// sinon, on trace un segment de droite avec les coordonnées de son milieu selon le cap fourni
	if (objline.coord)
		drawLineWithCoord(objline)
	else
		drawLineWithCap(objline)
}

function drawLineWithCoord(objline) {
	// on va tracer un segment de droite à partir des coordonnées de ses extrémités

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: objline.color,
		//strokeColor: "black",
		strokeOpacity: 1.0,
		strokeWeight: 5
	});
	objline.line.setMap(map);
}

function drawLineWithCap(objline) {
	// on va tracer un segment de droite à partir de son milieu et en utilisant le cap fourni 
	
	// on recherche le point B à 50 mètres du point A selon le cap fourni
	var dist = 50; // 50m
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);	
	var A = new Array(objline.lat,objline.lon);

	// On trace une ligne passant par le point start, perpendiculaire à la droite point start;point gps et 2 points (P1;P-1)
	// situés de part et d'autre du point start à une distance égale à la largeur de la piste
	// pour ne pas déborder dans la pitlane, on ne va prendre que 60% de la largeur de la piste
	var lgp = largeur_piste * 0.6;
	var icoord = getPerpendiculaire(A,B);
	var coord1 = pointDroite(A,new Array(icoord[0],icoord[1]),lgp); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 
	var coord2 = pointDroite(A,new Array(icoord[2],icoord[3]),lgp); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 

	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de
	if (Array.isArray(icoord)) {
		var pathCoordinates = [{lat: coord1[0], lng: coord1[1]},{lat: coord2[0], lng: coord2[1]}];
		objline.line = new google.maps.Polyline({
			path: pathCoordinates,
			geodesic: true,
			strokeColor: objline.color,
			strokeOpacity: 1.0,
			strokeWeight: 5
		});
		objline.line.setMap(map);
	}
	objline.coord = new Array(coord1[0],coord1[1],coord2[0],coord2[1]);
}

function designCut(parm) {
	var linecoord = parm.linecoord; // coordonnées de la ligne à couper
	var segcoords = parm.segcoords; // coordonnées du segment qui coupe la ligne
	var tdeb = parm.tdeb;
	var tfin = parm.tfin;
	var dt0 = parm.dt0;
	var dt1 = parm.dt1;
	var v0 = parm.v0;
	var v1 = parm.v1;
	
	var linecut = isLineCut(linecoord,segcoords);
	
	if (linecut) {
		// On va calculer les distances entre le point, le point b et la ligne franchie
		var dist0 = getDistanceLine(linecoord,new Array(segcoords[0],segcoords[1]));
		var distseg = distanceGPS(new Array(segcoords[0],segcoords[1]),new Array(segcoords[2],segcoords[3]))
		var dist1 = getDistanceLine(linecoord,new Array(segcoords[2],segcoords[3]));
		
		var pointCut = getIntersection(linecoord,segcoords);

		var corrtime = dt1.getTime() - dt0.getTime();
		var vmoy = (v0+v1)/2;
		var dc0 = dist0*(v1/vmoy);
		var dc1 = dist1*(v0/vmoy);
		corrtime = corrtime * (dc0/(dc0+dc1));
		corrtime = Math.round(corrtime);
		
		if (!tdeb) {
			tdeb = dt0.getTime() + corrtime;
		}
		else {
			var tfin = dt0.getTime() + corrtime;
		}
	}
	var retour = new Object();
	retour.linecut = linecut;
	retour.pointCut = pointCut;
	retour.tdeb = tdeb;
	retour.tfin = tfin;
	return retour;
}

//
// Affichage des différents onglets
function displayMap() {
	resizeMap();
}

function showMobile() {

	var cap = Point1.cap;
	// on efface la précédente représentation du mobile
	if (mobpoint != '') {
		mobpoint.setMap(null);
		mobpoint = '';
	}
	if (latitude*longitude == 0) {
		latitude = latfr;
		longitude = lngfr;
	}
	else {
		var zoom = map.getZoom();
		if (zoom <= zoomfr) {
			zoom = zoom + 10;//jfk
			map.setZoom(zoom);
		}
	}
		
	var markerpoint = {lat: latitude, lng: longitude};
	mobpoint = new google.maps.Marker({
		position: markerpoint, 
		title: 'v:'+Math.round(Point1.vitesse)+'km/h\r\n'+
               'cap:'+Math.round(Point1.cap*10)/10+'° '
		,icon: {
			path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
			rotation: cap,
			fillColor: "cyan",
			fillOpacity: 0.8,
			scale: 5,
			strokeColor: "gold",
			strokeWeight: 2,

			}
		});
	mobpoint.setMap(map);
	setCenter(latitude, longitude)	;
	
	// si c'est pas le premier point, on va forcer le point précédent à la même valeur
	// les calculs différentiels sont faussés mais ça ne devrait pas avoir d'incidence
	// sur l'affichage du tableau de bord
	if (!Point0) {
		Point0 = Point1;
		FirstPoint = Point0;
	}
	
	var altitude = Point1.altitude;
	var timestamp = Point1.timestamp;

	
	// calcul des temps de coupure et autres
	if (latitude != 0) // si latitude = 0 on n'a pas encore reçu de point gps valide
		computeTimes();
	
	if (inPit) {
		// affichage du tableau de bord lorsque le mobile est dans la pitlane
		displayPitboard();
	}
	else {
		// affichage du tableau de bord lorsque le mobile est en piste
		displayDashboard();
	}

	// affichage des chronos précédents
	for (var i=0; i < 4; i++) {
		var el = document.getElementById("C"+i);
		if (el) {
			el.innerHTML = "&nbsp;";
		}
	}
	if (Chrono.length > 0) {
		var j = Chrono.length-1;
		for (var i=0; i < 4; i++) {
			if (j > - 1) {
				var el = document.getElementById("C"+i);
				if (el) {
					el.innerHTML = Chrono[j];
				}
			}
			j = j-1;
		}
	}
		
	
	// on va réserver le point pour les prochains calculs
	Point0 = new Object();
	Point0.timestamp = Point1.timestamp;
	Point0.pointgps = Point1.pointgps;
	Point0.vitesse = Point1.vitesse;
	Point0.altitude = Point1.altitude;
	Point0.cap = Point1.cap;

	// aller vers le prochain point
	timer = setTimeout(getNextPoint, 1000);	
}

// affichage du tableau de bord lorsque le mobile est en piste
function displayDashboard() {
	// calcul de l'accélération
	var accel = (Point1.vitesse - Point0.vitesse) / gkmh;
	// affichage du compteur
	// L0 = heure GPS
	var el = document.getElementById("L0");
	if (el) {
		el.innerHTML = formatTimestamp(Point1.timestamp);
	}
	// L1 = temps Chrono (en cours où à la coupure de ligne)
	if (timecut > 0) {
		// une ligne à été coupée, on affiche le temps à la coupure
		if (icut == 0) {
			dashboard_time = timeLap;
		}
		else {
			var i=icut - 1;
			dashboard_time = timeSect[i];
		}
		dashboard_cycle = simucycle;
	}
	else {
		if (dashboard_cycle == 0) {
			var T0 = getObjTime(FirstPoint.timestamp);
			var T1 = getObjTime(Point1.timestamp);
			var dT = T1.getTime() - T0.getTime();
			dashboard_time = formatMMSS(dT);
		}
	}
	if (dashboard_cycle > 0) {
		--dashboard_cycle;
	}
	var el = document.getElementById("L1");
	if (el) {
		el.innerHTML = dashboard_time;
	}
	//
	var el = document.getElementById("L2");
	if (el) {
		el.innerHTML = Math.round(Point1.vitesse)+" km/h";
	}
	//
	// on efface la led de pitlane
	var led = document.getElementById('ledw');
	if (led)
		led.className = 'w3-row';
	//
	// affichage des Leds (verte = accélération, orange-rouge = décélération/freinage)
	var led = document.getElementById('led');
	if (led)
		led.className = 'w3-row led-blue-off';
	if (Point1.vitesse > Point0.vitesse) // accélération
		led.className = 'w3-row led-green-on';
	if (Point1.vitesse < Point0.vitesse) {
		// décélération
		var iaccel = Math.round(accel*-10);
		if (iaccel > 9)
			iaccel = 9;
		var class_accel = 'w3-row led-0'+iaccel;
		led.className = class_accel;
	}
}

// affichage du tableau de bord lorsque le mobile est dans la pitlane
function displayPitboard() {
	// affichage du compteur
	// L0 = heure GPS
	var el = document.getElementById("L0");
	if (el) {
		el.innerHTML = formatTimestamp(Point1.timestamp);
	}
	var el = document.getElementById("L1");
	if (el) {
		if (Point1.vitesse > 60) {
			el.innerHTML = 'Too Fast';
		}
		else {
			el.innerHTML = 'Slow';
		}
	}
	//
	var el = document.getElementById("L2");
	if (el) {
		el.innerHTML = Math.round(Point1.vitesse)+" km/h";
	}
	//
	// on efface la led du tableau de bord
	var led = document.getElementById('led');
	if (led)
		led.className = 'w3-row';
	//
	// affichage de la Led Rouge (off: normal fast-blink: attention)
	var led = document.getElementById('ledw');
	if (led)
		led.className = 'w3-row led-green-on';
	if (Point1.vitesse > 60) { // trop vite !
		led.className = 'led-red-blitz-blink';
		setTimeout(stop_blink, 1200);
	}
}

function stop_blink() {
	var led = document.getElementById('ledw');
	led.className = 'led-green-on';
}

// pause-play 
function switchLive() {
	var el = document.getElementById('pause-play');
	if (timer)
		clearTimeout(timer);
	if (play_live) {
		play_live = false;
		if (el)
			el.innerHTML = '>';
	}
	else {
		play_live = true;
		if (el)
			el.innerHTML = '[]';
		isPointReady();
	}
}

// Rechercher le prochain point
function getNextPoint() {
	if (timer) {
		clearTimeout(timer);
	}
	var proc = fonction_get+"?nocache=" + Math.random()
	loadLiveAjax(proc);
	isPointReady();
}

function isPointReady()
{
	if (!Live) {
		live_timer = setTimeout(isLiveReady, 300);
		return;
	}
	clearTimeout(live_timer);

	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	if (!Array.isArray(Live)) {
		// on n'a pas réussi à charger les coordonnées
		var el = document.getElementById("zone-info");
		if (el) {
			el.innerHTML = 'problème détecté';
		}
		// aller vers le prochain point
		timer = setTimeout(getNextPoint, 1000);
		return false;
	}

	Ev = eval(Live[0]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les coordonnées
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = retour.msgerr;
		// aller vers le prochain point
		timer = setTimeout(getNextPoint, 1000);	
		return false;
	}

	if (Ev.circuit) {
		thisCircuit = Ev.circuit[0];
		thisPoint = Ev.point[0];
		thisCircuit.altitude = thisPoint.altitude;
		thisCircuit.cap = thisPoint.cap;
		thisCircuit.lap = thisPoint.lap;
		thisCircuit.neartrk = thisPoint.neartrk;
		thisCircuit.pointgps = thisPoint.pointgps;
		thisCircuit.timestamp = thisPoint.timestamp;
		thisCircuit.vitesse = thisPoint.vitesse;
	}
	else {
		thisCircuit = Ev[0];
		thisPoint = Ev[0];
	}

	if (thisCircuit.date)
		dateSession = thisCircuit.date;
	
	var is_FL = thisCircuit.hasOwnProperty('FL');

	if (!thisCircuit.timestamp) {
		Ev = eval(Live[1]);
		Point1 = Ev[0];
	}
	else {
		//Point1 = Ev[0];
		Point1 = thisPoint;
	}

	latitude = Point1.pointgps[0];
	longitude = Point1.pointgps[1];
	
	if (!objStart.hasOwnProperty('coord'))
		showLines();

	showMobile();
	
}

function computeTimes() {
	var segcoords = new Array(); // lat point a,lng point a,lat point b,lng point b

	var pointCut = false;
	
	var geocoords = new Array();
	var pcoord = new Object();
	pcoord.lat = Point0.pointgps[0];
	pcoord.lng = Point0.pointgps[1];

	segcoords.push(pcoord.lat);
	segcoords.push(pcoord.lng);
	segcoords.push(Point1.pointgps[0]);
	segcoords.push(Point1.pointgps[1]);

	var dt0 = getObjTime(Point0.timestamp);
	var dt1 = getObjTime(Point1.timestamp);
		
	if (Point1.vitesse > vmax)
		vmax = Point1.vitesse;

	var v0 = Point0.vitesse;
	var v1 = Point1.vitesse;
		
	timecut = 0;
	icut = 0;

	// toutes les coordonnées du segment sont définies, on regarde s'il coupe une ligne
	// on commence par la pitlane si elle est définie
	//
	if (pitDef) {
		var linecut = isLineCut(objPitIn.coord,segcoords);
		if (linecut) {
			inPit = true;
		}
		else {
			if (isLineCut(objPitOut.coord,segcoords)) {
				inPit = false;
			}
		}
	}

	// ensuite on regarde la ligne de départ/arrivée
	var latlng = new google.maps.LatLng(pcoord.lat, pcoord.lng);
	if (objStart.hasOwnProperty('coord')) {
		var parmCut = new Object();
		parmCut.linecoord = objStart.coord;
		parmCut.segcoords = segcoords;
		parmCut.tdeb = time_start;
		parmCut.tfin = time_arrival;
		parmCut.dt0 = dt0;
		parmCut.dt1 = dt1;
		parmCut.v0 = v0;
		parmCut.v1 = v1;
		var Tcut = designCut(parmCut);
		if (Tcut.linecut) {
			inPit = false;
			pointCut = Tcut.pointCut;
			time_start = Tcut.tdeb;
			time_arrival = Tcut.tfin;
			time_prev[0] = time_start;
			timecut = time_arrival - time_start;		
			// s'il s'agit d'un point de coupure, on l'indique dans le chemin
			var latlng = new google.maps.LatLng(pointCut[0], pointCut[1]);
			var CP = getIntersectionSphere(parmCut.linecoord,parmCut.segcoords);
			FirstPoint = Point0;
		}
	}
	geocoords.push(latlng);

	// et on continue par les lignes intermédiaires tant qu'il y en a
	for (var j=0; j < Tabint.length; j++) {
		if (Tabint[j].coord) {
			var parmCut = new Object();
			parmCut.linecoord = Tabint[j].coord;
			parmCut.segcoords = segcoords;
			parmCut.tdeb = time_prev[j];
			parmCut.tfin = time_sect[j];
			parmCut.dt0 = dt0;
			parmCut.dt1 = dt1;
			parmCut.v0 = v0;
			parmCut.v1 = v1;
			var Tcut = designCut(parmCut);
			if (Tcut.linecut) {
				inPit = false;
				pointCut = Tcut.pointCut;
				time_sect[j] = Tcut.tfin;
				k = j+1;
				if (k < Tabint.length)
					time_prev[k] = Tcut.tfin;
					timecut = time_sect[j] - time_prev[j];		
					icut = j+1;		
			}
		}
	}

	// si un temps de coupure est présent, on stocke l'information
	// on commence par la ligne de départ-arrivée
	if (time_arrival) {
		var time_lap = time_arrival - time_start;
		timeLap = formatMMSS(time_lap);
		Chrono.push(timeLap);
		time_start = time_arrival;
	}
	// on continue avec les lignes intermédiaires
	if (Tabint.length > 0) {
		timeSect = new Array();
	}
	for (var j=0; j < Tabint.length; j++) {
		if (Tabint[j].coord) {
			if (time_sect[j]) {
				var time_sector = time_sect[j] - time_prev[j];
				var time2display = formatMMSS(time_sector);
				timeSect.push(time2display);
				var time_lastsect = time_arrival - time_sect[j];
			}
		}
	}
	if (j>0) {
		var time2display = formatMMSS(time_lastsect);
		timeSect.push(time2display);
	}

	if (time_arrival) {
		time_prev[0] = time_arrival;
		time_arrival = false;
	}
}

// retourne le temps au format MM:SS.ss
function formatMMSS(temps) {
	var cnow;
	cnow = new Date(temps);
	var ch=parseInt(cnow.getHours()) - 1;
	var cm=cnow.getMinutes();
	var cs=cnow.getSeconds();
	var cms=cnow.getMilliseconds()/10;
	cms = Math.floor(cms);
	if (cms>99) cms=0;
	if (cms<10) cms="0"+cms;
	if (cs<10) cs="0"+cs;
	if (cm<10) cm="0"+cm;
	var hhmmss = cm+":"+cs+"."+cms;
	return (hhmmss);
}

// retourne le timestamp au format HH:MM:SS
function formatTimestamp(temps) {
	var A = temps.split('.');
	retour = A[0].substr(0,2)+':'+A[0].substr(2,2)+':'+A[0].substr(4,2);
	return retour;
}

function degrees_to_decimal(coord, hemisphere) {
	//$GPRMC,083000.00,A,4814.49972,N,00400.01847,E,69.161,124.02,240620,,,A*5D

	degmin = coord.split('.');
	degrees = degmin[0].substr(0,degmin[0].length-2);
	minutes = degmin[0].substr(degmin[0].length-2);
	minutes += "."+degmin[1];
	degrees = degrees*1
	minutes = minutes/60

    output = degrees + minutes
    if (hemisphere == 'N' || hemisphere == 'E')
        return output
    if (hemisphere == 'S' || hemisphere == 'W')
        return -output
}

function getObjTime(t) {
	if (!dateSession) {
		var dtnow = new Date();
		var i = dtnow.getMonth();
		var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
		var d = dtnow.getDate();
		if (d < 10)
			d = '0'+d;
		dateSession = d+'/'+months[i]+'/'+dtnow.getFullYear();
	}
	var dt = dateSession;
	syy = dt.substr(6,4);
	smm = dt.substr(3,2);
	sdd = dt.substr(0,2);
	var tt = t.split('.');
	sh = tt[0].substr(0,2);
	sm = tt[0].substr(2,2);
	ss = tt[0].substr(4,2);
	sms = tt[1];
	ObTime = new Date(syy*1, (smm*1)-1, sdd*1, sh*1, sm*1, ss*1, sms*1);
	return ObTime;
}
	
function mouseMove(mousePt) {
	mouseLatLng = mousePt.latLng;
	var mouseCoord = mouseLatLng.toUrlValue();
	var mouseLat = mouseLatLng.lat();
	var mouseLon = mouseLatLng.lng();
	
	var oStatusDiv = document.getElementById("LatLng")	
	if (oStatusDiv) {
		oStatusDiv.value  = mouseLat + ',' + mouseLon;
	}
	document.getElementById("zone-info").innerHTML = '';
}

function writeMessage(text_mess,time_mess=1) {
	var delay = 1000;
	var el_message = document.getElementById('zone-info');
	el_message.style.display = 'block';
	el_message.className = "msg-std";
	el_message.innerHTML = text_mess;
	if (time_mess)
		var delay = time_mess * 1000;
	
	var temp = setInterval( function(){
		el_message.style.display = 'none';
        clearInterval(temp);
      }, delay );
}

function resizeMap() {
	if (!map)
		return;

	var el = document.getElementById("map");
	var largeur = window.innerWidth;
	var hauteur = window.innerHeight;
	
	var hopt = Math.floor((hauteur - el.offsetTop)/4)*4;
	
	if (hopt != el.offsetHeight) {
		el.style.height = hopt+'px';
		el.style.maxHeight = hopt+'px';
	}
}
window.addEventListener('resize', resizeMap);
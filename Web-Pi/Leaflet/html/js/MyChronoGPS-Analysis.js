var fname_save = 'ajax/save_coords.py';
var dataPost = false; // Objet recueillant le formulaire à passer à la procédure ajax d'écriture
var dataReturn;
var coords_save_timer = '';

var curr_coord = 0;
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

var thisCircuit;
var dateSession = false;

var markerA1 = '';
var markerA2 = '';
var segment1 = '';
var markerB1 = '';
var markerB2 = '';
var segment2 = '';
var Tcoord;
var coord;

var Tours = false; // Tableau des Tours
var Tour = false; // Objet tour courant
var Points = false; // Tableau des points gps du tour
var nb_tours = 0;

var markerD1 = '';
var segment0 = '';
var markerD2 = '';
var segment1 = '';
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

var originBounds = false;

document.getElementById('map').style.display = 'block';
map = true;

if (urlvar.hasOwnProperty('analysis')) {
	loadCircuits();
}
else {
	// on ouvre le wrapper pour demander à charger le fichier analysis manuellement
	accueil();
	loadLocalCoords();
}

function dataCircuitsReady() {
	document.getElementById("zone-info").innerHTML = 'les données sont chargées, calcul en cours, veuillez patienter';
	loadCoords();
}	

function dataCoordsReady() {
	doAnalysis();
	is_map_ready();
}	

function is_map_ready()
{
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

// Initialize and add the map
function initMap() {
	if (!thisCircuit.Latcenter) {
		if (!thisCircuit.Latitude) {
			thisCircuit.Latitude = thisCircuit.FL[0];
		}
		thisCircuit.Latcenter = thisCircuit.Latitude;
	}
	if (!thisCircuit.Loncenter)     {
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
		
	if (!thisCircuit.Zoom)
		thisCircuit.Zoom = 16;
	var zoom = thisCircuit.Zoom*1;

	map = L.map('map').setView([lat,lon],zoom);
	
	var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
	Esri_WorldImagery.addTo(map);	
	
	// Assumes your Leaflet map variable is 'map'..
	L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');

	lat = thisCircuit.Latitude*1;
	lon = thisCircuit.Longitude*1;
	var markerpoint = L.latLng(lat,lon);
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

	currentmarker = new L.Marker(markerpoint,{draggable:true}).bindPopup(info);
	map.addLayer(currentmarker);	
	
	currentmarker.on('mouseover', function() {
		document.getElementById("zone-info").innerHTML = '<B>'+thisCircuit.NomCircuit+'</B>';
	});
	//
	map.on('mousemove', function(ev) {
		mouseMove(ev);
	});
	//
	map.on('contextmenu', function(event) {
		copyClipboard(event);
	});

	showLines();
	
}

function showData() {
	var el;
	el = document.getElementById("NomCircuit");
	if (thisCircuit.NomCircuit) {
		el.value = thisCircuit.NomCircuit;
	}
	else el.style.display = 'none';

	el = document.getElementById("Latitude");
	if (thisCircuit.Latitude) {
		el.value = thisCircuit.Latitude;
	}
	else el.style.display = 'none';

	el = document.getElementById("Longitude");
	if (thisCircuit.Longitude) {
		el.value = thisCircuit.Longitude;
	}
	else el.style.display = 'none';

	el = document.getElementById("LongCircuit");
	if (thisCircuit.LongCircuit) {
		el.value = thisCircuit.LongCircuit;
	}
	else el.style.display = 'none';

	el = document.getElementById("Zoom");
	if (thisCircuit.Zoom) {
		el.value = thisCircuit.Zoom;
	}
	else el.style.display = 'none';

	/* FL en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("FLLat1");
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("FLLon1");
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("FLLat2");
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("FLLon2");
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[3];
	}
	else el.style.display = 'none';

}

function deleteLine(line) {
	document.getElementById("zone-info").innerHTML = '';
	var center = map.getCenter(); // on met de côté le centrage actuel
	// On recentre la map avec le zoom d'origine
	resetScreen();
	
	var obj = getObjLine(line)
	if (!obj)
		return;
	if (!confirm("vous êtes sur le point de supprimer la ligne "+obj.idelem+", voulez-vous ontinuer ?"))
		return;

	// on efface tous les marqueurs
	if (typeof(obj.marker1) != 'undefined') {
		if (obj.marker1 != '') {
			map.removeLayer(obj.marker1);
			obj.marker1 = '';
		}
	}
		
	if (typeof(obj.marker2) != 'undefined') {
		if (obj.marker2 != '') {
			map.removeLayer(obj.marker2);
			obj.marker2 = '';
		}
	}

	if (typeof(obj.line) != 'undefined') {
		if (obj.line != '') {
			map.removeLayer(obj.line);
			obj.line = '';
		}
	}
	// On récrée les objets
	if (line > 0) {
		if (Tabint[line-1])
			Tabint[line-1] = new Object();
	}
	if (line == 0)
		objStart = new Object();
	if (line == -1)
		objPitIn = new Object();
	if (line == -2)
		objPitOut = new Object();
}

// sauvegarde des lignes tracées dans le fichier analysis
function saveLines() {
	var CoordLines = new Object();
	CoordLines.date = thisCircuit.date;
	CoordLines.NomCircuit = thisCircuit.NomCircuit;
	if (typeof(objStart.coord) != 'undefined') {
		CoordLines.FL = objStart.coord;
	}
	if (typeof(objPitIn.coord) != 'undefined') {
		CoordLines.PitIn = objPitIn.coord;
	}
	if (typeof(objPitOut.coord) != 'undefined') {
		CoordLines.PitOut = objPitOut.coord;
	}
	if (Tabint[0]) {
		if (typeof(Tabint[0].coord) != 'undefined') {
			CoordLines.Int1 = Tabint[0].coord;
		}
	}
	if (Tabint[1]) {
		if (typeof(Tabint[1].coord) != 'undefined') {
			CoordLines.Int2 = Tabint[1].coord;
		}
	}
	if (Tabint[2]) {
		if (typeof(Tabint[2].coord) != 'undefined') {
			CoordLines.Int3 = Tabint[2].coord;
		}
	}
	if (Tabint[3]) {
		if (typeof(Tabint[3].coord) != 'undefined') {
			CoordLines.Int4 = Tabint[3].coord;
		}
	}
	// on crée le JSON de la piste à passer en POST
	dataPost = new FormData();	
	dataPost.append('coords',JSON.stringify(CoordLines));

	var proc = fname_save+"?nocache=" + Math.random()+"&analysis="+parmAnalysis
	upLoadLinesAjax(proc);
	
	document.getElementById("zone-info").innerHTML = 'Les données analyse sont en cours de sauvegarde, veuillez patienter';
	isCoordsSaved();
}

function isCoordsSaved()
{
	if (!dataReturn) {
		coords_save_timer = setTimeout(isCoordsSaved, 300);
		return;
	}
	clearTimeout(coords_save_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataCoordsSaved();
}

function dataCoordsSaved() {
	//console.log(JSON.stringify(dataReturn));
	Ev = eval(dataReturn);
	//console.log(JSON.stringify(Ev));
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à sauvegarder les coordonnées
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = retour.msgerr;
		return false;
	}

	var oldCircuit = thisCircuit;
	thisCircuit = Ev[0]; // Mise à jour des données du circuit

	if (!thisCircuit.Latitude) {
		thisCircuit.Latitude = oldCircuit.Latitude;
	}
	if (!thisCircuit.Longitude) {
		thisCircuit.Longitude = oldCircuit.Longitude;
	}
	if (!thisCircuit.Latcenter) {
		thisCircuit.Latcenter = oldCircuit.Latcenter;
	}
	if (!thisCircuit.Loncenter) {
		thisCircuit.Loncenter = oldCircuit.Loncenter;
	}
	
	document.getElementById("zone-info").innerHTML = 'Les données analyse ont été sauvegardée';
}	

function upLoadLinesAjax(proc) 
{
	dataReturn = false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(proc) {
        if (this.readyState == 4) {
			if (this.status == 200) {
				try {
					dataReturn = JSON.parse(this.responseText);
					var el = document.getElementById("zone-info");
					if (el)
						el.innerHTML = "fichier analysis sauvegard&eacute;";
				}
				catch(e) {
							dataReturn = this.responseText;
							var el = document.getElementById("zone-info");
							if (el)
								el.innerHTML = dataReturn;
						}
			}
			else 
			{
				var el = document.getElementById("zone-info");
				if (el)
					el.innerHTML = "fichier " + proc + " non trouv&eacute;";
			}
		}
    }
    xmlhttp.open("POST", proc, true);
    xmlhttp.send(dataPost);
}

function designLine(line) {
	var center = map.getCenter(); // on met de côté le centrage actuel
	// On recentre la map avec le zoom d'origine
	resetScreen();
	
	var obj = getObjLine(line)

	if (obj.coord) {
		var newobj = drawLine(obj);
		return;
	}

	if (obj.marker) {
		setMaxZoom(obj.lat,obj.lon);
		return;
	}
	if (obj.marker1) {
		setMaxZoom(obj.coord[0],obj.coord[1]);
		return;
	}

	obj = new Object();
	// Si la ligne n'existe pas on va la placer là où on était centré
	obj.lat = center.lat;
	obj.lon = center.lng;
	obj.cap = 0;
	if (line == 0) {
		obj.title = "Ligne de départ/arrivée";
		obj.color = "yellow";
		obj.idelem = "FL";
	}
	if (line > 0) {
		obj.title = "Intermédiaire "+line;
		obj.color = "blue";
		obj.idelem = "Int"+line;
	}
	if (line == -1) {
		obj.title = "Pit In";
		obj.color = "orange";
		obj.idelem = "PitIn";
	}
	if (line == -2) {
		obj.title = "Pit Out";
		obj.color = "green";
		obj.idelem = "PitOut";
	}

	var newobj = drawLine(obj);
	if (line > 0) {
		Tabint[line-1] = obj;
	}
	if (line == 0)
		objStart = obj;
	if (line == -1)
		objPitIn = obj;
	if (line == -2)
		objPitOut = obj;

	setMaxZoom(obj.lat,obj.lon,2);
}

function getObjLine(line) {
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
	return obj;
}

function nextCut() {
	if (nb_coords > curr_coord+1) {
		curr_coord++;
		getCoord()
		drawCut();
		setCenter(coord[0],coord[1]);
	}
}

function prevCut() {
	if (curr_coord > 0) {
		curr_coord--;
		getCoord()
		drawCut();
		setCenter(coord[0],coord[1]);
	}
}

function getCoord() {
	Tcoord = Coords[curr_coord].split('/')
	coord = Tcoord[0].split(',')
	coord[0] = coord[0]*1;
	coord[1] = coord[1]*1;
	coord[2] = coord[2]*1;
	coord[3] = coord[3]*1;
	coord[4] = coord[4]*1;
	coord[5] = coord[5]*1;
	coord[6] = coord[6]*1;
	coord[7] = coord[7]*1;
}

function resetScreen() {
	// On recentre la map avec le zoom d'origine
	var zoom = thisCircuit.Zoom*1;
	lat = thisCircuit.Latcenter*1;
	lon = thisCircuit.Loncenter*1;
	map.flyTo([lat,lon],zoom);
}

function setCenter(zlat=thisCircuit.Latcenter*1,zlon=thisCircuit.Loncenter*1) {
	var LatLng = L.latLng(zlat,zlon); 
	map.panTo(LatLng);
}

function setMaxZoom(zlat,zlon,max=20) {
	var el = document.getElementById("map");
	var largeur = window.innerWidth;
	var hauteur = window.innerHeight;
	var corner1 = L.latLng(zlat-0.001, zlon-0.001);
	var corner2 = L.latLng(zlat+0.001, zlon+0.001);
	var bounds  = L.latLngBounds(corner1, corner2);
	var lat1 = corner1.lat;
	var lng1 = corner1.lng;
	var lat2 = corner2.lat;
	var lng2 = corner2.lng;
	var ndifflat = (lat2 - lat1) * (hauteur/largeur);
	map.fitBounds(bounds);
}

function accueil() {
	document.getElementById('wrapper').style.display = 'block';
	document.getElementById('analyzer').style.display = 'none';
	document.getElementById('page-content').style.display = 'none';
	objStart = new Object(); // Tableau des coordonnées de la ligne de départ
	Tabint = new Array(); // Tableau des coordonnées des intérmédiaires (partiels)
	objPitIn = new Object(); // Tableau des coordonnées de l'entrée de la pitlane
	objPitOut = new Object(); // Tableau des coordonnées de la sortie de la pitlane
}

function doAnalysis() {
	document.getElementById('analyzer').style.display = 'none';
	document.getElementById('page-content').style.display = 'block';
}

function go()
{
	document.getElementById('wrapper').style.display = 'none';
	document.getElementById('analyzer').style.display = 'block';
	// la première ligne du fichier, contient normalement le circuit sur lequel les sessions ont été enregistrées

	if (!Array.isArray(Coords)) {
		// on n'a pas réussi à charger les coordonnées
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = 'problème détecté';
		return false;
	}
		
	curr_coord = 0;
	Ev = eval(Coords[curr_coord]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les coordonnées
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = retour.msgerr;
		return false;
	}

	thisCircuit = Ev[0]; // La première ligne contient toujours le nom du circuit

	if (thisCircuit.date)
		dateSession = thisCircuit.date;
	
	// on va construire le tableau des Tours à partir de FL
	FL = new Array(thisCircuit.FL[0]*1,thisCircuit.FL[1]*1,thisCircuit.FL[2]*1,thisCircuit.FL[3]*1);
	buildTours(FL);
	// le tableau des Tours est construit

	var info = "";
	// dès la première ligne du fichier, on va chercher le circuit correspondant
	nb_tours = Tours.length;
	if (nb_tours > 0) {
		var i = 0;
		Tour = Tours[i];
		Points = Tour.points;
		
		// on va déterminer la fréquence d'envoi des trames (généralement entre 1 et 10 Hz)
		var T0 = getObjTime(Points[2].timestamp); // on prend un premier point un peu plus loin que la ligne de coupure
		var T1 = getObjTime(Points[3].timestamp); // car si la ligne est autodéfinie, il peut y avoir un grand écart de temps entre les points 0 & 1
		var dT = T1.getTime() - T0.getTime();
		Frequence = 100/dT;
	
		latitude = Points[0].lat1;
		longitude = Points[0].lon1;
	}
	else {
		info = "pas de tour enregistré dans cette session";
	}
	
	var trackfound = scanCircuit();
	
	//
	// si le circuit existe dans la première ligne du fichier et qu'on a trouvé la définition de la ligne de départ/arrivée,
	// on prend les coordonnées inscrites pour afficher la map.
	// sinon, on utilise le point gps indiqué dans la première ligne du fichier pour rechercher le circuit.
	if (trackfound)
		initCircuit(trackfound); // on complète les informations du circuit avec les données lues dans la base

	initMap();
	
	// Maintenant, on va construire le menu des tours
	// et créer les éléments de design
	var el = document.getElementById("Tours")
	if (!el)
		return;
	el.innerHTML = "";
	for (var i=0; i < Tours.length-1; i++) { // le dernier tour est incomplet, on ne le propose pas
		var tour = Tours[i].id;
		
		if (Tours[i].valid) {
			el.innerHTML += "<a class=\"w3-bar-item w3-button w3-border w3-round\" href=\"#\" onClick=\"showLap("+tour+");\" id=\"buttonlap"+tour+"\">T "+tour;
			el.innerHTML += "<span id=\"timelap"+tour+"\"></span>"+"</a>";
		}
		else {
			el.innerHTML += "<a class=\"w3-bar-item w3-button w3-border w3-round\" href=\"#\" onClick=\"showLap("+tour+");\" id=\"buttonlap"+tour+"\">T "+tour+" invalide"+"</a>";
		}
	}
	
	displayMap()
	document.getElementById("zone-info").innerHTML = '';
}

function buildTours(FL) {
	// on va stocker les données lues tour par tour
	Tours = new Array();
	var tour = 0;
	var np = 0;
	var nt = 0;
	Tour = false;
	curr_coord++;
	var prevTimestamp = false;
	var Point0 = false;
	var Point1 = false;

	// traitement de tous les points gps
	while (curr_coord < nb_coords-1) {
		Point0 = Point1;
		Ev = eval(Coords[curr_coord]);
		Point1 = Ev[0];
		if (!Point0) {
			curr_coord++
			continue;
		}
		var segcoords = new Array(Point0.pointgps[0]*1,Point0.pointgps[1]*1,Point1.pointgps[0]*1,Point1.pointgps[1]*1)
		var pointCut = getIntersection(FL,segcoords);
		
		if (pointCut) {
			if (tour > 0) {
				// on stocke le point après la coupure dans le tour actuel
				Point = new Object();
				Point.timestamp = Point1.timestamp;
				Point.lat1 = Point1.pointgps[0];
				Point.lon1 = Point1.pointgps[1];
				Point.vitesse = Point1.vitesse;
				//Point.altitude = Point1.altitude;
				Point.cap = Point1.cap;
		
				Tour.points.push(Point);
			}

			++tour;
			// On stocke le tour dans le tableau
			if (Tour) {
				Tours.push(Tour);
			}
			// On prépare le nouveau tour
		    Tour = new Object();
			Tour.id = tour;
			Tour.points = new Array()
			Tour.line = '';
			Tour.show = false;
			Tour.valid = true; // le tour est valide s'il contient des points gps à fréquence régulière, un écart de +20" environ invalide le tour
			nt = Tours.length-1;
			np = 0;

			Point = new Object();
			Point.timestamp = Point0.timestamp;
			Point.lat1 = Point0.pointgps[0];
			Point.lon1 = Point0.pointgps[1];
			Point.vitesse = Point0.vitesse;
			//Point.altitude = Point0.altitude;
			Point.cap = Point1.cap;
	
			Tour.points.push(Point);
		}

		if (tour == 0) {
			curr_coord++
			continue;
		}


		Point1.tour = tour;

		if (!prevTimestamp)
			prevTimestamp = Point1.timestamp;
		var T0 = getObjTime(prevTimestamp);
		var T1 = getObjTime(Point1.timestamp);
		var dT = T1.getTime() - T0.getTime();
		prevTimestamp = Point1.timestamp;

		Point = new Object();
		Point.timestamp = Point1.timestamp;
		Point.lat1 = Point1.pointgps[0];
		Point.lon1 = Point1.pointgps[1];
		Point.vitesse = Point1.vitesse;
		//Point.altitude = Point1.altitude;
		Point.cap = Point1.cap;

		curr_coord++

		Tour.points.push(Point);
		
		if (nt > 0 && np <= 1) {
			// on va ajouter les points 0 & 1 à la fin du tour précédent
			Point = new Object();
			Point.timestamp = Tours[nt].points[np].timestamp;
			Point.lat1 = Tours[nt].points[np].lat1;
			Point.lon1 = Tours[nt].points[np].lon1;
			Point.vitesse = Tours[nt].points[np].vitesse;
			//Point.altitude = Tours[nt].points[np].altitude;
			Point.cap = Tours[nt].points[np].cap;
			Tours[nt-1].points.push(Point);
		}

		np++;
	}
	// ne ratons pas le dernier tour
	if (Tour) {
		Tours.push(Tour);
		// on va ajouter le points 0 & 1 à la fin du tour précédent
		nt = Tours.length-1;
		if (nt > 0) {
			for (var np=0; np < 2; np++) {
				Point = new Object();
				Point.timestamp = Tours[nt].points[np].timestamp;
				Point.lat1 = Tours[nt].points[np].lat1;
				Point.lon1 = Tours[nt].points[np].lon1;
				Point.vitesse = Tours[nt].points[np].vitesse;
				//Point.altitude = Tours[nt].points[np].altitude;
				Point.cap = Tours[nt].points[np].cap;
				Tours[nt-1].points.push(Point);
			}
		}
	}
}

// Fonction de reconstruction du tableau des Tours en cas de modification des lignes (départ ou intermédiaires)
function redraw() {
	document.getElementById("zone-info").innerHTML = 'recalcul en cours, veuillez patienter';
	curr_coord = 0;
	//
	// on va construire à nouveau le tableau des Tours à partir de objStart
	if (typeof(objStart.coord) == 'undefined') {
		document.getElementById("zone-info").innerHTML = 'recalcul impossible, ligne de départ-arrivée manquante.';
		return;
	}
	FL = new Array(objStart.coord[0],objStart.coord[1],objStart.coord[2],objStart.coord[3]);
	buildTours(FL);
	nb_tours = Tours.length;
	var i = 0;
	Tour = Tours[i];
	Points = Tour.points;
	
	// Maintenant, on va construire le menu des tours
	// et créer les éléments de design
	var el = document.getElementById("Tours")
	if (!el)
		return;
	el.innerHTML = "";
	for (var i=0; i < Tours.length-1; i++) { // le dernier tour est incomplet, on ne le propose pas
		var tour = Tours[i].id;
		
		if (Tours[i].valid) {
			el.innerHTML += "<a class=\"w3-bar-item w3-button w3-border w3-round\" href=\"#\" onClick=\"showLap("+tour+");\" id=\"buttonlap"+tour+"\">T "+tour;
			el.innerHTML += "<span id=\"timelap"+tour+"\"></span>"+"</a>";
		}
		else {
			el.innerHTML += "<a class=\"w3-bar-item w3-button w3-border w3-round\" href=\"#\" onClick=\"showLap("+tour+");\" id=\"buttonlap"+tour+"\">T "+tour+" invalide"+"</a>";
		}
	}
	
	displayMap()
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
	if (Circuit.hasOwnProperty('msgerr')) {
		if (Circuit.msgerr != '')
			return trackfound
	}
	// on scrute les circuits
	for (var i=0; i < Circuit.circuits.length; i++) {
		if (Circuit.circuits[i].NomCircuit == thisCircuit.NomCircuit) {
			trackfound = Circuit.circuits[i];
			var el = document.getElementById('NomCircuit');
			if (el)
				el.innerHTML = Circuit.circuits[i].NomCircuit;
		}
	}
	return trackfound;
}

function drawLine(objline) {
	// si les coodonnées du segment de droite sont fournies, on trace le segment de droite avec ces coordonnées
	// sinon, on trace un segment de droite avec les coordonnées de son milieu selon le cap fourni
	if (objline.coord)
		obj = drawLineWithCoord(objline)
	else
		obj = drawLineWithCap(objline)
	return obj
}

function drawLineWithCoord(objline) {
	var obj = objline
	if (typeof(objline.marker1) != 'undefined') {
		return obj;
	}
	// on efface les précédents marqueurs "with cap"
	if (typeof(objline.marker) != 'undefined') {
		if (objline.marker != '') {
			map.removeLayer(objline.marker)
			objline.marker = '';
		}
	}
	if (typeof(objline.markerB) != 'undefined') {
		if (objline.markerB != '') {
			map.removeLayer(objline.markerB)
			objline.markerB = '';
		}
	}
	if (typeof(objline.markerB2) != 'undefined') {
		if (objline.markerB2 != '') {
			map.removeLayer(objline.markerB2)
			objline.markerB2 = '';
		}
	}
	if (typeof(objline.markercap) != 'undefined') {
		if (objline.markercap != '') {
			map.removeLayer(objline.markercap)
			objline.markercap = '';
		}
	}
	if (typeof(objline.linecap) != 'undefined') {
		if (objline.linecap != '') {
			map.removeLayer(objline.linecap);
			objline.linecap = '';
		}
	}

	// on va tracer un segment de droite à partir des coordonnées de ses extrémités
	
	var A = new Array(objline.coord[0],objline.coord[1]);
	// On marque une des extrémités du segment de droite
	var markerpoint = {lat: A[0], lng: A[1]};
	
	if (typeof(objline.marker1) != 'undefined') {
		if (objline.marker1 != '') {
			map.removeLayer(objline.marker1);
			objline.marker1 = '';
		}
	}
	objline.marker1 = new L.Marker(markerpoint,{draggable:true, title: objline.title+' - 1'});
	map.addLayer(objline.marker1);	
	objline.marker1.on('dragend', function(ev) {changeMarker1(ev,objline);});
	
	var B = new Array(objline.coord[2],objline.coord[3]);
	// On marque l'autre extrémité du segment de droite
	var markerpoint = {lat: B[0], lng: B[1]};
		
	if (typeof(objline.marker2) != 'undefined') {
		if (objline.marker2 != '') {
			map.removeLayer(objline.marker2);
			objline.marker2 = '';
		}
	}
	objline.marker2 = new L.Marker(markerpoint,{draggable:true, title: objline.title+' - 2'});
	map.addLayer(objline.marker2);	
	objline.marker2.on('dragend', function(ev) {changeMarker2(ev,objline);});

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	
	if (typeof(objline.line) != 'undefined') {
		if (objline.line != '') {
			map.removeLayer(objline.line);
			objline.line = '';
		}
	}
	objline.line = new L.polyline(pathCoordinates, {color: objline.color});
	map.addLayer(objline.line);	
	return obj;
	
}

function drawLineWithCap(objline) {
	// on va tracer un segment de droite à partir de son milieu et en utilisant le cap fourni 
	
	// on recherche le point B à 50 mètres du point A selon le cap fourni
	var dist = 50; // 50m
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);
	//console.log('destination:'+B);
	
	var A = new Array(objline.lat,objline.lon);
	// On marque le point actuel qui représente le milieu du segment de droite
	var markerpoint = {lat: A[0], lng: A[1]};
	
	objline.marker = new L.Marker(markerpoint,{draggable:true, title: objline.title+' - Milieu'});
	map.addLayer(objline.marker);	
	objline.marker.on('dragend', function(ev) {changeMarker(ev,objline);});

	// on marque les 2 points sur la droite du cap
	var markerpoint = {lat: B[0], lng: B[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markercap = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: 'Cap'});
	map.addLayer(objline.markercap);	
	objline.markercap.on('dragend', function(ev) {changeMarkercap(ev,objline);});
		
	// On trace une ligne entre le point milieu du segment de droite et le point cap
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new L.polyline(pathCoordinates, {color: 'blue'});
	map.addLayer(objline.linecap);	
	objline.marker.on('dragend', function(ev) {changeMarker(ev,objline);});

	// On trace une ligne passant par le point start, perpendiculaire à la droite point start;point gps et 2 points (P1;P-1)
	// situés de part et d'autre du point start à une distance égale à la largeur de la piste
	var icoord = getPerpendiculaire(A,B);
	//console.log(icoord);
	var coord1 = pointDroite(A,new Array(icoord[0],icoord[1]),largeur_piste); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 
	var coord2 = pointDroite(A,new Array(icoord[2],icoord[3]),largeur_piste); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 
	
	var markerpoint = {lat: coord1[0], lng: coord1[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/2.png',
		iconAnchor: [32,64]
	});
	objline.markerB = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: objline.title+' - Bord', rotationAngle: 45});
	map.addLayer(objline.markerB);	
	objline.markerB.on('dragend', function(ev) {changeMarkerB(ev,objline);});

	var markerpoint = {lat: coord2[0], lng: coord2[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerB2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: objline.title+' - Bord opposé'});
	map.addLayer(objline.markerB2);	

	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (Array.isArray(icoord)) {
		var pathCoordinates = [{lat: coord1[0], lng: coord1[1]},{lat: coord2[0], lng: coord2[1]}];
		objline.line = new L.polyline(pathCoordinates, {color: objline.color});
		map.addLayer(objline.line);	
	}
	objline.coord = new Array(coord1[0],coord1[1],coord2[0],coord2[1]);
	return objline;
}

function changeMarker(ev,objline) {
	// Le marqueur du milieu de ligne a bougé, on recalcule les coordonnées
	var lat = objline.lat; // latitude avant déplacement
	var lon = objline.lon; // longitude avant déplacement
	var latlon = objline.marker.getLatLng();
	
	objline.lat = latlon.lat;
	objline.lon = latlon.lng;
	
	// on va déplacer le point opposé de bord de piste
	objline.coord[1] += (objline.lon - lon);
	objline.coord[0] += (objline.lat - lat);
	objline.coord[2] += (objline.lat - lat);
	objline.coord[3] += (objline.lon - lon);
	
	// On marque à nouveau le point par rapport au point de départ
	if (objline.markerB != '') {
		map.removeLayer(objline.markerB);
		objline.markerB = '';
	}
	
	var markerpoint = {lat: objline.coord[0], lng: objline.coord[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/2.png',
		iconAnchor: [32,64]
	});	
	objline.markerB = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: objline.title+' - Bord', rotationAngle: 45});
	map.addLayer(objline.markerB);	
	objline.markerB.on('dragend', function(ev) {changeMarkerB(ev,objline);});

	// On marque à nouveau le point opposé par rapport au point de départ
	if (objline.markerB2 != '') {
		map.removeLayer(objline.markerB2)
		objline.markerB2 = '';
	}
	var markerpoint = {lat: objline.coord[2], lng: objline.coord[3]};
	
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerB2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: objline.title+' - Bord opposé'});
	map.addLayer(objline.markerB2);
	
	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (objline.line != '') {
		map.removeLayer(objline.line);
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new L.polyline(pathCoordinates, {color: objline.color});
	map.addLayer(objline.line);	
	
	// on recalcule le cap
	objline.cap = wrap360(getCap(objline) + 90); // 90° de + par rapport au cap point bord de ligne de départ, point milieu de ligne de départ

	// On remarque le cap
	var dist = 50;
	var A = new Array(objline.lat,objline.lon);
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);
	
	if (objline.markercap != '') {
		map.removeLayer(objline.markercap);
		objline.markercap = '';
	}
	var markerpoint = {lat: B[0], lng: B[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markercap = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: 'Cap'});
	map.addLayer(objline.markercap);	
	objline.markercap.on('dragend', function(ev) {changeMarkercap(ev,objline);});	

	// On trace une ligne entre le point de départ (milieu du segment de droite) et le point cap
	if (objline.linecap != '') {
		map.removeLayer(objline.linecap);
		objline.linecap = '';
	}
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new L.polyline(pathCoordinates, {color: 'blue'});
	map.addLayer(objline.linecap);	
}

function changeMarkerB(ev,objline) {
	// Le marqueur du bord de ligne a bougé, on recalcule pcoord
	var latlon = ev.target.getLatLng();
	
	objline.coord[0] = latlon.lat;
	objline.coord[1] = latlon.lng;
	
	objline.coord[2] = objline.coord[0]+((objline.lat-objline.coord[0])*2);
	objline.coord[3] = objline.coord[1]+((objline.lon-objline.coord[1])*2);

	// On marque à nouveau le point opposé par rapport au point de départ
	if (objline.markerB2 != '') {
		map.removeLayer(objline.markerB2)
		objline.markerB2 = '';
	}
	var markerpoint = {lat: objline.coord[2], lng: objline.coord[3]};
	
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerB2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: objline.title+' - Bord opposé'});
	map.addLayer(objline.markerB2);
	
	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (objline.line != '') {
		map.removeLayer(objline.line);
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new L.polyline(pathCoordinates, {color: objline.color});
	map.addLayer(objline.line);	
	
	// on recalcule le cap
	objline.cap = wrap360(getCap(objline) + 90); // 90° de + par rapport au cap point bord de ligne de départ, point milieu de ligne de départ

	// On remarque le cap
	var dist = 50;
	var A = new Array(objline.lat,objline.lon);
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);
	
	if (objline.markercap != '') {
		map.removeLayer(objline.markercap);
		objline.markercap = '';
	}
	var markerpoint = {lat: B[0], lng: B[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markercap = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: 'Cap'});
	map.addLayer(objline.markercap);	
	objline.markercap.on('dragend', function(ev) {changeMarkercap(ev,objline);});

	// On trace une ligne entre le point de départ (milieu du segment de droite) et le point cap
	if (objline.linecap != '') {
		map.removeLayer(objline.linecap);
		objline.linecap = '';
	}
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new L.polyline(pathCoordinates, {color: 'blue'});
	map.addLayer(objline.linecap);	
}

function changeMarker1(ev,objline) {
	// Le marqueur 1 du segment de droite a bougé, on recalcule les coordonnées
	var latlon = ev.target.getLatLng();
	
	objline.coord[0] = latlon.lat;
	objline.coord[1] = latlon.lng;

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	if (objline.line != '') {
		map.removeLayer(objline.line)
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new L.polyline(pathCoordinates, {color: objline.color});
	map.addLayer(objline.line);	
}
	
function changeMarker2(ev,objline) {
		// Le marqueur 2 du segment de droite a bougé, on recalcule les coordonnées
	var latlon = ev.target.getLatLng();
	
	objline.coord[2] = latlon.lat;
	objline.coord[3] = latlon.lng;

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	if (objline.line != '') {
		map.removeLayer(objline.line)
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new L.polyline(pathCoordinates, {color: objline.color});
	map.addLayer(objline.line);	
}

function changeMarkercap(ev,objline) {
	// Le marqueur du point de cap a bougé, on recalcule le cap
	var latlon = ev.target.getLatLng();
	var A = new Array(objline.lat,objline.lon); // point milieu de ligne
	var B = new Array(latlon.lat, latlon.lng); // point cap
	var cap = initialBearingTo(A,B);
		
	// on efface le précédent point cap
	if (objline.markercap != '') {
		map.removeLayer(objline.markercap);
		objline.markercap = '';
	}
	// on marque le nouveau point cap
	var markerpoint = {lat: B[0], lng: B[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markercap = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: 'Cap'});
	map.addLayer(objline.markercap);	
	objline.markercap.on('dragend', function(ev) {changeMarkercap(ev,objline);});
		
	// on efface la précédente ligne cap
	if (objline.linecap != '') {
		map.removeLayer(objline.linecap);
		objline.linecap = '';
	}
		
	// On retrace la ligne entre le point milieu du segment de droite et le point cap
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new L.polyline(pathCoordinates, {color: 'blue'});
	map.addLayer(objline.linecap);	
	
	// On trace une ligne passant par le point start, perpendiculaire à la droite point start;point gps et 2 points (P1;P-1)
	// situés de part et d'autre du point start à une distance égale à la largeur de la piste
	// on commence par calculer la distance entre milieu le bord
	var latlon = objline.markerB.getLatLng();
	var C = new Array(latlon.lat, latlon.lng); // point bord
	var dist = distanceGPS(A,C);
	
	var icoord = getPerpendiculaire(A,B);
	var coord1 = pointDroite(A,new Array(icoord[0],icoord[1]),dist); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 
	var coord2 = pointDroite(A,new Array(icoord[2],icoord[3]),dist); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 

	if (objline.markerB != '') {
		map.removeLayer(objline.markerB);
		objline.markerB = '';
	}
	
	var markerpoint = {lat: coord1[0], lng: coord1[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/2.png',
		iconAnchor: [32,64]
	});	
	objline.markerB = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: objline.title+' - Bord', rotationAngle: 45});
	map.addLayer(objline.markerB);	
	objline.markerB.on('dragend', function(ev) {changeMarkerB(ev,objline);});

	if (objline.markerB2 != '') {
		map.removeLayer(objline.markerB2);
		objline.markerB2 = '';
	}

	var markerpoint = {lat: coord2[0], lng: coord2[1]};
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerB2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: objline.title+' - Bord opposé'});
	map.addLayer(objline.markerB2);	
	
	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (Array.isArray(icoord)) {
		if (objline.line != '') {
			map.removeLayer(objline.line);
			objline.line = '';
		}
		var pathCoordinates = [{lat: coord1[0], lng: coord1[1]},{lat: coord2[0], lng: coord2[1]}];
		objline.line = new L.polyline(pathCoordinates, {color: objline.color});
		map.addLayer(objline.line);	
	}
	objline.coord = new Array(coord1[0],coord1[1],coord2[0],coord2[1]);
}

function drawCut() {
	// on va tracer les 2 segments de droite qui se croisent à partir des coordonnées de leurs extrémités
	
	// On marque les extrémités du premier segment de droite
	var A = new Array(coord[0],coord[1]);
	var markerpoint = {lat: A[0], lng: A[1]};
	
	if (markerA1 != '') {
		//markerA1.setMap(null);
		map.removeLayer(objline.markerA1)
		markerA1 = '';
	}
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/wht-circle-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerA1 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'A1-'+A[0]+','+A[1]});
	map.addLayer(objline.markerA1);
	//
	// On marque les extrémités du deuxième segment de droite
	var A = new Array(coord[2],coord[3]);
	var markerpoint = {lat: A[0], lng: A[1]};
		
	if (markerA2 != '') {
		map.removeLayer(objline.markerA2)
		markerA2 = '';
	}
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/wht-circle-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerA2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'A2-'+A[0]+','+A[1]});
	map.addLayer(objline.markerA2);
	
	// On trace une ligne pour matérialiser le segment de droite
	if (segment1 != '') {
		map.removeLayer(segment1);
		segment1 = '';
	}
	var pathCoordinates = [{lat: coord[0], lng: coord[1]},{lat: coord[2], lng: coord[3]}];
	segment1 = new L.polyline(pathCoordinates, {color: "white"});
	map.addLayer(segment1);
	
	// On marque les extrémités du premier segment de droite
	var A = new Array(coord[4],coord[5]);
	var markerpoint = {lat: A[0], lng: A[1]};
	
	if (markerB1 != '') {
		map.removeLayer(markerB1);
		markerB1 = '';
	}
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/1-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerB1 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'B1-'+A[0]+','+A[1]});
	map.addLayer(objline.markerB1);
	
	//
	// On marque les extrémités du deuxième segment de droite
	var A = new Array(coord[6],coord[7]);
	var markerpoint = {lat: A[0], lng: A[1]};
		
	if (markerB2 != '') {
		map.removeLayer(markerB2);
		markerB2 = '';
	}
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/2-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerB2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'B2-'+A[0]+','+A[1]});
	map.addLayer(objline.markerB2);	
	
	// On trace une ligne pour matérialiser le segment de droite
	if (segment2 != '') {
		map.removeLayer(segment2);
		segment2 = '';
	}
	var pathCoordinates = [{lat: coord[4], lng: coord[5]},{lat: coord[6], lng: coord[7]}];
	segment2 = new L.polyline(pathCoordinates, {color: "pink"});
	map.addLayer(segment2);
}

function designLap(lap) {
	var il = lap-1;
	//
	// On construit le polygone représentant le tour
	Points = Tours[il].points;
	var segcoords = new Array(); // lat point a,lng point a,lat point b,lng point b
	var laptime = new Array(); // temps de passage du point a et du point b
	var speed = new Array(); // vitesse de passage au point a et au point b
	var time_start = false;
	var time_arrival = false; 
	var time_sect = new Array(false,false,false);
	var time_prev = new Array(false,false,false);
	var pointCut = false;
	Tours[il].pathRun = new Array();
	Tours[il].vmax = 0;
	
	var geocoords = new Array();

	// Pour construire le polygone on traite les points, point par point
	for (var i=0; i < Points.length; i++) {
		var pcoord = new Object();
		pcoord.lat = Points[i].lat1;
		pcoord.lng = Points[i].lon1;

		segcoords.push(pcoord.lat);
		segcoords.push(pcoord.lng);
		
		laptime.push(Points[i].timestamp);
		if (laptime[1]) {
			var dt0 = getObjTime(laptime[0]);
			var dt1 = getObjTime(laptime[1]);
			var laptime = new Array();
			laptime.push(Points[i].timestamp);
		}
		
		if (Points[i].vitesse > Tours[il].vmax)
			Tours[il].vmax = Points[i].vitesse;
		speed.push(Points[i].vitesse);
		if (speed[1]) {
			var v0 = speed[0];
			var v1 = speed[1];
			var speed = new Array();
			speed.push(Points[i].vitesse);
		}

		var timecut = 0;
		var icut = 0;
		Points[i].timecut = timecut; // on va stocker les temps de coupure de ligne
		Points[i].CP = new Object(); // on va stocker les coordonnées du point d'intersection
		Points[i].CP.latitude = 0;
		Points[i].CP.longitude = 0;
		Points[i].icut = icut;

		if (segcoords[3]) {
			// toutes les coordonnées du segment sont définies, on regarde s'il coupe une ligne
			// on commence par la ligne de départ/arrivée
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
				pointCut = Tcut.pointCut;
				time_start = Tcut.tdeb;
				time_arrival = Tcut.tfin;
				time_prev[0] = time_start;
                Points[i].timecut = time_arrival - time_start;		
				// s'il s'agit d'un point de coupure, on l'indique dans le chemin
				var latlng = L.latLng(pointCut[0], pointCut[1]);
				var CP = getIntersectionSphere(parmCut.linecoord,parmCut.segcoords);
				Points[i].CP = CP;
			}
			else {
				var latlng = L.latLng(pcoord.lat, pcoord.lng);
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
						pointCut = Tcut.pointCut;
						time_sect[j] = Tcut.tfin;
						k = j+1;
						if (k < Tabint.length)
							time_prev[k] = Tcut.tfin;
                        Points[i].timecut = time_sect[j] - time_prev[j];		
                        Points[i].icut = j+1;		
					}
				}
			}
			var segcoords = new Array(); // on prépare le segment suivant
			segcoords.push(pcoord.lat);
			segcoords.push(pcoord.lng);
		}
	}
	// si un temps de coupure est présent, on stocke l'information dans le tableau Tours
	// on commence par la ligne de départ-arrivée
	if (time_arrival) {
		var time_lap = time_arrival - time_start;
		var time2display = formatMMSS(time_lap);
		Tours[il].timeLap = time2display;
		if (pointCut) {
			Tours[il].pointCut = pointCut; // point d'intersection avec la ligne de départ/arrivée
		}
	}
	// on continue avec les lignes intermédiaires
	if (Tabint.length > 0) {
		Tours[il].timeSect = new Array();
	}
	for (var j=0; j < Tabint.length; j++) {
		if (Tabint[j].coord) {
			if (time_sect[j]) {
				var time_sector = time_sect[j] - time_prev[j];
				var time2display = formatMMSS(time_sector);
				Tours[il].timeSect.push(time2display);
				var time_lastsect = time_arrival - time_sect[j];
			}
		}
	}
	if (j>0) {
		var time2display = formatMMSS(time_lastsect);
		Tours[il].timeSect.push(time2display);
	}
		
	// Le polygone est construit et prêt à être affiché dans la map
	Tours[il].pathRun = geocoords;

	var lenLap = 0; // on va calculer une autre fois
	Tours[il].lenLap = lenLap;
	Tours[il].geocoords = geocoords;
	
	var linecolor = false;
	var ic = il;
	while (linecolor == false) {
		if (ic >= nb_colors) {
			ic = ic - nb_colors;
		}
		else {
			linecolor = Colors[ic];
		}
	}
	Tours[il].linecolor = linecolor;
	
	Tours[il].isDesign = true;
}

// 
function designCut(parm) {
	var linecoord = parm.linecoord; // coordonnées de la ligne à couper
	var segcoords = parm.segcoords; // coordonnées du segment qui coupe la ligne
	var tdeb = parm.tdeb;
	var tfin = parm.tfin;
	var dt0 = parm.dt0;
	var dt1 = parm.dt1;
	var v0 = parm.v0;
	var v1 = parm.v1;
	
	var linecut = false;
	var pointCut = getIntersection(linecoord,segcoords);
	
	if (pointCut != false) {
		linecut = true;
		// On va calculer les distances entre le point, le point b et la ligne franchie
		var dist0 = getDistanceLine(linecoord,new Array(segcoords[0],segcoords[1]));
		var dist1 = getDistanceLine(linecoord,new Array(segcoords[2],segcoords[3]));
		var corrtime = dt1.getTime() - dt0.getTime();
		var vmoy = (v0+v1)/2;
		var dc0 = dist0*(v1/vmoy);
		var dc1 = dist1*(v0/vmoy);
	
		corrtime = corrtime * (dc0/(dc0+dc1));
		corrtime = Math.round(corrtime);
		var temps = dt0.getTime() + corrtime;
		
		if (!tdeb) {
			tdeb = temps;
		}
		else {
			var tfin = temps;
		}
	}
	var retour = new Object();
	retour.linecut = linecut;
	retour.pointCut = pointCut;
	retour.tdeb = tdeb;
	retour.tfin = tfin;
	return retour;
}


function showLap(lap) {
	if (window.innerWidth <= 500) {
		document.getElementById("switch-graph").style.display = "block";
		document.getElementById("menu-graph").style.display = "block";
		var el = document.getElementById("simu");
		el.style.display = "none";
	}		
	else {
		var el = document.getElementById("simu");
		el.style.display = "block";
		document.getElementById("switch-graph").style.display = "block";
	}		

	// on sauvegarde le n° du tour dans la page
	var el = document.getElementById("HiddenLap");
	if (el)
		el.value = lap;
		
	var il = lap-1;
	
	simuRelease(); // on efface le simulateur
	graphRelease(); // on efface le graphe
		
	if (Tours[il].polyline) {
		if (Tours[il].polyline != '') {
			map.removeLayer(Tours[il].polyline);
			Tours[il].polyline = '';
			if (Tours[il].markerPC) {
				if (Tours[il].markerPC != '') {
					map.removeLayer(Tours[il].markerPC);
					Tours[il].markerPC = '';
				}
			}
			if (Tours[il].markerD1) {
				if (Tours[il].markerD1 != '') {
					map.removeLayer(Tours[il].markerD1);
					Tours[il].markerD1 = '';
				}
			}
			if (Tours[il].markerD2) {
				if (Tours[il].markerD2 != '') {
					map.removeLayer(Tours[il].markerD2);
					Tours[il].markerD2 = '';
				}
			}
			if (Tours[il].segment0) {
				if (Tours[il].segment0 != '') {
					map.removeLayer(Tours[il].segment0);
					Tours[il].segment0 = '';
				}
			}
			if (Tours[il].segment1) {
				if (Tours[il].segment1 != '') {
					map.removeLayer(Tours[il].segment1);
					Tours[il].segment1 = '';
				}
			}
			var el = document.getElementById("buttonlap"+lap);
			if (el) {
				el.className = "w3-bar-item w3-button w3-border w3-round";
			}
			var el = document.getElementById("timelap"+lap);
			if (el) {
				el.innerHTML = "";
			}
			// on retire le numéro du tour de la pile
			var l = tabShow.indexOf(lap);
			if (l >= 0)
				tabShow.splice(l,1);
			var l = tabShow.length-1;
			if (l >= 0) {
				var newlap = tabShow[l];
				var el = document.getElementById("HiddenLap");
				if (el)
					el.value = newlap;
			}
			else {
				var el = document.getElementById("simu");
				if (el)
					el.style.display = "none";
				var el = document.getElementById("switch-graph");
				if (el)
					el.style.display = "none";
				var el = document.getElementById("menu-graph");
				if (el)
					el.style.display = "none";
			}
			resizeMap();
			return;
		}
	}
	// on empile le numéro du tour
	tabShow.push(lap);

    if (!Tours[il].isDesign) {
		designLap(lap);
	}

    if (!Tours[il].pathRun) {
		alert('le tour n\'est pas dessiné !');
		return;
	}

	colorLap = "w3-"+Tours[il].linecolor;
	var el = document.getElementById("buttonlap"+lap);
	if (el) {
		if (el.className.indexOf(colorLap) < 0)
			el.className += " "+colorLap;
	}
	var el = document.getElementById("timelap"+lap);
	if (el) {
		el.innerHTML = Tours[il].timeLap;
		if (el.className.indexOf(colorLap) < 0)
			el.className += " "+colorLap;
	}

	Tours[il].polyline = new L.polyline(Tours[il].pathRun, {color: Tours[il].linecolor});
	map.addLayer(Tours[il].polyline);	
		
	// affichage du point de franchissement de la ligne
	if (Tours[il].markerPC) {
		if (Tours[il].markerPC != '') {
			//Tours[il].markerPC.setMap(null);
			map.removeLayer(Tours[il].markerPC)
			Tours[il].markerPC = '';
		}
	}
	
	var markerpoint = new Object();
	markerpoint.lat = Tours[il].pointCut[0];
	markerpoint.lng = Tours[il].pointCut[1];
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/1-lv.png',
		iconAnchor: [8, 16]
	});	
	Tours[il].markerPC = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'tour '+Tours[il].id+': '+Tours[il].timeLap+' ('+Math.round(Tours[il].vmax*1)+')'});
	map.addLayer(Tours[il].markerPC);
	
	var l = Tours[il].pathRun.length-1;
	
	displayMap();
	
}

//
// Affichage des différents onglets
function displayMap() {
	clearOnglets();
	var el = document.getElementById("onglet-map");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("menu-map");
	if (el)
		el.style.background = "grey";
	var el = document.getElementById("sousmenu-map");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("sousmenu-simu");
	if (el)
		el.style.display = "none";
	resizeMap();
}
function displayInfos() {
	clearOnglets();
	var el = document.getElementById("onglet-infos");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("menu-infos");
	if (el)
		el.style.background = "grey";
	// On affiche les infos
	var el = document.getElementById("infos");
	if (el)
		el.style.display = "block";
	displayInfosTours();
}

function displayInfosCircuit() {
	clearOngletsInfos();
	var el = document.getElementById("infos-circuit");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("sousmenu-circuit");
	if (el)
		el.style.background = "grey";
	// on affiche les infos
	var el = document.getElementById("infoNomCircuit");
	if (el)
		el.innerHTML = thisCircuit.NomCircuit;
	var el = document.getElementById("Adresse");
	if (el) {
		if (thisCircuit.Adresse)
			el.innerHTML = thisCircuit.Adresse;
	}
	var el = document.getElementById("CodePostal");
	if (el) {
		if (thisCircuit.CodePostal)
			el.innerHTML = thisCircuit.CodePostal;
	}
	var el = document.getElementById("Ville");
	if (el) {
		if (thisCircuit.Ville)
			el.innerHTML = thisCircuit.Ville;
	}
	var el = document.getElementById("Pays");
	if (el) {
		if (thisCircuit.Pays)
			el.innerHTML = '('+thisCircuit.Pays+')';
	}
	var el = document.getElementById("Latitude");
	if (el) {
		if (thisCircuit.Latitude)
			el.innerHTML = thisCircuit.Latitude;
	}
	var el = document.getElementById("Longitude");
	if (el) {
		if (thisCircuit.Longitude)
			el.innerHTML = thisCircuit.Longitude;
	}
}
function seeGoogleMaps(latitude,longitude,zoom) {
	var href =	"https://www.google.fr/maps/@";
	var lat = latitude;
	var lng = longitude;
	var z = zoom;
	if (!lat) {
		if (thisCircuit.Latitude)
			lat = thisCircuit.Latitude;
	}
	if (!lng) {
		if (thisCircuit.Longitude)
			lng = thisCircuit.Longitude;
	}
	if (!z) {
		if (thisCircuit.Zoom)
			z = thisCircuit.Zoom;
	}

	href += lat;
	href += ',';
	href += lng;
	href += ',';
	href += z;
	href += 'z?hl=fr';
	
	var el = document.getElementById("googlemaps");
	if (el) {
		el.href = href;
		el.target = "_blank";
	}
}
function displayInfosTours() {
	for (var il=0; il < Tours.length-1; il++) {
		var lap = il+1;
		if (!Tours[il].isDesign) {
			designLap(lap);
		}
	}
	displayTableTours();
}
function displayTableTours() {
	// on va rechercher les meilleurs temps et les marquer dans le tableau
	var bestlap = false;
	var isbl = false;
	var ibl = 0;
	var bvmax = false;
	var ivm = 0;
	var isvm = false;
	var bestsect = new Array(false,false,false,false);
	var isbs = new Array(false,false,false,false);
	var ibs = new Array(0,0,0,0);
	for (var il=0; il < Tours.length-1; il++) {
		if (Tours[il].valid) {
			if (Tours[il].timeLap) {
				if (!bestlap) {
					bestlap = Tours[il].timeLap;
					ibl = il;
					isbl = true;
				}
				else {
					if (Tours[il].timeLap < bestlap) {
						bestlap = Tours[il].timeLap;
						ibl = il;
						isbl = true;
					}
				}
			}
			if (Tours[il].timeSect) {
				for (var j=0; j < 4; j++) {
					if (Tours[il].timeSect[j]) {
						if (!bestsect[j]) {
							bestsect[j] = Tours[il].timeSect[j];
							ibs[j] = il;
							isbs[j] = true;
						}
						else {
							if (Tours[il].timeSect[j] < bestsect[j]) {
								bestsect[j] = Tours[il].timeSect[j];
								ibs[j] = il;
								isbs[j] = true;
							}
						}
					}
				}
			}
			if (Tours[il].vmax) {
				if (!bvmax) {
					bvmax = Tours[il].vmax;
					ivm = il;
					isvm = true;
				}
				else {
					if (Tours[il].vmax > bvmax) {
						bvmax = Tours[il].vmax;
						ivm = il;
						isvm = true;
					}
				}
			}
		}
	}

	clearOngletsInfos();
	var el = document.getElementById("infos-tours");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("sousmenu-tours");
	if (el)
		el.style.background = "grey";
	// on affiche les infos
	var eltab = document.getElementById("tab-tours");
	if (!eltab)
		return;
	eltab.innerHTML = "";
	eltab.innerHTML += "<tr><th>Tour</th><th>Heure</th><th>Temps</th><th>Sect.1</th><th>Sect.2</th><th>Sect.3</th><th>Sect.4</th><th>V.max</th></tr>";
	var tabtours = eltab.innerHTML;
	for (var il=0; il < Tours.length-1; il++) {
		if (Tours[il].valid) {
			tabtours += "<tr id=\"tour"+il+"\"><td><a href=\"#\" onClick=\"showLap("+Tours[il].id+");\" >"+Tours[il].id+"</a></td>";
			var timestamp = "";
			if (Tours[il].points[0].timestamp)
				timestamp = formatTimestamp(Tours[il].points[0].timestamp);
			tabtours += "<td id=\"timestamp"+il+"\">"+timestamp+"</td>";
			var timeLap = "";
			var colorTimeLap = "";
			if (il == ibl)
				colorTimeLap = " class=\"w3-yellow\"";
			if (Tours[il].timeLap) {
				timeLap = Tours[il].timeLap;
			}
			tabtours += "<td id=\"temps"+il+"\""+colorTimeLap+">"+timeLap+"</td>";
			for (var j=0; j < 4; j++) {
				var timeSect = "";
				var colorTimeSect = "";
				if (il == ibs[j])
					colorTimeSect = " class=\"w3-green\"";
				if (Tours[il].timeSect) {
					if (Tours[il].timeSect[j]) 
						timeSect = Tours[il].timeSect[j];
				}
				tabtours += "<td id=\"temps"+il+"\""+colorTimeSect+">"+timeSect+"</td>";
			}
			var vitesse = "";
			var colorVitesse = "";
			if (il == ivm)
				colorVitesse = " class=\"w3-orange\"";
			if (Tours[il].vmax) {
				vitesse = Math.round(Tours[il].vmax);
			}
			tabtours += "<td id=\"vitesse"+il+"\""+colorVitesse+">"+vitesse+"</td>";
			tabtours += "</tr>";
		}
	}
	eltab.innerHTML = tabtours;
	// on complète les infos
	var el = document.getElementById("bestlap");
	if (el) {
		if (isbl)
			el.innerHTML = "meilleurs temps: "+Tours[ibl].timeLap;
			if (el.className.indexOf("w3-yellow") < 0)
				el.className += " w3-yellow";
	}
	var idealtime = false;
	var time1 = getLapTime("00:00.00");
	for (var j=0; j < 4; j++) {
		if (isbs[j]) {
			var time_temp = getLapTime(Tours[ibs[j]].timeSect[j]);
			if (!idealtime) {
				idealtime = time_temp - time1;
			}
			else {
				idealtime = idealtime + (time_temp - time1);
			}
		}
	}
	if (idealtime) {
		var el = document.getElementById("idealtime");
		if (el) {
			el.innerHTML = "temps idéal: "+formatMMSS(idealtime);
			if (el.className.indexOf("w3-cyan") < 0)
				el.className += " w3-cyan";
		}
	}
	var el = document.getElementById("vmax");
	if (el) {
		if (isvm)
			el.innerHTML = "vitesse maxi: "+Math.round(Tours[ivm].vmax);
			if (el.className.indexOf("w3-orange") < 0)
				el.className += " w3-orange";
	}
}

function infosLap(lap) {
	var il = lap-1;
    if (!Tours[il].isDesign) {
		designLap(lap);
	}
	displayTableTours();
}

function getLapTime(t) {
	if (dateSession) {
		var dateref = dateSession;
	}
	else {
		//var dtnow = Date.now();
		var dtnow = new Date();
		var i = dtnow.getMonth();
		var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
		var d = dtnow.getDate();
		if (d < 10)
			d = '0'+d;
		dateref = d+'/'+months[i]+'/'+dtnow.getFullYear();
	}
	var dt = dateref;
	syy = dt.substr(6,4);
	smm = dt.substr(3,2);
	sdd = dt.substr(0,2);
	sh = 0;
	var tt = t.split(':');
	sm = tt[0].substr(0,2);
	var tt = tt[1].split('.');
	ss = tt[0];
	sms = tt[1]+'0';
	ObTime = new Date(syy*1, (smm*1)-1, sdd*1, sh*1, sm*1, ss*1, sms*1);
	return ObTime;
}

function displayStats() {
	clearOnglets();
	var el = document.getElementById("onglet-stats");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("menu-stats");
	if (el)
		el.style.background = "grey";
}
function clearOnglets() {
	document.getElementById("zone-info").innerHTML = '';
	var el = document.getElementById("onglet-map");
	if (el)
		el.style.display = "none";
	var el = document.getElementById("menu-map");
	if (el)
		el.style.background = "white";
	
	var el = document.getElementById("onglet-infos");
	if (el)
		el.style.display = "none";
	var el = document.getElementById("menu-infos");
	if (el)
		el.style.background = "white";

	var el = document.getElementById("onglet-stats");
	if (el)
		el.style.display = "none";
	var el = document.getElementById("menu-stats");
	if (el)
		el.style.background = "white";
}
function clearOngletsInfos() {
	var el = document.getElementById("infos-circuit");
	if (el)
		el.style.display = "none";
	var el = document.getElementById("infos-tours");
	if (el)
		el.style.display = "none";
	var el = document.getElementById("sousmenu-circuit");
	if (el)
		el.style.background = "white";
	var el = document.getElementById("sousmenu-tours");
	if (el)
		el.style.background = "white";
}

function switchSimu() {
	document.getElementById("zone-info").innerHTML = '';
	if (is_simu) {
		// On arrête le simulateur
		simuRelease();
		resizeMap();
		return;
	}
	// on récupère le n° du tour dans la page
	var el = document.getElementById("HiddenLap");
	if (!el)
		return;
	var lap = el.value;
	il = lap - 1;
	if (il < 0)
		return;
	// On démarre le simulateur
	is_simu = true;
	var el = document.getElementById("sousmenu-simu");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("sousmenu-map");
	if (el)
		el.style.display = "none";
	// affichage du compteur vierge
	var el = document.getElementById("L0");
	if (el) {
		el.innerHTML = dateSession;
	}
	
	var el = document.getElementById("L1");
	if (el) {
		el.innerHTML = formatTimestamp(Tours[il].points[0].timestamp);
	}
	var el = document.getElementById("L2");
	if (el) {
		el.innerHTML = Frequence+" Hz";
	}
	// On affiche la longueur du tour
	var el = document.getElementById("lenLap");
	if (el) {
		el.innerHTML = Math.round(Tours[il].lenLap)+"m";
	}
	resizeMap();
}

function simuRelease() {
	simuStop();
	is_simu = false;
	var el = document.getElementById("sousmenu-simu");
	if (el)
		el.style.display = "none";
	var el = document.getElementById("sousmenu-map");
	if (el)
		el.style.display = "block";
	// on efface la ligne représentant le mobile
	if (simuline != '') {
		//simuline.setMap(null);
		map.removeLayer(simuline);
		simuline = '';
	}
	// on efface la représentation du mobile
	if (simup0 != '') {
		map.removeLayer(simup0);
		simup0 = '';
	}
	if (simup1 != '') {
		map.removeLayer(simup1);
		simup1 = '';
	}
	
	simupoint = 0;  // on reviens au premier point du tour
}

function simuForward() {
	document.getElementById("zone-info").innerHTML = '';
	if (!is_simu)
		return;
	// on récupère le n° du tour dans la page
	var el = document.getElementById("HiddenLap");
	if (!el)
		return;
	var lap = el.value;
	il = lap - 1;
	if (il < 0)
		return;
	if (simupoint < 0)
		simupoint = 0;
	if (simupoint >= Tours[il].points.length-1) {
		simupoint = 0;
	}
	simu_sens = 1;
	for (var n=0; n < Tours[il].points.length; n++) {
		if (Tours[il].points[n].timecut > 0) {
			//console.log("Tours:"+JSON.stringify(Tours[il].points[n]))
		}
	}
	
	playmotion = true;
	showMobile();
}

function simuFaster() {
	document.getElementById("zone-info").innerHTML = '';
	if (simu_freq <= 10)
		simu_freq = simu_freq * 1.3;
}

function simuSlower() {
	document.getElementById("zone-info").innerHTML = '';
	if (simu_freq >= 0.1)
		simu_freq = simu_freq * 0.8;
}

function simuBackward() {
	document.getElementById("zone-info").innerHTML = '';
	if (!is_simu)
		return;
	// on récupère le n° du tour dans la page
	var el = document.getElementById("HiddenLap");
	if (!el)
		return;
	var lap = el.value;
	il = lap - 1;
	if (il < 0)
		return;
	if (simupoint < 0)
		simupoint = 0;
	if (simupoint >= Tours[il].points.length-1) {
		simupoint = 0;
	}
	simu_sens = -1;
	for (var n=0; n < Tours[il].points.length; n++) {
		if (Tours[il].points[n].timecut > 0) {
			//console.log("Tours:"+JSON.stringify(Tours[il].points[n]))
		}
	}
	playmotion = true;
	showMobile();
}

function showMobile() {
	if (timer) {
		clearTimeout(timer);
	}
	var el = document.getElementById("HiddenLap");
	if (!el)
		return;
	var lap = el.value;
	var il = lap - 1
	if (il < 0)
		return;
	if (simupoint >= Tours[il].points.length-1) {
		return;
	}
	// on trace une ligne du point 0 au point 1
	var i0 = simupoint;
	var i1 = i0 + 1;
	
	// On va matérialiser les 2 points du segment de droite
	if (simup0 != '') {
		map.removeLayer(simup0)
		simup0 = '';
	}
	if (simup1 != '') {
		map.removeLayer(simup1)
		simup1 = '';
	}

	var cap = Tours[il].points[i0].cap;

	var markerpoint = {lat: Tours[il].points[i0].lat1, lng: Tours[il].points[i0].lon1};

	var cap = Tours[il].points[i1].cap;

	var markerpoint = {lat: Tours[il].points[i1].lat1, lng: Tours[il].points[i1].lon1};
	var	title = 'T:'+Tours[il].points[i1].timestamp+'\r\n'+
		        'v:'+Math.round(Tours[il].points[i1].vitesse)+'km/h\r\n'+
		        //'alt:'+Math.round(Tours[il].points[i1].altitude)+'m\r\n'+
                'cap:'+Math.round(Tours[il].points[i1].cap*10)/10+'° ';
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png',
		iconAnchor: [8, 16]
	});	
	simup1 = new L.Marker(markerpoint,{icon:localIcon, draggable:true, title: title, rotationAngle:cap});
	map.addLayer(simup1);

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	// on commence par effacer l'ancienne ligne
	if (simuline != '') {
		map.removeLayer(simuline)
		simuline = '';
	}
	var pathCoordinates = [{lat: Tours[il].points[i0].lat1, lng: Tours[il].points[i0].lon1},{lat: Tours[il].points[i1].lat1, lng: Tours[il].points[i1].lon1}];
	simuline = new L.polyline(pathCoordinates, {color: "cyan"});
	map.addLayer(simuline);
	var LatLng = L.latLng(Tours[il].points[i0].lat1, Tours[il].points[i0].lon1);
	map.panTo(LatLng);
	
	// calcul de l'accélération
	//console.log('calcul de l\'accélération');
	//console.log('Fréquence:'+Frequence);
	//console.log('gkmh:'+gkmh);
	//console.log('vitesse0 kmh:'+Tours[il].points[i0].vitesse);
	//console.log('vitesse1 kmh:'+Tours[il].points[i1].vitesse);
	var accel = (((Tours[il].points[i1].vitesse - Tours[il].points[i0].vitesse)) * Frequence) / gkmh;
	
	//var altitude = Tours[il].points[i1].altitude;
	var cap = Tours[il].points[i1].cap;
	
	// affichage du compteur
	// L0 = heure GPS
	var el = document.getElementById("L0");
	if (el) {
		el.innerHTML = formatTimestamp(Tours[il].points[i1].timestamp)+" T:"+lap;
	}
	// L1 = temps Chrono (en cours où à la coupure de ligne)
	if (Tours[il].points[i1].timecut > 0) {
		// une ligne à été coupée, on affiche le temps à la coupure
		if (Tours[il].points[i1].icut == 0) {
			dashboard_time = Tours[il].timeLap;
		}
		else {
			var i=Tours[il].points[i1].icut - 1;
			dashboard_time = Tours[il].timeSect[i];
		}
		dashboard_cycle = simucycle;
	}
	else {
		if (dashboard_cycle == 0) {
			//dashboard_time = formatMMSS(Tours[il].points[i1].timestamp - Tours[il].points[0].timestamp);
			var T0 = getObjTime(Tours[il].points[0].timestamp);
			var T1 = getObjTime(Tours[il].points[i1].timestamp);
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
	
	var el = document.getElementById("L2");
	if (el) {
		el.innerHTML = Math.round(Tours[il].points[i1].vitesse)+" km/h";
	}

	// affichage des Leds (verte = accélération, orange-rouge = décélération/freinage)
	var led = document.getElementById('led');
	if (led)
		led.className = 'w3-row led-blue-off';
	if (Tours[il].points[i1].vitesse > Tours[il].points[i0].vitesse) // accélération
		led.className = 'w3-row led-green-on';
	if (Tours[il].points[i1].vitesse < Tours[il].points[i0].vitesse) {
		// décélération
		var iaccel = Math.round(accel*-10);
		if (iaccel > 9)
			iaccel = 9;
		var class_accel = 'w3-row led-0'+iaccel;
		led.className = class_accel;
	}

	// affichage de l'accélération
	var el = document.getElementById('accel');
	if (el) {
		el.innerHTML = Math.round(accel*100)/100+"g";
	}

	// affichage de la distance parcourue
	var el = document.getElementById('dist');
	if (el) {
		var geodist = new Array();
		for (var m=0; m < i1; m++) {
			geodist.push(Tours[il].geocoords[m]);
		}
		var dist =	0;
		el.innerHTML = Math.round(dist)+"m";
	}

	// affichage du cap
	var el = document.getElementById('cap');
	if (el) {
		var cap0 = Math.round(Tours[il].points[i0].cap*100)/100;
		el.innerHTML = 'cap:'+Math.round(cap*100)/100+"° cap0:"+cap0;
	}

	// affichage du virage (changement de cap entre 2 points)
	var a0 = deg2rad(Tours[il].points[i0].cap);
	var a1 = deg2rad(Tours[il].points[i1].cap);
	var turn = 0;
	if (Math.abs(a1-a0) <= π) {
		if (a1 < a0) {
			turn = (a0 - a1) * -1;
		}
		else {
			turn = a1 - a0;
		}
	}
	else if (a1 < π) {
		turn = a1+(2*π-a0);
	}
	else {
		turn = 2*π-(a1+a0);
	}
		
	var el = document.getElementById('turn');
	if (el) {
		turn = rad2deg(turn);
		el.innerHTML = '';
		if (turn <= -2) {
			el.innerHTML += 'turn left ';
		}
		else if (turn >= 2) {
			el.innerHTML += 'turn right ';
		}
		el.innerHTML += Math.round(turn)+"°";
	}
	
	// Si on est en mode pas à pas, on marque le point d'intersection du segment avec la ligne
	if (!playmotion) {
		if (marktemp != '') {
			map.removeLayer(marktemp);
			marktemp = '';
		}
		var lat = Tours[il].points[i1].CP.latitude;
		var lng = Tours[il].points[i1].CP.longitude;
		if (lat > 0 && lng > 0) {
			var markerpoint = {lat: lat, lng: lng};
			var l = tabMarktemp.length-1;
			marktemp = new L.Marker(markerpoint,{draggable:true, title: 'Intersection'});
			map.addLayer(marktemp);
		}
	}

	// On passe au point suivant
	if (simu_sens > 0) {
		simupoint++;
		if (simupoint >= Tours[il].points.length-1) {
			simuStop();
			return;
		}
	}
	else {
		simupoint--;
		if (simupoint < 0) {
			simuStop();
			return;
		}
	}

	// aller vers le prochain point
	if (playmotion == true) {
		var next = Math.round(200/simu_freq);
		timer = setTimeout(showMobile, next);
	}
	
}
function simuStepByStep() {
	document.getElementById("zone-info").innerHTML = '';
	playmotion = false;
	if (simupoint >= Tours[il].points.length-1) {
		simupoint = 0;
	}
	showMobile();
}

function simuStop() {
	document.getElementById("zone-info").innerHTML = '';
	clearTimeout(timer);
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

function showInputPoint(elem) {
	document.getElementById("zone-info").innerHTML = '';
	var zoom = map.getZoom();
		
	if (marktemp != '') {
		map.removeLayer(marktemp);
		marktemp = '';
	}
	clearMultiPoints();

	var el = document.getElementById(elem);
	if (!el)
		return;
	if (el.value == "") {
		el.value = thisCircuit.Latcenter+','+thisCircuit.Loncenter;
	}
	
	A=eval("[" + el.value + "]");
	if (Array.isArray(A[0])) {
		markMultiPoints(A[0]);
		var zoom = map.getZoom();
		//console.log("zoom:"+zoom);
		return;
	}

	var lat = A[0]*1;
	var lng = A[1]*1;

	var markerpoint = {lat: lat, lng: lng};
	marktemp = new L.Marker(markerpoint,{draggable:false, title: 'D2'});
	map.addLayer(marktemp);
	
	var LatLng = L.latLng(lat,lng);
	map.panTo(LatLng);

}

function markMultiPoints(tabPoints) {
	var zoom = map.getZoom();
	var np = tabPoints.length/2;
	// on efface les anciens points
	clearMultiPoints();
	// on construits les points
	for (var i=0; i < tabPoints.length; i=i+2) {
		var lat = tabPoints[i]*1;
		var lng = tabPoints[i+1]*1;
		var markerpoint = {lat: lat, lng: lng};
		markter = new L.Marker(markerpoint,{draggable:false, title: 'Point'});
		map.addLayer(marker);
		tabMarktemp.push(marker);
		var l = tabMarktemp.length-1;
		tabMarktemp[l].setMap(map);
	}
	// on va également marquer les points de croisement (s'il y en a !)
	for (var i=0; i < tabPoints.length; i=i+4) {
		if (i < tabPoints.length-7) {
			var seg1 = new Array(tabPoints[i],tabPoints[i+1],tabPoints[i+2],tabPoints[i+3]);
			designSegment(seg1);
			var seg2 = new Array(tabPoints[i+4],tabPoints[i+5],tabPoints[i+6],tabPoints[i+7]);
			designSegment(seg2);
			
			var linecut = isLineCut(seg1,seg2);
			if (linecut) {
				var pinter = getIntersection(seg1,seg2);
				if (pinter) {
					var lat = pinter[0];
					var lng = pinter[1];
					var markerpoint = {lat: lat, lng: lng};
					tabMarktemp.push();
					var l = tabMarktemp.length-1;
					tabMarktemp[l] = new L.Marker(markerpoint,{draggable:false, title: 'X'});
					map.addLayer(tabMarktemp[l]);
				}
				var spinter = getIntersectionSphere(seg1,seg2);
				if (spinter) {
					var lat = spinter.latitude;
					var lng = spinter.longitude;
					var markerpoint = {lat: lat, lng: lng};
					tabMarktemp.push();
					var l = tabMarktemp.length-1;
					tabMarktemp[l] = new L.Marker(markerpoint,{draggable:false, title: 'Y'});
					map.addLayer(tabMarktemp[l]);
				}
			}
		}
	}
	if (lat) {
		setCenter(lat,lng);	
	}
	return;
}

function designSegment(seg) {
	document.getElementById("zone-info").innerHTML = '';
	var pathCoordinates = [{lat: seg[0], lng: seg[1]},{lat: seg[2], lng: seg[3]}];
	segment = new L.polyline(pathCoordinates, {color: "cyan"});
	map.addLayer(segment);	
	tabLinetemp.push(segment);
	var l = tabLinetemp.length-1;
	tabLinetemp[l].setMap(map);
}

function clearMultiPoints() {
	// on efface les anciens points
	for (var i=0; i < tabMarktemp.length; i++) {
		if (tabMarktemp[i] != "") {
			map.removeLayer(tabMarktemp[i]);
			tabMarktemp[i] = '';
		}
	}
	tabMarktemp = new Array();
	// on efface les anciens segments
	for (var i=0; i < tabLinetemp.length; i++) {
		if (tabLinetemp[i] != "") {
			map.removeLayer(tabLinetemp[i]);
			tabLinetemp[i] = '';
		}
	}
	tabLinetemp = new Array();
}

function degrees_to_decimal(coord, hemisphere) {
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
	mouseLatLng = mousePt.latlng;
	var mouseLat = mouseLatLng.lat;
	var mouseLon = mouseLatLng.lng;
	
	var oStatusDiv = document.getElementById("LatLng")	
	if (oStatusDiv) {
		oStatusDiv.value  = mouseLat + ',' + mouseLon;
	}
}
	
function copyClipboard(mousePt) {
	mouseMove(mousePt);
	var z_extract = document.getElementById("LatLng")
	z_extract.select();
	if ( !document.execCommand( 'copy' ) ) {
		document.getElementById("zone-info").innerHTML = 'erreur de copie dans le presse papier';
		return false;
	}
	var el = document.getElementById("HiddenLatLng")
	if (el)
	    el.value = z_extract.value;
	writeMessage("Les coordonnées du point sont copiés dans le presse papier",3);
	showInputPoint(el.id);
	return true;
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
	var bounds = map.getBounds();

	var el = document.getElementById("map");
	var html = "oT:";
	html += el.offsetTop+" oL:"+el.offsetLeft;
	html += " oW:"+el.offsetWidth+" oH:"+el.offsetHeight;
	html += " sW:"+el.scrollWidth+" sH:"+el.scrollHeight;
	var largeur = window.innerWidth;
	var hauteur = window.innerHeight;
	html += " l:"+largeur+" h:"+hauteur;
	document.getElementById("ecran").innerHTML = html;
	
	var hopt = Math.floor((hauteur - el.offsetTop)/4)*4;
	var ohopt = hopt; 
	// si le container graph est ouvert, on retire 200
	var elg = document.getElementById("container-graph");
	if (elg) {
		if (elg.style.display == "block") {
			hopt = hopt - 208;
			originBounds = map.getBounds();
			// on recadre sur le centre précédent
			var difflat = bounds._southWest.lat - bounds._northEast.lat
			var ndifflat = difflat * ((el.offsetHeight-208)/el.offsetHeight);
			var newsouthlat = bounds._southWest.lat + ndifflat;
			var corner1 = L.latLng(newsouthlat, bounds._southWest.lng);
			var corner2 = L.latLng(bounds._northEast.lat, bounds._northEast.lng);
			var bounds  = L.latLngBounds(corner1, corner2);
			map.fitBounds(bounds);
		}
		else {
			// on recadre à l'origine
			if (originBounds)
				map.fitBounds(originBounds);
		}
	}
	
	if (hopt != el.offsetHeight) {
		el.style.height = hopt+'px';
		el.style.maxHeight = hopt+'px';
	}
}
window.addEventListener('resize', resizeMap);
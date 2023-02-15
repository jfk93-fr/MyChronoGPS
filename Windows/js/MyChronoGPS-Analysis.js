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

//var Circuit = false;
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

document.getElementById('map').style.display = 'block';
map = true;

loadCircuits();

function dataCircuitsReady() {
	loadCoords();
	//console.log(JSON.stringify(Coords))
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

//// Initialize API Googlemap
//function initGooglemap() {
//  document.getElementById('map').style.display = 'block';
//  map = true;
//}
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

    //optionsMap = {
    //     zoom: zoom,
    //     center: new google.maps.LatLng(lat,lon),
    //     draggableCursor:"crosshair",
    //     mapTypeId: google.maps.MapTypeId.SATELLITE
    //};
	//
	//map = new google.maps.Map(document.getElementById('map'), optionsMap);
	map = L.map('map').setView([lat,lon],zoom);
	
	var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
	Esri_WorldImagery.addTo(map);	
	
	// Assumes your Leaflet map variable is 'map'..
	L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');

	lat = thisCircuit.Latitude*1;
	lon = thisCircuit.Longitude*1;
	//var point = {lat: lat, lng: lon};
	var markerpoint = L.latLng(lat,lon);
	//var markerpoint = {lat: lat, lng: lon};
	//currentmarker = new google.maps.Marker({
	//	position: markerpoint, title: thisCircuit.NomCircuit
	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank.png'
	//	,draggable: true
	//});
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
	
	//infoBulle = new google.maps.InfoWindow({
	//	content: info
	//});
	//
	//google.maps.event.addListener(currentmarker, 'mouseover', function() {
	//	document.getElementById("zone-info").innerHTML = '<B>'+thisCircuit.NomCircuit+'</B>';
	//});
	//
	//google.maps.event.addListener(currentmarker, 'click', function() {
  	//    infoBulle.open(map, currentmarker);
	//});
	//
	//google.maps.event.addListener(map, 'mousemove', function(event) {
	//	mouseMove(event);
	//});
	//
	//google.maps.event.addListener(map, 'rightclick', function(event) {
	//	copyClipboard(event);
	//});

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

	//google.maps.event.addListener(map, 'center_changed', function(event) {
	//	var center = map.getCenter();
	//	el = document.getElementById("Latcenter");
	//	if (el)
	//		el.value = center.lat();
	//	el = document.getElementById("Loncenter");
	//	if (el)
	//		el.value = center.lng();
	//});
	//
	//google.maps.event.addListener(map, 'zoom_changed', function(event) {
	//	var zoom = map.getZoom();
	//	el = document.getElementById("Zoom");
	//	if (el)
	//		el.value = zoom;
	//});
	//
	//currentmarker.setMap(map);
	
	showLines();
	
}

function showData() {
	var el;
	el = document.getElementById("NomCircuit");
	if (thisCircuit.NomCircuit) {
		el.value = thisCircuit.NomCircuit;
	}
	else el.style.display = 'none';

	//el = document.getElementById("Adresse");
	//if (thisCircuit.Adresse) {
	//	el.value = thisCircuit.Adresse;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("CodePostal");
	//if (thisCircuit.CodePostal) {
	//	el.value = thisCircuit.CodePostal;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("Ville");
	//if (thisCircuit.Ville) {
	//	el.value = thisCircuit.Ville;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("URL");
	//if (thisCircuit.URL) {
	//	el.value = thisCircuit.URL;
	//}
	//else el.style.display = 'none';

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

	//el = document.getElementById("Latcenter");
	//if (thisCircuit.Latcenter) {
	//	el.value = thisCircuit.Latcenter;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("Loncenter");
	//if (thisCircuit.Loncenter) {
	//	el.value = thisCircuit.Loncenter;
	//}
	//else el.style.display = 'none';

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
	//console.log("FL:"+thisCircuit.FL)
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

	/* FL en lat,lon,cap */
	//el = document.getElementById("LatFL");
	//if (thisCircuit.LatFL) {
	//	el.value = thisCircuit.LatFL;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("LonFL");
	//if (thisCircuit.LonFL) {
	//	el.value = thisCircuit.LonFL;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("CapFL");
	//if (thisCircuit.CapFL) {
	//	el.value = thisCircuit.CapFL;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("LatInt1");
	//if (thisCircuit.LatInt1) {
	//	el.value = thisCircuit.LatInt1;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("LonInt1");
	//if (thisCircuit.LonInt1) {
	//	el.value = thisCircuit.LonInt1;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("CapInt1");
	//if (thisCircuit.CapInt1) {
	//	el.value = thisCircuit.CapInt1;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("LatInt2");
	//if (thisCircuit.LatInt2) {
	//	el.value = thisCircuit.LatInt2;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("LonInt2");
	//if (thisCircuit.LonInt2) {
	//	el.value = thisCircuit.LonInt2;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("CapInt2");
	//if (thisCircuit.CapInt2) {
	//	el.value = thisCircuit.CapInt2;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("LatInt3");
	//if (thisCircuit.LatInt3) {
	//	el.value = thisCircuit.LatInt3;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("LonInt3");
	//if (thisCircuit.LonInt3) {
	//	el.value = thisCircuit.LonInt3;
	//}
	//else el.style.display = 'none';
	//
	//el = document.getElementById("CapInt3");
	//if (thisCircuit.CapInt3) {
	//	el.value = thisCircuit.CapInt3;
	//}
	//else el.style.display = 'none';
}

function showLines() {
	var isObjLine = false;
	if (thisCircuit.LatFL && thisCircuit.LonFL) {
		objStart.lat = thisCircuit.LatFL*1;
		objStart.lon = thisCircuit.LonFL*1;
		objStart.cap = thisCircuit.CapFL*1;
		if (isNaN(objStart.cap))
			objStart.cap = 0;
		objStart.title = "Ligne de départ/arrivée";
		objStart.color = "black";
		objStart.idelem = "FL";
		//drawLine(objStart);
		isObjLine = true;
	}
	if (thisCircuit.FL) {
		objStart.coord = new Array(thisCircuit.FL[0]*1,thisCircuit.FL[1]*1,thisCircuit.FL[2]*1,thisCircuit.FL[3]*1);
		objStart.title = "Ligne de départ/arrivée";
		objStart.color = "black";
		objStart.idelem = "FL";
		isObjLine = true;
	}
	if (isObjLine) {
		//console.log("drawLine(objStart)")
		drawLine(objStart);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatInt1 && thisCircuit.LonInt1) {
		Tabint[0] = new Object();
		Tabint[0].lat = thisCircuit.LatInt1*1;
		Tabint[0].lon = thisCircuit.LonInt1*1;
		Tabint[0].cap = thisCircuit.CapInt1*1;
		if (isNaN(Tabint[0].cap))
			Tabint[0].cap = 0;
		Tabint[0].title = "Intermédiaire 1";
		Tabint[0].color = "yellow";
		Tabint[0].idelem = "Int1";
		isObjLine = true;
	}
	if (thisCircuit.Int1) {
		Tabint[0] = new Object();
		Tabint[0].coord = new Array(thisCircuit.Int1[0]*1,thisCircuit.Int1[1]*1,thisCircuit.Int1[2]*1,thisCircuit.Int1[3]*1);
		Tabint[0].title = "Intermédiaire 1";
		Tabint[0].color = "yellow";
		Tabint[0].idelem = "Int1";
		isObjLine = true;
	}
	if (isObjLine) {
		//console.log("drawLine(objStart)")
		drawLine(Tabint[0]);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatInt2 && thisCircuit.LonInt2) {
		Tabint[1] = new Object();
		Tabint[1].lat = thisCircuit.LatInt2*1;
		Tabint[1].lon = thisCircuit.LonInt2*1;
		Tabint[1].cap = thisCircuit.CapInt2*1;
		if (isNaN(Tabint[1].cap))
			Tabint[1].cap = 0;
		Tabint[1].title = "Intermédiaire 2";
		Tabint[1].color = "yellow";
		Tabint[1].idelem = "Int2";
		isObjLine = true;
	}
	if (thisCircuit.Int2) {
		Tabint[1] = new Object();
		Tabint[1].coord = new Array(thisCircuit.Int2[0]*1,thisCircuit.Int2[1]*1,thisCircuit.Int2[2]*1,thisCircuit.Int2[3]*1);
		Tabint[1].title = "Intermédiaire 2";
		Tabint[1].color = "yellow";
		Tabint[1].idelem = "Int2";
		isObjLine = true;
	}
	if (isObjLine) {
		//console.log("drawLine(objStart)")
		drawLine(Tabint[1]);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatInt3 && thisCircuit.LonInt3) {
		Tabint[2] = new Object();
		Tabint[2].lat = thisCircuit.LatInt3*1;
		Tabint[2].lon = thisCircuit.LonInt3*1;
		Tabint[2].cap = thisCircuit.CapInt3*1;
		if (isNaN(Tabint[2].cap))
			Tabint[2].cap = 0;
		Tabint[2].title = "Intermédiaire 3";
		Tabint[2].color = "yellow";
		Tabint[2].idelem = "Int3";
		isObjLine = true;
	}
	if (thisCircuit.Int3) {
		Tabint[2] = new Object();
		Tabint[2].coord = new Array(thisCircuit.Int3[0]*1,thisCircuit.Int3[1]*1,thisCircuit.Int3[2]*1,thisCircuit.Int3[3]*1);
		Tabint[2].title = "Intermédiaire 3";
		Tabint[2].color = "yellow";
		Tabint[2].idelem = "Int3";
		isObjLine = true;
	}
	if (isObjLine) {
		drawLine(Tabint[2]);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatPitIn && thisCircuit.LonPitIn) {
		objPitIn = new Object();
		objPitIn.lat = thisCircuit.LatPitIn*1;
		objPitIn.lon = thisCircuit.LonPitIn*1;
		objPitIn.cap = thisCircuit.CapPitIn*1;
		if (isNaN(objPitIn.cap))
			objPitIn.cap = 0;
		objPitIn.title = "entrée Pitlane";
		objPitIn.color = "red";
		objPitIn.idelem = "PitIn";
		isObjLine = true;
	}
	if (thisCircuit.PitIn) {
		objPitIn = new Object();
		objPitIn.coord = new Array(thisCircuit.PitIn[0]*1,thisCircuit.PitIn[1]*1,thisCircuit.PitIn[2]*1,thisCircuit.PitIn[3]*1);
		objPitIn.title = "entrée Pitlane";
		objPitIn.color = "red";
		objPitIn.idelem = "PitIn";
		isObjLine = true;
	}
	if (isObjLine) {
		drawLine(objPitIn);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatPitOut && thisCircuit.LonPitOut) {
		objPitOut = new Object();
		objPitOut.lat = thisCircuit.LatPitOut*1;
		objPitOut.lon = thisCircuit.LonPitOut*1;
		objPitOut.cap = thisCircuit.CapPitOut*1;
		if (isNaN(objPitOut.cap))
			objPitOut.cap = 0;
		objPitOut.title = "sortie Pitlane";
		objPitOut.color = "green";
		objPitOut.idelem = "PitOut";
		isObjLine = true;
	}
	if (thisCircuit.PitOut) {
		objPitOut = new Object();
		objPitOut.coord = new Array(thisCircuit.PitOut[0]*1,thisCircuit.PitOut[1]*1,thisCircuit.PitOut[2]*1,thisCircuit.PitOut[3]*1);
		objPitOut.title = "sortie Pitlane";
		objPitOut.color = "green";
		objPitOut.idelem = "PitOut";
		isObjLine = true;
	}
	if (isObjLine) {
		//console.log("drawLine(objStart)")
		drawLine(objPitOut);
	}
}

function point2Line(line) {
	//var center = map.getCenter(); // on met de côté le centrage actuel
	//// On recentre la map avec le zoom d'origine
	//resetScreen();
	
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
		//setMaxZoom(obj.coord[0],obj.coord[1]); // recentrage sur les coordonnées at zoom max
		setCenter(obj.coord[0],obj.coord[1]); // maintenant, on fait juste un recentrage sans changer le zoom
		return;
	}	
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
	//map.setZoom(zoom);
	L.setZoom(zoom);
	lat = thisCircuit.Latcenter*1;
	lon = thisCircuit.Loncenter*1;
	//var googleLatLng = new google.maps.LatLng(lat,lon); 
	var LatLng = L.latLng(lat,lon); 
	//map.setCenter(googleLatLng);
	map.panTo(LatLng);
}

function setCenter(zlat=thisCircuit.Latcenter*1,zlon=thisCircuit.Loncenter*1) {
	//var googleLatLng = new google.maps.LatLng(zlat,zlon); 
	var LatLng = L.latLng(zlat,zlon); 
	//map.setCenter(googleLatLng);
	map.panTo(LatLng);
}
function setMaxZoom(zlat=thisCircuit.Latcenter*1,zlon=thisCircuit.Loncenter*1,max=20) {
	//setCenter(zlat,zlon);
	var LatLng = L.latLng(zlat,zlon); 
	map.panTo(LatLng);
	var oldz = map.getZoom();
	var newz = oldz + max;
	if (newz !='NaN') {
		//map.setZoom(newz);
		L.setZoom(newz);
	}
}
function setOriginZoom(zlat=thisCircuit.Latcenter*1,zlon=thisCircuit.Loncenter*1,max=20) {
	var newz = thisCircuit.Zoom*1;
	//setCenter(zlat,zlon);
	var LatLng = L.latLng(zlat,zlon); 
	map.panTo(LatLng);
	if (newz !='NaN') {
		//map.setZoom(newz);
		L.setZoom(newz);
	}
}

function accueil() {
	document.getElementById('analyzer').style.display = 'none';
	objStart = new Object(); // Tableau des coordonnées de la ligne de départ
	Tabint = new Array(); // Tableau des coordonnées des intérmédiaires (partiels)
	objPitIn = new Object(); // Tableau des coordonnées de l'entrée de la pitlane
	objPitOut = new Object(); // Tableau des coordonnées de la sortie de la pitlane
}

function doAnalysis() {
	document.getElementById('analyzer').style.display = 'none';
}

function go()
{
	document.getElementById('analyzer').style.display = 'block';
	// la première ligne du fichier, contient normalement le circuit sur lequel les sessions ont été enregistrées

	if (!Array.isArray(Coords)) {
		// on n'a pas réussi à charger les coordonnées
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = 'problème détecté';
		return false;
	}
	//console.log(JSON.stringify(Coords));
		
	curr_coord = 0;
	Ev = eval(Coords[curr_coord]);
	retour = Ev; //jfk
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
	
	//var is_FL = thisCircuit.hasOwnProperty('FL');
	//
	// on va construire le tableau des Tours à partir de FL
	FL = new Array(thisCircuit.FL[0]*1,thisCircuit.FL[1]*1,thisCircuit.FL[2]*1,thisCircuit.FL[3]*1);
	buildTours(FL);
	// le tableau des Tours est construit

	// dès la première ligne du fichier, on va chercher le circuit correspondant
	nb_tours = Tours.length;
	var i = 0;
	Tour = Tours[i];
	Points = Tour.points;
	//var nbpoints = Points.length;
	//console.log("nbpoints:"+nbpoints);
	
	// on va déterminer la fréquence d'envoi des trames (généralement entre 1 et 10 Hz)
	var T0 = getObjTime(Points[2].timestamp); // on prend un premier point un peu plus loin que la ligne de coupure
	var T1 = getObjTime(Points[3].timestamp); // car si la ligne est autodéfinie, il peut y avoir un grand écart de temps entre les points 0 & 1
	var dT = T1.getTime() - T0.getTime();
	//console.log('fréquence d\'envoi des trames:'+JSON.stringify(dT));
	Frequence = 1000/dT;

	latitude = Points[0].lat1;
	longitude = Points[0].lon1;
	//console.log("lat:"+latitude+",lon:"+longitude)
	
	var trackfound = scanCircuit();
	
	//
	// si le circuit existe dans la première ligne du fichier et qu'on a trouvé la définition de la ligne de départ/arrivée,
	// on prend les coordonnées inscrites pour afficher la map.
	// sinon, on utilise le point gps indiqué dans la première ligne du fichier pour rechercher le circuit.
	//if (!is_FL) {
	//	if (!trackfound)
	//		return;
	//}
	
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
		//console.log("Tour:"+Tours[i].id);
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
	//var is_FL = thisCircuit.hasOwnProperty('FL');
	
	//console.log('FL:+'+FL);
	
	// traitement de tous les points gps
	while (curr_coord < nb_coords-1) {
		Point0 = Point1;
		Ev = eval(Coords[curr_coord]);
		Point1 = Ev[0];
		if (!Point0) {
			//console.log('Point0 absent');
			curr_coord++
			continue;
		}
		//console.log(JSON.stringify(Point0));
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
				Point.altitude = Point1.altitude;
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
			Point.altitude = Point0.altitude;
			Point.cap = Point1.cap;
	
			Tour.points.push(Point);
		}

		if (tour == 0) {
			//console.log('tour non commencé, n coord:'+curr_coord);
			curr_coord++
			continue;
		}


		Point1.tour = tour;
			

			
		/*
		if (Point1.tour != tour) {
			tour = Point1.tour;
			// On stocke le tour dans le tableau
			if (Tour) {
				Tours.push(Tour);
			}
			// On prépare le nouveau tour
		    Tour = new Object();
			Tour.id = Point1.tour;
			Tour.points = new Array()
			Tour.line = '';
			Tour.show = false;
			Tour.valid = true; // le tour est valide s'il contient des points gps à fréquence régulière, un écart de +20" environ invalide le tour
			nt = Tours.length-1;
			np = 0;
		}
		*/

		if (!prevTimestamp)
			prevTimestamp = Point1.timestamp;
		//console.log('num coord:'+curr_coord);
		//console.log('prevTimestamp:'+prevTimestamp);
		//console.log('Point1.timestamp:'+Point1.timestamp);
		var T0 = getObjTime(prevTimestamp);
		var T1 = getObjTime(Point1.timestamp);
		var dT = T1.getTime() - T0.getTime();
		//if (dT > 20000) {
		//	//console.log('Tour invalide Point1.timestamp:'+Point1.timestamp);
		//	Tour.valid = false;
		//}
		prevTimestamp = Point1.timestamp;

		Point = new Object();
		Point.timestamp = Point1.timestamp;
		Point.lat1 = Point1.pointgps[0];
		Point.lon1 = Point1.pointgps[1];
		Point.vitesse = Point1.vitesse;
		Point.altitude = Point1.altitude;
		Point.cap = Point1.cap;

		curr_coord++

		Tour.points.push(Point);
		
		if (nt > 0 && np <= 1) {
			// on va ajouter les points 0 & 1 à la fin du tour précédent
			//console.log('on va ajouter les points 0 & 1 à la fin du tour précédent');
			Point = new Object();
			Point.timestamp = Tours[nt].points[np].timestamp;
			Point.lat1 = Tours[nt].points[np].lat1;
			Point.lon1 = Tours[nt].points[np].lon1;
			Point.vitesse = Tours[nt].points[np].vitesse;
			Point.altitude = Tours[nt].points[np].altitude;
			Point.cap = Tours[nt].points[np].cap;
			Tours[nt-1].points.push(Point);
		}

		np++;
	}
	//console.log(Tours);
	// ne ratons pas le dernier tour
	if (Tour) {
		Tours.push(Tour);
		//console.log('ne ratons pas le dernier tour');
		// on va ajouter le points 0 & 1 à la fin du tour précédent
		nt = Tours.length-1;
		if (nt > 0) {
			//console.log(JSON.stringify(Tours[nt-1]))
			//console.log(JSON.stringify(Tours[nt]))
			for (var np=0; np < 2; np++) {
				Point = new Object();
				Point.timestamp = Tours[nt].points[np].timestamp;
				Point.lat1 = Tours[nt].points[np].lat1;
				Point.lon1 = Tours[nt].points[np].lon1;
				Point.vitesse = Tours[nt].points[np].vitesse;
				Point.altitude = Tours[nt].points[np].altitude;
				Point.cap = Tours[nt].points[np].cap;
				Tours[nt-1].points.push(Point);
			}
			//console.log(JSON.stringify(Tours[nt-1]))
			//console.log(JSON.stringify(Tours[nt]))
		}
	}
}

function initCircuit(track) {
	//console.log(JSON.stringify(thisCircuit));
	//if (!thisCircuit.NomCircuit) // si le nom du circuit est absent alors on réinitialise complètement l'objet circuit
	if (!thisCircuit) // si le nom du circuit est absent alors on réinitialise complètement l'objet circuit
		thisCircuit = new Object();
	//console.log(JSON.stringify(track));
	for (property in track) {
		//console.log(`${property}: ${track[property]}`);
		if (!thisCircuit[property])
			thisCircuit[property] = track[property];
	}
	//console.log(JSON.stringify(thisCircuit));
}

function scanCircuit() {
	var trackfound = false;
	if (Circuit == false)
		return trackfound
	if (Circuit.hasOwnProperty('msgerr')) {
		if (Circuit.msgerr != '')
			return trackfound
	}
	//console.log(JSON.stringify(thisCircuit))
	//console.log(JSON.stringify(Circuit))
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
		drawLineWithCoord(objline)
	else
		drawLineWithCap(objline)
}

function drawLineWithCoord(objline) {
	// on va tracer un segment de droite à partir des coordonnées de ses extrémités

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	//objline.line = new google.maps.Polyline({
	//	path: pathCoordinates,
	//	geodesic: true,
	//	strokeColor: objline.color,
	//	//strokeColor: "black",
	//	strokeOpacity: 1.0,
	//	strokeWeight: 5
	//});
	//objline.line.setMap(map);
	objline.line = new L.polyline(pathCoordinates, {color: objline.color});
	map.addLayer(objline.line);	
}

function drawLineWithCap(objline) {
	// on va tracer un segment de droite à partir de son milieu et en utilisant le cap fourni 
	
	// on recherche le point B à 50 mètres du point A selon le cap fourni
	var dist = 50; // 50m
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);	
	var A = new Array(objline.lat,objline.lon);

	// On trace une ligne passant par le point start, perpendiculaire à la droite point start;point gps et 2 points (P1;P-1)
	// situés de part et d'autre du point start à une distance égale à la largeur de la piste
	var icoord = getPerpendiculaire(A,B);
	var coord1 = pointDroite(A,new Array(icoord[0],icoord[1]),largeur_piste); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 
	var coord2 = pointDroite(A,new Array(icoord[2],icoord[3]),largeur_piste); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 

	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de
	if (Array.isArray(icoord)) {
		//var pathCoordinates = [{lat: coord1[0], lng: coord1[1]},{lat: coord2[0], lng: coord2[1]}];
		//objline.line = new google.maps.Polyline({
		//	path: pathCoordinates,
		//	geodesic: true,
		//	strokeColor: objline.color,
		//	strokeOpacity: 1.0,
		//	strokeWeight: 5
		//});
		//objline.line.setMap(map);
		objline.linecap = new L.polyline(pathCoordinates, {color: objline.color});
		map.addLayer(objline.linecap);	
	}
	objline.coord = new Array(coord1[0],coord1[1],coord2[0],coord2[1]);
	
	//// Pour les test on va rajouter un marqueur sur la perpendiculaire passant par la droite point de départ, bord de départ
	//var ncoord = getPerpendiculaire(new Array(objline.lat, objline.lon),new Array(objline.coord[2], objline.coord[3]));
	//var markerpoint = {lat: ncoord[0], lng: ncoord[1]};
	//objline.markerP1 = new google.maps.Marker({
	//	position: markerpoint, title: objline.title+' - P1'
	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/4.png'
	//	,draggable: true
	//	});
	//objline.markerP1.setMap(map);
	
	//displayAngle(objline);
	
	//displayCercleTrigo(objline);
	
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
	//markerA1 = new google.maps.Marker({
	//	position: markerpoint, title: 'A1-'+A[0]+','+A[1]
	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-circle-lv.png'
	//	});
	//markerA1.setMap(map);
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
		//markerA2.setMap(null);
		map.removeLayer(objline.markerA2)
		markerA2 = '';
	}
	//markerA2 = new google.maps.Marker({
	//	position: markerpoint, title: 'A2-'+A[0]+','+A[1]
	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-circle-lv.png'
	//	});
	//markerA2.setMap(map);
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/wht-circle-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerA2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'A2-'+A[0]+','+A[1]});
	map.addLayer(objline.markerA2);
	
	// On trace une ligne pour matérialiser le segment de droite
	if (segment1 != '') {
		//segment1.setMap(null);
		map.removeLayer(segment1);
		segment1 = '';
	}
	var pathCoordinates = [{lat: coord[0], lng: coord[1]},{lat: coord[2], lng: coord[3]}];
	//segment1 = new google.maps.Polyline({
	//	path: pathCoordinates,
	//	geodesic: true,
	//	strokeColor: "white",
	//	strokeOpacity: 0.2,
	//	strokeWeight: 6
	//});
	//segment1.setMap(map);
	segment1 = new L.polyline(pathCoordinates, {color: "white"});
	map.addLayer(segment1);
	
	// On marque les extrémités du premier segment de droite
	var A = new Array(coord[4],coord[5]);
	var markerpoint = {lat: A[0], lng: A[1]};
	
	if (markerB1 != '') {
		//markerB1.setMap(null);
		map.removeLayer(markerB1);
		markerB1 = '';
	}
	//markerB1 = new google.maps.Marker({
	//	position: markerpoint, title: 'B1-'+A[0]+','+A[1]
	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/1-lv.png'
	//	});
	//markerB1.setMap(map);
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
		//markerB2.setMap(null);
		map.removeLayer(markerB2);
		markerB2 = '';
	}
	//markerB2 = new google.maps.Marker({
	//	position: markerpoint, title: 'B2-'+A[0]+','+A[1]
	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/2-lv.png'
	//	});
	//markerB2.setMap(map);
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/2-lv.png',
		iconAnchor: [8, 16]
	});	
	objline.markerB2 = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'B2-'+A[0]+','+A[1]});
	map.addLayer(objline.markerB2);	
	
	// On trace une ligne pour matérialiser le segment de droite
	if (segment2 != '') {
		//segment2.setMap(null);
		map.removeLayer(segment2);
		segment2 = '';
	}
	var pathCoordinates = [{lat: coord[4], lng: coord[5]},{lat: coord[6], lng: coord[7]}];
	//segment2 = new google.maps.Polyline({
	//	path: pathCoordinates,
	//	geodesic: true,
	//	strokeColor: "pink",
	//	strokeOpacity: 1.0,
	//	strokeWeight: 2
	//});
	//segment2.setMap(map);
	segment2 = new L.polyline(pathCoordinates, {color: "pink"});
	map.addLayer(segment2);
}

function designLap(lap) {
	var il = lap-1;
	//
	// On construit le polygone représentant le tour
	Points = Tours[il].points;
	//var pathcoords = new Array();
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

	//
	// Pour construire le polygone on traite les points, point par point
	for (var i=0; i < Points.length; i++) {
		//console.log(JSON.stringify(Points[i]));
		var pcoord = new Object();
		pcoord.lat = Points[i].lat1;
		pcoord.lng = Points[i].lon1;
		//pathcoords.push(pcoord);

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
			//var linecoord = objStart.coord;
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
				//console.log('temps départ:'+time_start);
				//console.log('temps fin:'+time_arrival);
				//console.log('temps de coupure:'+JSON.stringify(Tcut));
                Points[i].timecut = time_arrival - time_start;		
				// s'il s'agit d'un point de coupure, on l'indique dans le chemin
				//var latlng = new google.maps.LatLng(pointCut[0], pointCut[1]);
				var latlng = L.latLng(pointCut[0], pointCut[1]);
				var CP = getIntersectionSphere(parmCut.linecoord,parmCut.segcoords);
				Points[i].CP = CP;
				//console.log('geocoords CP:'+geocoords.length);
				//console.log('pointCut:'+JSON.stringify(Tcut.pointCut)+';CP:'+JSON.stringify(CP));
			}
			else {
				//var latlng = new google.maps.LatLng(pcoord.lat, pcoord.lng);
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
					//linecut = Tcut.linecut;
					if (Tcut.linecut) {
						//console.log(j);
						//console.log('parm:'+JSON.stringify(parmCut));
						//console.log('ret :'+JSON.stringify(Tcut));
						pointCut = Tcut.pointCut;
						time_sect[j] = Tcut.tfin;
						k = j+1;
						if (k < Tabint.length)
							time_prev[k] = Tcut.tfin;
                        Points[i].timecut = time_sect[j] - time_prev[j];		
                        Points[i].icut = j+1;		
						//console.log('temps prev:'+time_prev[j]);
						//console.log('temps sect:'+time_sect[j]);
						//console.log('temps de coupure:'+JSON.stringify(Tcut));
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
	//console.log('temps départ:'+time_start);
	//console.log('temps fin:'+time_arrival);
	//console.log('temps départ intermédiaire:'+JSON.stringify(time_prev));
	//console.log('temps fin intermédiaire:'+JSON.stringify(time_sect));
	if (Tabint.length > 0) {
		Tours[il].timeSect = new Array();
	}
	for (var j=0; j < Tabint.length; j++) {
		if (Tabint[j].coord) {
			if (time_sect[j]) {
				var time_sector = time_sect[j] - time_prev[j];
				var time2display = formatMMSS(time_sector);
				//Tours[il].timeSect[j] = time2display;
				Tours[il].timeSect.push(time2display);
				var time_lastsect = time_arrival - time_sect[j];
			}
		}
	}
	if (j>0) {
		var time2display = formatMMSS(time_lastsect);
		Tours[il].timeSect.push(time2display);
	}
	//console.log(JSON.stringify(Tours[il].timeSect));
		
	// Le polygone est construit et prêt à être affiché dans la map
	//Tours[il].pathRun = pathcoords;
	Tours[il].pathRun = geocoords;

	//console.log(JSON.stringify(geocoords));
	//var lenLap = google.maps.geometry.spherical.computeLength(geocoords);
	var lenLap = 0; // on va calculer une autre fois
	//console.log(JSON.stringify(lenLap));
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
	
	//var linecut = isLineCut(linecoord,segcoords);
	var linecut = false;
	var pointCut = getIntersection(linecoord,segcoords);
	//console.log('linecut:'+linecut+' coord:',segcoords);
	
	//if (linecut) {
	if (pointCut != false) {
		linecut = true;
		//console.log('ligne franchie');
		// On va calculer les distances entre le point, le point b et la ligne franchie
		//console.log('coordonnées line:'+linecoord[0]+','+linecoord[1]+'-'+linecoord[2]+','+linecoord[3]);
		//console.log('coordonnées segment:'+segcoords[0]+','+segcoords[1]+'-'+segcoords[2]+','+segcoords[3]);
		var dist0 = getDistanceLine(linecoord,new Array(segcoords[0],segcoords[1]));
		//console.log('dist0:'+dist0);
		var distseg = distanceGPS(new Array(segcoords[0],segcoords[1]),new Array(segcoords[2],segcoords[3]))
		//console.log('distseg:'+distseg);
		var dist1 = getDistanceLine(linecoord,new Array(segcoords[2],segcoords[3]));
		//console.log('dist1:'+dist1);
		//console.log('somme d0 d1:'+(dist0+dist1));
		
		//var pointCut = getIntersection(linecoord,segcoords);

		var corrtime = dt1.getTime() - dt0.getTime();
		//console.log('deb secteur:'+dt0.getTime()+' fin secteur:'+dt1.getTime());
		
		var vs0 = (v0*1000)/3600;
		var vs1 = (v1*1000)/3600;
		var vmoy = (vs0+vs1)/2;
		
		var dc0 = dist0*(vs1/vmoy);
		var dc1 = dist1*(vs0/vmoy);
	
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
			//Tours[il].polyline.setMap(null);
			map.removeLayer(Tours[il].polyline);
			Tours[il].polyline = '';
			if (Tours[il].markerPC) {
				if (Tours[il].markerPC != '') {
					//Tours[il].markerPC.setMap(null);
					map.removeLayer(Tours[il].markerPC);
					Tours[il].markerPC = '';
				}
			}
			if (Tours[il].markerD1) {
				if (Tours[il].markerD1 != '') {
					//Tours[il].markerD1.setMap(null);
					map.removeLayer(Tours[il].markerD1);
					Tours[il].markerD1 = '';
				}
			}
			if (Tours[il].markerD2) {
				if (Tours[il].markerD2 != '') {
					//Tours[il].markerD2.setMap(null);
					map.removeLayer(Tours[il].markerD2);
					Tours[il].markerD2 = '';
				}
			}
			if (Tours[il].segment0) {
				if (Tours[il].segment0 != '') {
					//Tours[il].segment0.setMap(null);
					map.removeLayer(Tours[il].segment0);
					Tours[il].segment0 = '';
				}
			}
			if (Tours[il].segment1) {
				if (Tours[il].segment1 != '') {
					//Tours[il].segment1.setMap(null);
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

	//Tours[il].polyline = new google.maps.Polyline({
	//	path: Tours[il].pathRun,
	//	geodesic: true,
	//	//strokeColor: 'blue',
	//	strokeColor: Tours[il].linecolor,
	//	strokeOpacity: 1.0,
	//	strokeWeight: 2
	//});
	//Tours[il].polyline.setMap(map);
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
	//console.log(markerpoint);
	//Tours[il].markerPC = new google.maps.Marker({
	//	position: markerpoint, title: 'tour '+Tours[il].id+': '+Tours[il].timeLap+' ('+Math.round(Tours[il].vmax*1)+')'
	//	//,icon: 'http://maps.google.com/mapfiles/kml/paddle/1-lv.png'
	//	,visible: true
	//	});
	//Tours[il].markerPC.setMap(map);
	var localIcon = L.icon({
		iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/1-lv.png',
		iconAnchor: [8, 16]
	});	
	Tours[il].markerPC = new L.Marker(markerpoint,{icon:localIcon, draggable:false, title: 'tour '+Tours[il].id+': '+Tours[il].timeLap+' ('+Math.round(Tours[il].vmax*1)+')'});
	map.addLayer(Tours[il].markerPC);
//		
//	// affichage du point de début du tour (avant passage de la ligne)
//	if (Tours[il].markerD1) {
//		if (Tours[il].markerD1 != '') {
//			Tours[il].markerD1.setMap(null);
//			Tours[il].markerD1 = '';
//		}
//	}
//	var markerpoint = Tours[il].pathRun[0];
//	//console.log(markerpoint);
//	Tours[il].markerD1 = new google.maps.Marker({
//		position: markerpoint, title: 'D1 '+Tours[il].points[0].timestamp
//		,icon: 'http://maps.google.com/mapfiles/kml/paddle/1-lv.png'
//		});
//	Tours[il].markerD1.setMap(map);
//		
//	if (Tours[il].segment0) {
//		if (Tours[il].segment0 != '') {
//			Tours[il].segment0.setMap(null);
//			Tours[il].segment0 = '';
//		}
//	}
//	var pathsegment = new Array(Tours[il].pathRun[0],Tours[il].pathRun[1]);
//	Tours[il].segment0 = new google.maps.Polyline({
//		path: pathsegment,
//		geodesic: true,
//		//strokeColor: 'blue',
//		strokeColor: 'white',
//		strokeOpacity: 1.0,
//		strokeWeight: 2
//	});
//	Tours[il].segment0.setMap(map);
	
	var l = Tours[il].pathRun.length-1;
	//console.log(l);
				
//	// affichage du point de fin du tour (après passage de la ligne)
//	if (Tours[il].markerD2) {
//		if (Tours[il].markerD2 != '') {
//			Tours[il].markerD2.setMap(null);
//			Tours[il].markerD2 = '';
//		}
//	}
//	var markerpoint = Tours[il].pathRun[l];
//	//console.log(markerpoint);
//	Tours[il].markerD2 = new google.maps.Marker({
//		position: markerpoint, title: 'D2 '+Tours[il].points[l].timestamp
//		,icon: 'http://maps.google.com/mapfiles/kml/paddle/2-lv.png'
//		});
//	Tours[il].markerD2.setMap(map);
//		
//	//if (markerDB != '') {
//	//	markerDB.setMap(null);
//	//	markerDB = '';
//	//}
//	//var markerpoint = Tours[il].pathRun[0];
//	//console.log(markerpoint);
//	//markerDB = new google.maps.Marker({
//	//	position: markerpoint, title: 'DB'
//	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/2-lv.png'
//	//	});
//	//markerDB.setMap(map);
//		
//	if (Tours[il].segment1) {
//		if (Tours[il].segment1 != '') {
//			Tours[il].segment1.setMap(null);
//			Tours[il].segment1 = '';
//		}
//	}
//	var pathsegment = new Array(Tours[il].pathRun[l],Tours[il].pathRun[l-1]);
//	Tours[il].segment1 = new google.maps.Polyline({
//		path: pathsegment,
//		geodesic: true,
//		//strokeColor: 'blue',
//		strokeColor: 'black',
//		strokeOpacity: 1.0,
//		strokeWeight: 2
//	});
//	Tours[il].segment1.setMap(map);
	
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
	sm = tt[0].substr(2,2);
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
		//simup0.setMap(null);
		map.removeLayer(simup0);
		simup0 = '';
	}
	if (simup1 != '') {
		//simup1.setMap(null);
		map.removeLayer(simup1);
		simup1 = '';
	}
	
	simupoint = 0;  // on reviens au premier point du tour
}

function simuForward() {
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
	if (simu_freq <= 10)
		simu_freq = simu_freq * 1.3;
}

function simuSlower() {
	if (simu_freq >= 0.1)
		simu_freq = simu_freq * 0.8;
}

function simuBackward() {
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
		//simup0.setMap(null);
		map.removeLayer(simup0)
		simup0 = '';
	}
	if (simup1 != '') {
		//simup1.setMap(null);
		map.removeLayer(simup1)
		simup1 = '';
	}

	var cap = Tours[il].points[i0].cap;

	var markerpoint = {lat: Tours[il].points[i0].lat1, lng: Tours[il].points[i0].lon1};
	//console.log(markerpoint);
	//simup0 = new google.maps.Marker({
	//	position: markerpoint,
	//	title: 'T:'+Tours[il].points[i0].timestamp+'\r\n'+
	//	       'v:'+Math.round(Tours[il].points[i0].vitesse)+'km/h\r\n'+
	//	       'alt:'+Math.round(Tours[il].points[i0].altitude)+'m\r\n'+
	//		   'cap:'+Math.round(Tours[il].points[i0].cap*10)/10+'° '
	//	,icon: {
	//		path: google.maps.SymbolPath.CIRCLE,
	//		rotation: cap,
	//		fillColor: "yellow",
	//		fillOpacity: 0.6,
	//		scale: 5,
	//		strokeColor: "gold",
	//		strokeWeight: 2,
	//
	//		}
	//	});
	//simup0.setMap(map);
	//$$$$var	title = 'T:'+Tours[il].points[i0].timestamp+'\r\n'+
	//$$$$	       'v:'+Math.round(Tours[il].points[i0].vitesse)+'km/h\r\n'+
	//$$$$	       'alt:'+Math.round(Tours[il].points[i0].altitude)+'m\r\n'+
	//$$$$		   'cap:'+Math.round(Tours[il].points[i0].cap*10)/10+'° ';
	//$$$$var localIcon = L.icon({
	//$$$$	iconUrl: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png',
	//$$$$	iconAnchor: [8, 16]
	//$$$$});	
	//$$$$simup0 = new L.Marker(markerpoint,{draggable:true, title: title, rotationAngle:cap});
	//$$$$map.addLayer(simup0);

	var cap = Tours[il].points[i1].cap;

	var markerpoint = {lat: Tours[il].points[i1].lat1, lng: Tours[il].points[i1].lon1};
	//console.log(markerpoint);
	//simup1 = new google.maps.Marker({
	//	position: markerpoint, 
	//	title: 'T:'+Tours[il].points[i1].timestamp+'\r\n'+
	//	       'v:'+Math.round(Tours[il].points[i1].vitesse)+'km/h\r\n'+
	//	       'alt:'+Math.round(Tours[il].points[i1].altitude)+'m\r\n'+
    //           'cap:'+Math.round(Tours[il].points[i1].cap*10)/10+'° '
	//	,icon: {
	//		path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
	//		rotation: cap,
	//		fillColor: "cyan",
	//		fillOpacity: 0.8,
	//		scale: 5,
	//		strokeColor: "gold",
	//		strokeWeight: 2,
	//
	//		}
	//	});
	//simup1.setMap(map);
	var	title = 'T:'+Tours[il].points[i1].timestamp+'\r\n'+
		        'v:'+Math.round(Tours[il].points[i1].vitesse)+'km/h\r\n'+
		        'alt:'+Math.round(Tours[il].points[i1].altitude)+'m\r\n'+
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
		//simuline.setMap(null);
		map.removeLayer(simuline)
		simuline = '';
	}
	var pathCoordinates = [{lat: Tours[il].points[i0].lat1, lng: Tours[il].points[i0].lon1},{lat: Tours[il].points[i1].lat1, lng: Tours[il].points[i1].lon1}];
	//simuline = new google.maps.Polyline({
	//	path: pathCoordinates,
	//	geodesic: true,
	//	strokeColor: "cyan",
	//	strokeOpacity: 0.6,
	//	strokeWeight: 12
	//});
	//simuline.setMap(map);
	//setCenter(Tours[il].points[i0].lat1, Tours[il].points[i0].lon1);
	simuline = new L.polyline(pathCoordinates, {color: "cyan"});
	map.addLayer(simuline);
	var LatLng = L.latLng(Tours[il].points[i0].lat1, Tours[il].points[i0].lon1);
	map.panTo(LatLng);
	
	// calcul de l'accélération
	var accel = (((Tours[il].points[i1].vitesse - Tours[il].points[i0].vitesse)) * Frequence) / gkmh;
	
	var altitude = Tours[il].points[i1].altitude;
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
		//var dist =	google.maps.geometry.spherical.computeLength(geodist);
		var dist =	0;
		el.innerHTML = Math.round(dist)+"m";
	}

	// affichage de l'altitude
	var el = document.getElementById('altitude');
	if (el) {
		el.innerHTML = 'alt:'+Math.round(altitude)+"m";
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
		//el.innerHTML = 'turn:'+deg2rad(cap)+'/'+deg2rad(cap0)+"rad";
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
			//marktemp.setMap(null);
			map.removeLayer(marktemp);
			marktemp = '';
		}
		var lat = Tours[il].points[i1].CP.latitude;
		var lng = Tours[il].points[i1].CP.longitude;
		if (lat > 0 && lng > 0) {
			var markerpoint = {lat: lat, lng: lng};
			var l = tabMarktemp.length-1;
			//marktemp = new google.maps.Marker({
			//	position: markerpoint, title: 'Intersection'
			//	,draggable: true
			//	});
			//marktemp.setMap(map);
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
	playmotion = false;
	if (simupoint >= Tours[il].points.length-1) {
		simupoint = 0;
	}
	showMobile();
}

function simuStop() {
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
	var zoom = map.getZoom();
		
	if (marktemp != '') {
		//marktemp.setMap(null);
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
	//marktemp = new google.maps.Marker({
	//	position: markerpoint, title: 'D2'
	//	});
	//marktemp.setMap(map);
	marktemp = new L.Marker(markerpoint,{draggable:false, title: 'D2'});
	map.addLayer(marktemp);
	
	//setCenter(lat,lng);	
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
		//var marker = new google.maps.Marker({
		//	position: markerpoint, title: 'Point'
		//	});
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
					//tabMarktemp[l] = new google.maps.Marker({
					//	position: markerpoint, title: 'X'
					//	,draggable: true
					//	});
					//tabMarktemp[l].setMap(map);
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
					//tabMarktemp[l] = new google.maps.Marker({
					//	position: markerpoint, title: 'Y'
					//	,draggable: true
					//	});
					//tabMarktemp[l].setMap(map);
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
	var pathCoordinates = [{lat: seg[0], lng: seg[1]},{lat: seg[2], lng: seg[3]}];
	//segment = new google.maps.Polyline({
	//	path: pathCoordinates,
	//	geodesic: true,
	//	strokeColor: "cyan",
	//	strokeOpacity: 1,
	//	strokeWeight: 1
	//});
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
			//tabMarktemp[i].setMap(null);
			map.removeLayer(tabMarktemp[i]);
			tabMarktemp[i] = '';
		}
	}
	tabMarktemp = new Array();
	// on efface les anciens segments
	for (var i=0; i < tabLinetemp.length; i++) {
		if (tabLinetemp[i] != "") {
			//tabLinetemp[i].setMap(null);
			map.removeLayer(tabLinetemp[i]);
			tabLinetemp[i] = '';
		}
	}
	tabLinetemp = new Array();
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
		//var dtnow = Date.now();
		var dtnow = new Date();
		var i = dtnow.getMonth();
		var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
		var d = dtnow.getDate();
		if (d < 10)
			d = '0'+d;
		dateSession = d+'/'+months[i]+'/'+dtnow.getFullYear();
		//console.log('Date session générée:'+dateSession);
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


function isLineCut(SegAB, SegCD) {
	var intersec = getIntersection(SegAB,SegCD)
	if (intersec != false)
		intersec = true;
	return intersec;
}

function getDestination(ilat,ilon, cap, distance, radius=6371e3) {
    const φ1 = deg2rad(ilat), λ1 = deg2rad(ilon);
    const θ = deg2rad(cap);

    const δ = distance / radius; // angular distance in radians

    const Δφ = δ * Math.cos(θ);
    let φ2 = φ1 + Δφ;

    // check for some daft bugger going past the pole, normalise latitude if so
    if (Math.abs(φ2) > π / 2) φ2 = φ2 > 0 ? π - φ2 : -π - φ2;

    const Δψ = Math.log(Math.tan(φ2 / 2 + π / 4) / Math.tan(φ1 / 2 + π / 4));
    const q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1); // E-W course becomes ill-conditioned with 0/0

    const Δλ = δ * Math.sin(θ) / q;
    const λ2 = λ1 + Δλ;

    const lat = rad2deg(φ2);
    const lon = rad2deg(λ2);

    return new Array(lat, lon);
}

function getDistanceLine(A,B) {
	// calcul des longueurs des côtés du triangle formé par la position courante et les 2 points situés de part et d'autre de la ligne
	var dAB = distanceGPS(new Array(A[0],A[1]),new Array(A[2],A[3]));
	var dAC = distanceGPS(new Array(A[0],A[1]),B);
	var dBC = distanceGPS(new Array(A[2],A[3]),B);
	//On place les 3 points sur un plan tel que A est l'origine (x=0;y=0) et B (x=dAB;0)
	// calcul de cos A
	var a = dBC;
	var b = dAC;
	var c = dAB;
	
	var a2 = a*a;
	var b2 = b*b;
	var c2 = c*c;
	
	var cosA = ((a2*-1)+b2+c2)/(2*b*c);
	var arcosA = Math.acos(cosA);
	if (Number.isNaN(arcosA))
		arcosA = 0;
	var angle = rad2deg(arcosA);
	var sinA = Math.sin(arcosA);
	var dD = sinA*dAC; // distance entre le point C et la droite AB
	return dD;
}

function distanceGPS(A, B) {
	var latA = deg2rad(A[0]);
	var lonA = deg2rad(A[1]);
	var latB = deg2rad(B[0]);
	var lonB = deg2rad(B[1]);
	/*
	 **
     * Returns the distance along the surface of the earth from ‘this’ point to destination point.
     *
     * Uses haversine formula: a = sin²(Δφ/2) + cosφ1·cosφ2 · sin²(Δλ/2); d = 2 · atan2(√a, √(a-1)).
     *

        // a = sin²(Δφ/2) + cos(φ1)⋅cos(φ2)⋅sin²(Δλ/2)
        // δ = 2·atan2(√(a), √(1−a))
        // see mathforum.org/library/drmath/view/51879.html for derivation
		
Presuming a spherical Earth with radius R (see below), and that the
locations of the two points in spherical coordinates (longitude and
latitude) are lon1,lat1 and lon2,lat2, then the Haversine Formula 
(from R. W. Sinnott, "Virtues of the Haversine," Sky and Telescope, 
vol. 68, no. 2, 1984, p. 159): 

  dlon = lon2 - lon1
  dlat = lat2 - lat1
  a = (sin(dlat/2))^2 + cos(lat1) * cos(lat2) * (sin(dlon/2))^2
  c = 2 * atan2(sqrt(a), sqrt(1-a)) 
  d = R * c		

Number.prototype.toRadians = function() { return this * π / 180; };
Number.prototype.toDegrees = function() { return this * 180 / π; };
*/
	var radius = RT;
	const R = radius;
	const φ1 = latA,  λ1 = lonA;
	const φ2 = latB, λ2 = lonB;
	const Δφ = φ2 - φ1;
	const Δλ = λ2 - λ1;

	const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2) * Math.sin(Δλ/2)*Math.sin(Δλ/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	const d = R * c;

    // angle en radians entre les 2 points
	var MsinlatA = Math.sin(latA);
	var MsinlatB = Math.sin(latB);
	var McoslatA = Math.cos(latA);
	var McoslatB = Math.cos(latB);
	var Mabs = Math.abs(lonB-lonA);
	var Msin = MsinlatA * MsinlatB;
	var Mcoslat = McoslatA * McoslatB;
	var Mcoslon = Math.cos(Mabs);
	var Mcos = Mcoslat*Mcoslon;
	var Acos = Msin + Mcos;
	if (Acos > 1) Acos = 1;
	var D = Math.acos(Acos);
    //var S = Math.acos(Math.sin(latA)*Math.sin(latB) + Math.cos(latA)*Math.cos(latB)*Math.cos(Math.abs(longB-longA)))
	var S = D;
    // distance entre les 2 points, comptée sur un arc de grand cercle
	var distance = S*RT;
	//console.log('distance='+distance);
    return distance;
}

// placer 2 points sur la droite perpendiculaire à la droite A,B passant par A, situées de part et d'autre de A à une distance de A égale à la distance A-B
function getPerpendiculaire(A,B) { // coordonnées du point A, point B
	// les coordonnées sont ramenées sur un plan, abscisse x = longitude, coordonnée y = latitude
	var Ya = A[0];
	var Xa = A[1];
	var Yb = B[0];
	var Xb = B[1];
	// le rayon du cerlce de centre A est égal à la distance A,B
	var r = distanceGPS(A,B);
	
	// coordonnées d'un point B sur un cercle de centre A: X, Y
	var X = Xb-Xa; // X = côté Adjacent de l'angle a
	var Y = Yb-Ya; // Y = côté Opposé de l'angle a
//	
	var latA = deg2rad(A[0]);
	var lonA = deg2rad(A[1]);
	var latB = deg2rad(B[0]);
	var lonB = deg2rad(B[1]);
	
	var cosA = Math.cos(latA);
	var cosB = Math.cos(latB);
	
	var PX = Xa+(Y*(1/cosA));
	var PY = Ya+(X*cosA*-1);
	var PXo = Xa-(Y*(1/cosA));
	var PYo = Ya-(X*cosA*-1);
	var newcoord = new Array(PY,PX,PYo,PXo);
	return newcoord;	
}

// placer un point sur la droite A,B à une distance d du point A
function pointDroite(A,B,d) { // coordonnées du point A, point B et distance à partir de A
	var dtot = distanceGPS(A,B)	;
	var latp1 = A[0];
	var lonp1 = A[1];
	var latp2 = B[0];
	var lonp2 = B[1];
	var latc = latp1+((latp2-latp1)*d/dtot);
	var lonc = lonp1+((lonp2-lonp1)*d/dtot);
	return new Array(latc,lonc);	
}

function getIntersection(SegAB,SegCD) {
	//var pinter = getIntersectionSphere(SegAB,SegCD)
	////var new_pinter = new Array(pinter.latitude,pinter.longitude)
	//var new_pinter = new Array(pinter.latitude,pinter.longitude)
	//  
	////var ret = new Array(Number.parseFloat(Sx),Number.parseFloat(Sy))
	////return new Array(Sx,Sy)
	//return new_pinter
	
	/////////////////////////////////////////////////
	
	var Ax = SegAB[0]*1;
	var Ay = SegAB[1]*1;
	var Bx = SegAB[2]*1;
	var By = SegAB[3]*1;
	
	var Cx = SegCD[0]*1;
	var Cy = SegCD[1]*1;
	var Dx = SegCD[2]*1;
	var Dy = SegCD[3]*1;
	
//function getIntersectionSphere(line1 ,line2) {
//   //console.log("segment1:"+JSON.stringify(line1));
//   //console.log("segment2:"+JSON.stringify(line2));
//   // find the plane of the line in cartesian coordinates
//   var p1 = findPlane(line1[0],line1[1],line1[2],line1[3]);
//   var p2 = findPlane(line2[0],line2[1],line2[2],line2[3])
	

	var Sx;
	var Sy;
	
	if(Ax==Bx)
	{
		if(Cx==Dx) return false;
		else
		{
			var pCD = (Cy-Dy)/(Cx-Dx);
			Sx = Ax;
			Sy = pCD*(Ax-Cx)+Cy;
		}
	}
	else
	{
		if(Cx==Dx)
		{
			var pAB = (Ay-By)/(Ax-Bx);
			Sx = Cx;
			Sy = pAB*(Cx-Ax)+Ay;
		}
		else
		{
			var pCD = (Cy-Dy)/(Cx-Dx);
			var pAB = (Ay-By)/(Ax-Bx);
			var oCD = Cy-pCD*Cx;
			var oAB = Ay-pAB*Ax;
			Sx = (oAB-oCD)/(pCD-pAB);
			Sy = pCD*Sx+oCD;
		}
	}
	// limité à 14 chiffres après la virgule
	Sx = precis14(Sx);
	Ax = precis14(Ax);
	Bx = precis14(Bx);
	Cx = precis14(Cx);
	Dx = precis14(Dx);
	Sy = precis14(Sy);
	Ay = precis14(Ay);
	By = precis14(By);
	Cy = precis14(Cy);
	Dy = precis14(Dy);
	
	//console.log('Sx:'+Sx);
	//console.log('Ax:'+Ax);
	//console.log('Bx:'+Bx);
	//console.log('Cx:'+Cx);
	//console.log('Dx:'+Dx);
	//console.log('Sy:'+Sy);
	//console.log('Ay:'+Ay);
	//console.log('By:'+By);
	//console.log('Cy:'+Cy);
	//console.log('Dy:'+Dy);
	//var v = false;
	//if (Sx<Ax && Sx<Bx)
	//	v = true;
	//console.log('v1:'+v);
	//
	//var v = false;
	//if (Sx>Ax && Sx>Bx)
	//	v = true;
	//console.log('v2:'+v);
	//
	//var v = false;
	//if (Sx<Cx && Sx<Dx)
	//	v = true;
	//console.log('v3:'+v);
	//
	//var v = false;
	//if (Sx>Cx && Sx>Dx)
	//	v = true;
	//console.log('v4:'+v);
	//
	//var v = false;
	//if (Sy<Ay && Sy<By)
	//	v = true;
	//console.log('v5:'+v);
	//
	//var v = false;
	//if (Sy>Ay && Sy>By)
	//	v = true;
	//console.log('v6:'+v);
	//
	//var v = false;
	//if (Sy<Cy && Sy<Dy)
	//	v = true;
	//console.log('v7:'+v);
	//
	//var v = false;
	//if (Sy>Cy && Sy>Dy)
	//	v = true;
	//console.log('v8:'+v);

	if((Sx<Ax && Sx<Bx)|(Sx>Ax && Sx>Bx) | (Sx<Cx && Sx<Dx)|(Sx>Cx && Sx>Dx)
			| (Sy<Ay && Sy<By)|(Sy>Ay && Sy>By) | (Sy<Cy && Sy<Dy)|(Sy>Cy && Sy>Dy)) return false;
	  //return true; //or :     return new Point2D.Float((float)Sx,(float)Sy)
	  
	//var new_pinter = new Array(pinter.latitude,pinter.longitude)
	//  
	var ret = new Array(Number.parseFloat(Sx),Number.parseFloat(Sy))
	//return new Array(Sx,Sy)
	//return new_pinter
	return ret
}
function precis14(x) {
  return Number.parseFloat(x).toFixed(14);
}

/*
*/
function getIntersectionSphere(line1 ,line2) {
   /*
   line consists of two points defined by latitude and longitude :
   line = {
      'lat1' : lat1,
      'long1' : long1,
      'lat2' : lat2,
      'long2' : long2
      }
   in decimal
   */
   //console.log("segment1:"+JSON.stringify(line1));
   //console.log("segment2:"+JSON.stringify(line2));
   // find the plane of the line in cartesian coordinates
   var p1 = findPlane(line1[0],line1[1],line1[2],line1[3]);
   var p2 = findPlane(line2[0],line2[1],line2[2],line2[3])
   //console.log("plan p1:"+JSON.stringify(p1));
   //console.log("plan p2:"+JSON.stringify(p2));
   // The intersection of two planes contains of course the
   // point of origin, but also the point P : (x,y,z)
   // x = b1 * c2 - c1 * b2
   // y = c1 * a2 - a1 * c2
   // z = a1 * b2 - b1 * a2
   var x = p1['b'] * p2['c'] - p1['c'] * p2['b'];
   var y = p1['c'] * p2['a'] - p1['a'] * p2['c'];
   var z = p1['a'] * p2['b'] - p1['b'] * p2['a'];
   
   var norme = Math.sqrt(x**2+y**2+z**2);
   //var lat1 = degrees(Math.asin(z/norme));
   var lat1 = rad2deg(Math.asin(z/norme));
   //var long1 = degrees(Math.atan2(y,x));
   var long1 = rad2deg(Math.atan2(y,x));
   lat2 = - (lat1)
   if (long1 <= 0)
      long2 = long1 + 180
   else
      long2 = long1 - 180
   var intersection1 = {'latitude' : lat1, 'longitude' : long1};
   var intersection2 = {'latitude' : lat2, 'longitude' : long2};
   var ver1 = lat1 * line1[0];
   var ver2 = lat1 * line2[0];
   //console.log("vérification:"+ver1+"/"+ver2);
   var spinter = false;
   if (ver1 > 0 && ver2 > 0) {
       //console.log("intersection des 2 arcs (intersection1):"+JSON.stringify(intersection1));
	   var spinter = intersection1;
   }
   else {
       //console.log ("intersection des 2 arcs (intersection2):"+JSON.stringify(intersection2));
	   var spinter = intersection2;
   }
   return spinter;
}

function findPlane (lat1,long1,lat2,long2) {
   //calculate the Cartesian coordinates (x, y, z) points 1 and 2
   //using their spherical coordinates
   var c1 = sphericalToCartesian(lat1,long1)
   var c2 = sphericalToCartesian(lat2,long2)
   //console.log (c1)
   //console.log (c2)
   // the point 0 is the center of the earth
   // the plane through 0, c1 and c2 then the equation ax + by + cz = 0
   // a = y1 * z2 - z1 * y2
   // b = z1 * x2 - x1 * z2
   // c = x1 * y2 - y1 * x2
   var a = c1['y'] * c2['z'] - c1['z'] * c2['y'];
   var b = c1['z'] * c2['x'] - c1['x'] * c2['z'];
   var c = c1['x'] * c2['y'] - c1['y'] * c2['x'];
   var plane = {
      'a' : a,
      'b' : b,
      'c' : c
      }
   return plane;
}
   
function sphericalToCartesian (lat,lng) {
   // converts spherical coordinates to cartesian coordinates in a point
   lat = radians(lat); // converts degrees to radians
   lng = radians(lng);
   var x = Math.cos(lat) * Math.cos(lng);
   var y = Math.cos(lat) * Math.sin(lng);
   var z = Math.sin(lat)
   coordinate = {
      'x' : x,
      'y' : y,
      'z' : z
      }
   return coordinate;
}
function radians(el) {
	return deg2rad(el);
}
//function degrees(el) {
//	return rad2deg(el);
//}
/**/

function deg2rad(dg) {
	return dg/180*π;
}

function rad2deg(rd) {
	return rd*180/π;
}
	
function mouseMove(mousePt) {
	mouseLatLng = mousePt.latlng;
	//var mouseCoord = mouseLatLng.toUrlValue();
	var mouseLat = mouseLatLng.lat;
	var mouseLon = mouseLatLng.lng;
	
	//var oStatusDiv = document.getElementById("mouseTrack")	
	var oStatusDiv = document.getElementById("LatLng")	
	if (oStatusDiv) {
		oStatusDiv.value  = mouseLat + ',' + mouseLon;
	}
	//document.getElementById("zone-info").innerHTML = '';
}
	
function copyClipboard(mousePt) {
	mouseMove(mousePt);
	//var z_extract = document.getElementById("mouseTrack")
	var z_extract = document.getElementById("LatLng")
	z_extract.select();
	if ( !document.execCommand( 'copy' ) ) {
		document.getElementById("zone-info").innerHTML = 'erreur de copie dans le presse papier';
		return false;
	}
	var el = document.getElementById("HiddenLatLng")
	if (el)
	    el.value = z_extract.value;
	//document.getElementById("zone-info").innerHTML = 'Les coordonnées du point sont copiés dans le presse papier';
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
	//var center = map.getCenter(); 
	////var b1 = map.getBounds();
	//console.log('lat centre='+center.lat);
	////var bn = b1.getNorth();
	//console.log('lat nord='+bn);
	////var bs = b1.getSouth();
	//console.log('lat sud='+bs);
	////var ratio = (bn-bs)*0.8;
	////var corner1 = b1._northEast;
	////var corner2 = b1._southWest;
	////var newsouth = bn-ratio;
	////corner2.lat = newsouth;
	////var latc = corner1.lat+((corner1.lat-corner2.lat)/2);
	////var lngc = corner1.lng+((corner1.lng-corner2.lng)/2);
	////var newcenter = L.latLng(latc,lngc);
	//
	////var nb = L.latLngBounds(corner1,corner2)
	////map.setView(newcenter);
	////L.setBounds(nb);
	//map.setView(center);
	
	
	
	//
	var el = document.getElementById("map");
	var html = "";
	html += el.offsetTop+" "+el.offsetLeft;
	html += " "+el.offsetWidth+" "+el.offsetHeight;
	html += " "+el.scrollWidth+" "+el.scrollHeight;
	var largeur = window.innerWidth;
	var hauteur = window.innerHeight;
	html += " "+largeur+" "+hauteur;
	document.getElementById("ecran").innerHTML = html;
	
	var hopt = Math.floor((hauteur - el.offsetTop)/4)*4;
	// si le container graph est ouvert, on retire 200
	var elg = document.getElementById("container-graph");
	if (elg) {
		if (elg.style.display == "block") {
			hopt = hopt - 200;
		}
	}
	
	if (hopt != el.offsetHeight) {
		el.style.height = hopt+'px';
		el.style.maxHeight = hopt+'px';
	}
	//var center2 = map.getCenter(); 
	//map.panTo(center);
}
window.addEventListener('resize', resizeMap);
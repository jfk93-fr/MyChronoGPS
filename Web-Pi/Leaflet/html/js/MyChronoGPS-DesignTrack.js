var fname = 'ajax/get_circuit.py';
var data_ready = false;
var Circuit = false;
var nbw = 0;

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var circuit_timer = '';

var currentmarker = '';
var circle = '';
var timer = '';
var FL;
var Int1;
var Int2;
var Int3;
const π = Math.PI;
var is_info2clear = false;

var markerFL;
var objStart = new Object(); // Tableau des coordonnées de la ligne de départ
var Tabint = new Array(); // Tableau des coordonnées des intérmédiaires (partiels)
var objPitIn = new Object(); // Tableau des coordonnées de l'entrée de la pitlane
var objPitOut = new Object(); // Tableau des coordonnées de la sortie de la pitlane

var Track = new Object(); // Objet recueillant toutes les données pour la piste à écrire ou à copier dans le presse papier
var fname_save = 'ajax/save_circuit.php';
var dataPost = false; // Objet recueillant le formulaire à passer à la procédure ajax d'écriture de la piste

// Rayon de la terre en mètres (sphère IAG-GRS80)
var RT = 6378137;

var largeur_piste = 15; // largeur de la piste en mètre; utilisée pour déterminer le franchissement du point de départ

var lat;
var lng;

//var init_data;
var Circuit = false;
var map = false;

var NewCircuit = false;
var IdCircuit = false;
var LatLngCircuit = false;
var CoordsCircuit = false;

var ConstructMarks = false; // marqueurs de construction
var ConstructLine = false; // ligne entre les marqueurs de construction

// on récupère les variables passées dans l'URL
for (property in urlvar) {
	if (property == "id") {
		IdCircuit = urlvar[property];
		fname += "?id="+IdCircuit;
	}
	if (property == "latlng") {
		LatLngCircuit = urlvar[property];
		fname += "?latlng="+LatLngCircuit;
	}
	if (property == "FL") {
		CoordsCircuit = urlvar[property];
		fname += "?FL="+CoordsCircuit;
	}
}
if (!IdCircuit)
	NewCircuit = true;

var thisCircuit;

document.getElementById("zone-info").innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';

function clearInfo() {
	var el = document.getElementById("zone-info");
	if (el.innerHTML == '') {
		timer = setTimeout(clearInfo, 10000); // On regardera à nouveau dans 10 secondes
		return;
	}
	// Il y a quelque chose dans les infos
	if (is_info2clear) {
		el.innerHTML = ''; // on efface zone-info et 
		timer = setTimeout(clearInfo, 10000); // on regardera à nouveau dans 10 secondes
		return;
	}
	is_info2clear = true; // on indique que le prochain tour, il faudra effacer zone-info
	timer = setTimeout(clearInfo, 5000); // on laisse zone-info affichée et on regardera à nouveau dans 5 secondes
		
}

clearInfo();

document.getElementById('map').style.display = 'block';
map = true;

loadCircuit(); // on va charger le circuit

function loadCircuit()
{
	loadCircuitAjax(fname);
	isCircuitReady();
}

function isCircuitReady()
{
	if (!Circuit) {
		circuit_timer = setTimeout(isCircuitReady, 300);
		return;
	}
	if (!map) {
		circuit_timer = setTimeout(isCircuitReady, 100);
		return;
	}
	clearTimeout(circuit_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataCircuitReady();
}

function loadCircuitAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(proc) {
        if (this.readyState == 4) {
			if (this.status == 200) {
				Circuit = false;
				try {Circuit = JSON.parse(this.responseText);}
				catch(e) {Circuit = this.responseText;}
			}
			else 
			{
				var el = document.getElementById("zone-info");
				if (el)
					el.innerHTML = "fichier " + proc + " non trouv&eacute;";
			}
		}
    }
    xmlhttp.open("GET", proc, true);
    xmlhttp.send();
}

function dataCircuitReady()
{
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

function go()
{
	initMap();
}

// Initialize and add the map
function initMap() {
	if (NewCircuit) {
		thisCircuit = new Object();
		thisCircuit.Zoom = 15;
		thisCircuit.PitMaxSpeed = 50; // vitesse maxi autorisée dans la voie des stands (défaut)
		if (LatLngCircuit) {
			var LatLng = LatLngCircuit.split(",");
			thisCircuit.Latitude = LatLng[0];
			thisCircuit.Longitude = LatLng[1];
			thisCircuit.Latcenter = LatLng[0];
			thisCircuit.Loncenter = LatLng[1];
			thisCircuit.NomCircuit = "Nom-Circuit";
		}
		else {
			// si c'est un circuit inconnu, on a récupéré, à minima, les coordonnées d'une ligne (auto définie par MyChronoGPS)
			var LatLng = JSON.parse(CoordsCircuit);
			thisCircuit.Latitude = LatLng[0];
			thisCircuit.Longitude = LatLng[1];
			thisCircuit.Latcenter = LatLng[0];
			thisCircuit.Loncenter = LatLng[1];
			thisCircuit.NomCircuit = "Nom-Circuit";
			thisCircuit.FL = new Array();
			thisCircuit.FL[0] = LatLng[0];
			thisCircuit.FL[1] = LatLng[1];
			thisCircuit.FL[2] = LatLng[2];
			thisCircuit.FL[3] = LatLng[3];
		}
	}
	else {
		thisCircuit = Circuit.circuit;
		if (!thisCircuit.Latitude)
			thisCircuit.Latitude = thisCircuit.FL[0];
		if (!thisCircuit.Longitude)
			thisCircuit.Longitude = thisCircuit.FL[1];
		if (!thisCircuit.Zoom)
			thisCircuit.Zoom = 16; // zoom par défaut
		if (!thisCircuit.PitMaxSpeed)
			thisCircuit.PitMaxSpeed = 50; // vitesse maxi autorisée dans la voie des stands (défaut)
	}
	
	if (!thisCircuit.Latcenter)
		thisCircuit.Latcenter = thisCircuit.Latitude;
	if (!thisCircuit.Loncenter)
		thisCircuit.Loncenter = thisCircuit.Longitude;
	lat = thisCircuit.Latcenter*1;
	if (!lat)
		lat = thisCircuit.Latitude;
	lon = thisCircuit.Loncenter*1;
	if (!lon)
		lon = thisCircuit.Longitude;
	// noms des lignes
	if (!thisCircuit.NameFL)
		thisCircuit.NameFL = "Ligne de départ/arrivée";
	if (!thisCircuit.NameInt1)
		thisCircuit.NameInt1 = "Intermédiaire 1";
	if (!thisCircuit.NameInt2)
		thisCircuit.NameInt2 = "Intermédiaire 2";
	if (!thisCircuit.NameInt3)
		thisCircuit.NameInt3 = "Intermédiaire 3";

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
				'		</tr>' +
				'		<tr>' +
				'			<td colspan="2" align="center">'+thisCircuit.Adresse+'</td>' +
				'		</tr>' +
				'		<tr>' +
				'			<td>'+thisCircuit.CodePostal+'</td><td>'+thisCircuit.Ville+'</td>' +
				'		</tr>' +
				'		<tr>' +
				'			<td colspan="2" align="center">'+thisCircuit.LongCircuit+' m</td>' +
				'		</tr>' +
				'	</table>' +
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
	
	showData(); // remplissage des données lues dans les input
	
	showLines();
	
}

function normalizeCircuit() {
	// on normalise toutes les données numériques
	if (thisCircuit.Latitude)
		thisCircuit.Latitude = thisCircuit.Latitude * 1;
	if (thisCircuit.Longitude)
		thisCircuit.Longitude = thisCircuit.Longitude * 1;
	if (thisCircuit.Latcenter)
		thisCircuit.Latcenter = thisCircuit.Latcenter * 1;
	if (thisCircuit.Loncenter)
		thisCircuit.Loncenter = thisCircuit.Loncenter * 1;
	if (thisCircuit.LongCircuit)
		thisCircuit.LongCircuit = thisCircuit.LongCircuit * 1;
	if (thisCircuit.Zoom)
		thisCircuit.Zoom = thisCircuit.Zoom * 1;
	if (thisCircuit.PitMaxSpeed)
		thisCircuit.PitMaxSpeed = thisCircuit.PitMaxSpeed * 1;
	/* FL en lat1,lon1 / lat2,lon2 */
	if (thisCircuit.FL) {
		thisCircuit.FL[0] = thisCircuit.FL[0] * 1;
		thisCircuit.FL[1] = thisCircuit.FL[1] * 1;
		thisCircuit.FL[2] = thisCircuit.FL[2] * 1;
		thisCircuit.FL[3] = thisCircuit.FL[3] * 1;
	}
	/* FL en lat,lon,cap */
	if (thisCircuit.LatFL)
		thisCircuit.LatFL = thisCircuit.LatFL * 1;
	if (thisCircuit.LonFL)
		thisCircuit.LonFL = thisCircuit.LonFL * 1;
	if (thisCircuit.CapFL)
		thisCircuit.CapFL = thisCircuit.CapFL * 1;

	/* Int1 en lat1,lon1 / lat2,lon2 */
	if (thisCircuit.Int1) {
		thisCircuit.Int1[0] = thisCircuit.Int1[0] * 1;
		thisCircuit.Int1[1] = thisCircuit.Int1[1] * 1;
		thisCircuit.Int1[2] = thisCircuit.Int1[2] * 1;
		thisCircuit.Int1[3] = thisCircuit.Int1[3] * 1;
	}
	/* Int1 en lat,lon,cap */
	if (thisCircuit.LatInt1)
		thisCircuit.LatInt1 = thisCircuit.LatInt1 * 1;
	if (thisCircuit.LonInt1)
		thisCircuit.LonInt1 = thisCircuit.LonInt1 * 1;
	if (thisCircuit.CapInt1)
		thisCircuit.CapInt1 = thisCircuit.CapInt1 * 1;

	/* Int2 en lat1,lon1 / lat2,lon2 */
	if (thisCircuit.Int2) {
		thisCircuit.Int2[0] = thisCircuit.Int2[0] * 1;
		thisCircuit.Int2[1] = thisCircuit.Int2[1] * 1;
		thisCircuit.Int2[2] = thisCircuit.Int2[2] * 1;
		thisCircuit.Int2[3] = thisCircuit.Int2[3] * 1;
	}
	/* Int2 en lat,lon,cap */
	if (thisCircuit.LatInt2)
		thisCircuit.LatInt2 = thisCircuit.LatInt2 * 1;
	if (thisCircuit.LonInt2)
		thisCircuit.LonInt2 = thisCircuit.LonInt2 * 1;
	if (thisCircuit.CapInt2)
		thisCircuit.CapInt2 = thisCircuit.CapInt2 * 1;

	/* Int3 en lat1,lon1 / lat2,lon2 */
	if (thisCircuit.Int3) {
		thisCircuit.Int3[0] = thisCircuit.Int3[0] * 1;
		thisCircuit.Int3[1] = thisCircuit.Int3[1] * 1;
		thisCircuit.Int3[2] = thisCircuit.Int3[2] * 1;
		thisCircuit.Int3[3] = thisCircuit.Int3[3] * 1;
	}
	/* Int3 en lat,lon,cap */
	if (thisCircuit.LatInt3)
		thisCircuit.LatInt3 = thisCircuit.LatInt3 * 1;
	if (thisCircuit.LonInt3)
		thisCircuit.LonInt3 = thisCircuit.LonInt3 * 1;
	if (thisCircuit.CapInt3)
		thisCircuit.CapInt3 = thisCircuit.CapInt3 * 1;

	/* PitIn en lat1,lon1 / lat2,lon2 */
	if (thisCircuit.PitIn) {
		thisCircuit.PitIn[0] = thisCircuit.PitIn[0] * 1;
		thisCircuit.PitIn[1] = thisCircuit.PitIn[1] * 1;
		thisCircuit.PitIn[2] = thisCircuit.PitIn[2] * 1;
		thisCircuit.PitIn[3] = thisCircuit.PitIn[3] * 1;
	}
	/* PitIn en lat,lon,cap */
	if (thisCircuit.LatPitIn)
		thisCircuit.LatPitIn = thisCircuit.LatPitIn * 1;
	if (thisCircuit.LonPitIn)
		thisCircuit.LonPitIn = thisCircuit.LonPitIn * 1;
	if (thisCircuit.CapPitIn)
		thisCircuit.CapPitIn = thisCircuit.CapPitIn * 1;

	/* PitOut en lat1,lon1 / lat2,lon2 */
	if (thisCircuit.PitOut) {
		thisCircuit.PitOut[0] = thisCircuit.PitOut[0] * 1;
		thisCircuit.PitOut[1] = thisCircuit.PitOut[1] * 1;
		thisCircuit.PitOut[2] = thisCircuit.PitOut[2] * 1;
		thisCircuit.PitOut[3] = thisCircuit.PitOut[3] * 1;
	}
	/* PitOut en lat,lon,cap */
	if (thisCircuit.LatPitOut)
		thisCircuit.LatPitOut = thisCircuit.LatPitOut * 1;
	if (thisCircuit.LonPitOut)
		thisCircuit.LonPitOut = thisCircuit.LonPitOut * 1;
	if (thisCircuit.CapPitOut)
		thisCircuit.CapPitOut = thisCircuit.CapPitOut * 1;

}


function changeValue(id) {
	var elem;
	elem = document.getElementById(id);
	if (elem) {
		newval = elem.value;
	}
}
	
function mouseMove(mousePt) {
	mouseLatLng = mousePt.latlng;
	var mouseLat = mouseLatLng.lat;
	var mouseLon = mouseLatLng.lng;
	
	var oStatusDiv = document.getElementById("clipboard")	
	if (oStatusDiv) {
		oStatusDiv.value  = mouseLat + ',' + mouseLon;
	}
	document.getElementById("zone-info").innerHTML = '';
}
	
function copyClipboard(mousePt) {
	mouseMove(mousePt);
	var z_extract = document.getElementById("clipboard")
	z_extract.select();
	if ( !document.execCommand( 'copy' ) ) {
		document.getElementById("zone-info").innerHTML = 'erreur de copie dans le presse papier';
		return false;
	}
	document.getElementById("zone-info").innerHTML = 'Les coordonnées du point sont copiés dans le presse papier';
	return true;
}

function showData() {
	var el;
	el = document.getElementById("NomCircuit");
	if (thisCircuit.NomCircuit) {
		el.value = thisCircuit.NomCircuit;
	}
	else el.style.display = 'none';

	el = document.getElementById("Adresse");
	if (thisCircuit.Adresse) {
		el.value = thisCircuit.Adresse;
	}
	else el.style.display = 'none';

	el = document.getElementById("CodePostal");
	if (thisCircuit.CodePostal) {
		el.value = thisCircuit.CodePostal;
	}
	else el.style.display = 'none';

	el = document.getElementById("Ville");
	if (thisCircuit.Ville) {
		el.value = thisCircuit.Ville;
	}
	else el.style.display = 'none';

	el = document.getElementById("URL");
	if (thisCircuit.URL) {
		el.value = thisCircuit.URL;
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

	el = document.getElementById("Latcenter");
	if (thisCircuit.Latcenter) {
		el.value = thisCircuit.Latcenter;
	}
	else el.style.display = 'none';

	el = document.getElementById("Loncenter");
	if (thisCircuit.Loncenter) {
		el.value = thisCircuit.Loncenter;
	}
	else el.style.display = 'none';

	if (!thisCircuit.LongCircuit) {
		thisCircuit.LongCircuit = 1;
	}
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

	el = document.getElementById("PitMaxSpeed");
	if (thisCircuit.PitMaxSpeed) {
		el.value = thisCircuit.PitMaxSpeed;
	}
	else el.style.display = 'none';

	/* FL en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("FLLat1");
	el.value = undefined;
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("FLLon1");
	el.value = undefined;
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("FLLat2");
	el.value = undefined;
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("FLLon2");
	el.value = undefined;
	if (thisCircuit.FL) {
		el.value = thisCircuit.FL[3];
	}
	else el.style.display = 'none';

	/* FL en lat,lon,cap */
	el = document.getElementById("LatFL");
	el.value = undefined;
	if (thisCircuit.LatFL) {
		el.value = thisCircuit.LatFL;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonFL");
	el.value = undefined;
	if (thisCircuit.LonFL) {
		el.value = thisCircuit.LonFL;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapFL");
	el.value = undefined;
	if (thisCircuit.CapFL) {
		el.value = thisCircuit.CapFL;
	}
	else el.style.display = 'none';

	/* Int1 en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("Int1Lat1");
	el.value = undefined;
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int1Lon1");
	el.value = undefined;
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int1Lat2");
	el.value = undefined;
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int1Lon2");
	el.value = undefined;
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[3];
	}
	else el.style.display = 'none';

	/* Int1 en lat,lon,cap */
	el = document.getElementById("LatInt1");
	el.value = undefined;
	if (thisCircuit.LatInt1) {
		el.value = thisCircuit.LatInt1;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonInt1");
	el.value = undefined;
	if (thisCircuit.LonInt1) {
		el.value = thisCircuit.LonInt1;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapInt1");
	el.value = undefined;
	if (thisCircuit.CapInt1) {
		el.value = thisCircuit.CapInt1;
	}
	else el.style.display = 'none';

	/* Int2 en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("Int2Lat1");
	el.value = undefined;
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int2Lon1");
	el.value = undefined;
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int2Lat2");
	el.value = undefined;
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int2Lon2");
	el.value = undefined;
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[3];
	}
	else el.style.display = 'none';

	/* Int2 en lat,lon,cap */
	el = document.getElementById("LatInt2");
	el.value = undefined;
	if (thisCircuit.LatInt2) {
		el.value = thisCircuit.LatInt2;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonInt2");
	el.value = undefined;
	if (thisCircuit.LonInt2) {
		el.value = thisCircuit.LonInt2;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapInt2");
	el.value = undefined;
	if (thisCircuit.CapInt2) {
		el.value = thisCircuit.CapInt2;
	}
	else el.style.display = 'none';

	/* Int3 en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("Int3Lat1");
	el.value = undefined;
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int3Lon1");
	el.value = undefined;
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int3Lat2");
	el.value = undefined;
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int3Lon2");
	el.value = undefined;
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[3];
	}
	else el.style.display = 'none';

	/* Int3 en lat,lon,cap */
	el = document.getElementById("LatInt3");
	el.value = undefined;
	if (thisCircuit.LatInt3) {
		el.value = thisCircuit.LatInt3;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonInt3");
	el.value = undefined;
	if (thisCircuit.LonInt3) {
		el.value = thisCircuit.LonInt3;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapInt3");
	el.value = undefined;
	if (thisCircuit.CapInt3) {
		el.value = thisCircuit.CapInt3;
	}
	else el.style.display = 'none';

	/* PitIn en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("PitInLat1");
	el.value = undefined;
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitInLon1");
	el.value = undefined;
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitInLat2");
	el.value = undefined;
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitInLon2");
	el.value = undefined;
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[3];
	}
	else el.style.display = 'none';

	/* PitIn en lat,lon,cap */
	el = document.getElementById("LatPitIn");
	el.value = undefined;
	if (thisCircuit.LatPitIn) {
		el.value = thisCircuit.LatPitIn;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonPitIn");
	el.value = undefined;
	if (thisCircuit.LonPitIn) {
		el.value = thisCircuit.LonPitIn;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapPitIn");
	el.value = undefined;
	if (thisCircuit.CapPitIn) {
		el.value = thisCircuit.CapPitIn;
	}
	else el.style.display = 'none';

	/* PitOut en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("PitOutLat1");
	el.value = undefined;
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitOutLon1");
	el.value = undefined;
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitOutLat2");
	el.value = undefined;
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitOutLon2");
	el.value = undefined;
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[3];
	}
	else el.style.display = 'none';

	/* PitOut en lat,lon,cap */
	el = document.getElementById("LatPitOut");
	el.value = undefined;
	if (thisCircuit.LatPitOut) {
		el.value = thisCircuit.LatPitOut;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonPitOut");
	el.value = undefined;
	if (thisCircuit.LonPitOut) {
		el.value = thisCircuit.LonPitOut;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapPitOut");
	el.value = undefined;
	if (thisCircuit.CapPitOut) {
		el.value = thisCircuit.CapPitOut;
	}
	else el.style.display = 'none';

	var el;
	el = document.getElementById("NameFL");
	el.value = undefined;
	if (thisCircuit.NameFL) {
		el.value = thisCircuit.NameFL;
	}
	else el.style.display = 'none';

	var el;
	el = document.getElementById("NameInt1");
	el.value = undefined;
	if (thisCircuit.NameInt1) {
		el.value = thisCircuit.NameInt1;
	}
	else el.style.display = 'none';

	var el;
	el = document.getElementById("NameInt2");
	el.value = undefined;
	if (thisCircuit.NameInt2) {
		el.value = thisCircuit.NameInt2;
	}
	else el.style.display = 'none';

	var el;
	el = document.getElementById("NameInt3");
	el.value = undefined;
	if (thisCircuit.NameInt3) {
		el.value = thisCircuit.NameInt3;
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
	if (!confirm("vous êtes sur le point de supprimer la ligne "+obj.idelem+", voulez-vous continuer ?"))
		return;

	// on efface tous les marqueurs
	if (typeof(obj.marker1) != 'undefined') {
		if (obj.marker1 != '') {
			//obj.marker1.setMap(null);
			map.removeLayer(obj.marker1);
			obj.marker1 = '';
		}
	}
		
	if (typeof(obj.marker2) != 'undefined') {
		if (obj.marker2 != '') {
			//obj.marker2.setMap(null);
			map.removeLayer(obj.marker2);
			obj.marker2 = '';
		}
	}

	if (typeof(obj.line) != 'undefined') {
		if (obj.line != '') {
			//obj.line.setMap(null);
			map.removeLayer(obj.line);
			obj.line = '';
		}
	}
	// On récrée les objets
	if (line > 0) {
		if (Tabint[line-1])
			Tabint[line-1] = new Object();
		if (Tabint[0]) {
			if (typeof(thisCircuit.Int1) != 'undefined') {
				delete thisCircuit.Int1;
				delete thisCircuit.LatInt1;
				delete thisCircuit.LonInt1;
				delete thisCircuit.CapInt1;
			}
		}
		if (Tabint[1]) {
			if (typeof(thisCircuit.Int2) != 'undefined') {
				delete thisCircuit.Int2;
				delete thisCircuit.LatInt2;
				delete thisCircuit.LonInt2;
				delete thisCircuit.CapInt2;
			}
		}
		if (Tabint[2]) {
			if (typeof(thisCircuit.Int3) != 'undefined') {
				delete thisCircuit.Int3;
				delete thisCircuit.LatInt3;
				delete thisCircuit.LonInt3;
				delete thisCircuit.CapInt3;
			}
		}
	}

	if (line == 0) {
		objStart = new Object();
		delete thisCircuit.FL;
	}
	if (line == -1)
		objPitIn = new Object();
	if (line == -2)
		objPitOut = new Object();
	showData(); // remplissage des données lues dans les input
}

function copyTrack(parm=0) {
	// on copy tous les input et on crée le fichier JSON de la piste
	createNewTrack();
	
	var json = JSON.stringify(Track, null, '\t');
	var z_extract = document.getElementById("clipboard")
	z_extract.value = json;
	z_extract.select();
	if ( !document.execCommand( 'copy' ) ) {
		document.getElementById("zone-info").innerHTML = 'erreur de copie dans le presse papier';
		return false;
	}
	document.getElementById("zone-info").innerHTML = 'Les données du circuit sont copiées dans le presse papier';
	
	// juste pour les tests, on appelle la fonction de sauvegarde
	saveTrack(parm);
}

function createNewTrack() {
	// on copy tous les input et on crée le fichier JSON de la piste
	Track = new Object();
	Track.IdCircuit = 0;
	if (thisCircuit.IdCircuit)
		Track.IdCircuit = thisCircuit.IdCircuit;
	var el;
	el = document.getElementById("NomCircuit");
	if (el)
		Track.NomCircuit = el.value;
	el = document.getElementById("Adresse");
	if (el)
		Track.Adresse = el.value;
	el = document.getElementById("CodePostal");
	if (el)
		Track.CodePostal = el.value;
	el = document.getElementById("Ville");
	if (el)
		Track.Ville = el.value;
	el = document.getElementById("URL");
	if (el)
		Track.URL = el.value;
	el = document.getElementById("Latitude");
	if (el)
		if (isNaN(el.value) == false)
			Track.Latitude = el.value*1;
	el = document.getElementById("Longitude");
	if (el)
		if (isNaN(el.value) == false)
			Track.Longitude = el.value*1;
	el = document.getElementById("Latcenter");
	if (el)
		if (isNaN(el.value) == false)
			Track.Latcenter = el.value*1;
	el = document.getElementById("Loncenter");
	if (el)
		if (isNaN(el.value) == false)
			Track.Loncenter = el.value*1;
	el = document.getElementById("LongCircuit");
	if (el)
		if (isNaN(el.value) == false)
			Track.LongCircuit = el.value*1;
	el = document.getElementById("Zoom");
	if (el)
		if (isNaN(el.value) == false)
			Track.Zoom = el.value*1;
	el = document.getElementById("PitMaxSpeed");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitMaxSpeed = el.value*1;

	Track.FL = new Array()
	el = document.getElementById("FLLat1");
	if (el)
		if (isNaN(el.value) == false)
			Track.FL[0] = el.value*1;
	el = document.getElementById("FLLon1");
	if (el)
		if (isNaN(el.value) == false)
			Track.FL[1] = el.value*1;
	el = document.getElementById("FLLat2");
	if (el)
		if (isNaN(el.value) == false)
			Track.FL[2] = el.value*1;
	el = document.getElementById("FLLon2");
	if (el)
		if (isNaN(el.value) == false)
			Track.FL[3] = el.value*1;
	if (Track.FL.length < 4)
		delete(Track.FL)

	el = document.getElementById("LatFL");
	if (el)
		if (isNaN(el.value) == false)
			Track.LatFL = el.value*1;
	el = document.getElementById("LonFL");
	if (el)
		if (isNaN(el.value) == false)
			Track.LonFL = el.value*1;
	el = document.getElementById("CapFL");
	if (el)
		if (isNaN(el.value) == false)
			Track.CapFL = el.value*1;

	Track.Int1 = new Array()
	el = document.getElementById("Int1Lat1");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int1[0] = el.value*1;
	el = document.getElementById("Int1Lon1");
	
	if (el)
		if (isNaN(el.value) == false)
			Track.Int1[1] = el.value*1;
	el = document.getElementById("Int1Lat2");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int1[2] = el.value*1;
	el = document.getElementById("Int1Lon2");
	
	if (el)
		if (isNaN(el.value) == false)
			Track.Int1[3] = el.value*1;
	if (Track.Int1.length < 4)
		delete(Track.Int1)

	el = document.getElementById("LatInt1");
	if (el)
		if (isNaN(el.value) == false)
			Track.LatInt1 = el.value*1;
	el = document.getElementById("LonInt1");
	if (el)
		if (isNaN(el.value) == false)
			Track.LonInt1 = el.value*1;
	el = document.getElementById("CapInt1");
	if (el)
		if (isNaN(el.value) == false)
			Track.CapInt1 = el.value*1;

	Track.Int2 = new Array()
	el = document.getElementById("Int2Lat1");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int2[0] = el.value*1;
	el = document.getElementById("Int2Lon1");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int2[1] = el.value*1;
	el = document.getElementById("Int2Lat2");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int2[2] = el.value*1;
	el = document.getElementById("Int2Lon2");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int2[3] = el.value*1;
	if (Track.Int2.length < 4)
		delete(Track.Int2)

	el = document.getElementById("LatInt2");
	if (el)
		if (isNaN(el.value) == false)
			Track.LatInt2 = el.value*1;
	el = document.getElementById("LonInt2");
	if (el)
		if (isNaN(el.value) == false)
			Track.LonInt2 = el.value*1;
	el = document.getElementById("CapInt2");
	if (el)
		if (isNaN(el.value) == false)
			Track.CapInt2 = el.value*1;

	Track.Int3 = new Array()
	el = document.getElementById("Int3Lat1");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int3[0] = el.value*1;
	el = document.getElementById("Int3Lon1");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int3[1] = el.value*1;
	el = document.getElementById("Int3Lat2");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int3[2] = el.value*1;
	el = document.getElementById("Int3Lon2");
	if (el)
		if (isNaN(el.value) == false)
			Track.Int3[3] = el.value*1;
	if (Track.Int3.length < 4)
		delete(Track.Int3)

	el = document.getElementById("LatInt3");
	if (el)
		if (isNaN(el.value) == false)
			Track.LatInt3 = el.value*1;
	el = document.getElementById("LonInt3");
	if (el)
		if (isNaN(el.value) == false)
			Track.LonInt3 = el.value*1;
	el = document.getElementById("CapInt3");
	if (el)
		if (isNaN(el.value) == false)
			Track.CapInt3 = el.value*1;

	// noms des lignes
	el = document.getElementById("NameFL");
	if (el)
		Track.NameFL = el.value;
	el = document.getElementById("NameInt1");
	if (el)
		Track.NameInt1 = el.value;
	el = document.getElementById("NameInt2");
	if (el)
		Track.NameInt2 = el.value;
	el = document.getElementById("NameInt3");
	if (el)
		Track.NameInt3 = el.value;


	Track.PitIn = new Array()
	el = document.getElementById("PitInLat1");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitIn[0] = el.value*1;
	el = document.getElementById("PitInLon1");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitIn[1] = el.value*1;
	el = document.getElementById("PitInLat2");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitIn[2] = el.value*1;
	el = document.getElementById("PitInLon2");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitIn[3] = el.value*1;
	if (Track.PitIn.length < 4)
		delete(Track.PitIn)

	el = document.getElementById("LatPitIn");
	if (el)
		if (isNaN(el.value) == false)
			Track.LatPitIn = el.value*1;
	el = document.getElementById("LonPitIn");
	if (el)
		if (isNaN(el.value) == false)
			Track.LonPitIn = el.value*1;
	el = document.getElementById("CapPitIn");
	if (el)
		if (isNaN(el.value) == false)
			Track.CapPitIn = el.value*1;

	Track.PitOut = new Array()
	el = document.getElementById("PitOutLat1");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitOut[0] = el.value*1;
	el = document.getElementById("PitOutLon1");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitOut[1] = el.value*1;
	el = document.getElementById("PitOutLat2");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitOut[2] = el.value*1;
	el = document.getElementById("PitOutLon2");
	if (el)
		if (isNaN(el.value) == false)
			Track.PitOut[3] = el.value*1;
	if (Track.PitOut.length < 4)
		delete(Track.PitOut)

	el = document.getElementById("LatPitOut");
	if (el)
		if (isNaN(el.value) == false)
			Track.LatPitOut = el.value*1;
	el = document.getElementById("LonPitOut");
	if (el)
		if (isNaN(el.value) == false)
			Track.LonPitOut = el.value*1;
	el = document.getElementById("CapPitOut");
	if (el)
		if (isNaN(el.value) == false)
			Track.CapPitOut = el.value*1;

	// On va limiter le zoom à 16
	if (Track.Zoom > 16)
		Track.Zoom = 16;

	return true;
}

function saveTrack(parm) {
	// on copy tous les input et on crée le fichier JSON de la piste
	createNewTrack();

	dataPost = new FormData();
	
	for (property in Track) {		
		var valuePost = Track[property];
		if (Array.isArray(Track[property])) {
			valuePost = '['+Track[property]+']';
		}
		// modification de IdCircuit en cas de copie
		if (parm == 1) {
			if (property == "IdCircuit") {
				valuePost = "0"; // force la création d'un circuit
			}
			if (property == "NomCircuit") {
				valuePost += "-Copie"; // force l'ajout du suffixe copie au nom du circuit
			}
		}
		dataPost.append(property, valuePost);
	}
	
	upLoadCircuitAjax(fname_save);
	
	document.getElementById("zone-info").innerHTML = 'Les données du circuit sont en cours de sauvegarde';
}

function upLoadCircuitAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(proc) {
        if (this.readyState == 4) {
			if (this.status == 200) {
				try {dataReturn = JSON.parse(this.responseText);
					var el = document.getElementById("zone-info");
					if (el)
						el.innerHTML = "fichier piste sauvegard&eacute;";
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

function manageLine(line) {
	var center = map.getCenter(); // on met de côté le centrage actuel
	// On recentre la map avec le zoom d'origine
	resetScreen();
	
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

	drawLine(obj);
	setMaxZoom(obj.lat,obj.lon,2);
	
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

function resetScreen() {
	// On recentre la map avec le zoom d'origine
	var zoom = thisCircuit.Zoom*1;
	lat = thisCircuit.Latcenter*1;
	lon = thisCircuit.Loncenter*1;
	map.flyTo([lat,lon],zoom);
}

function setMaxZoom(zlat,zlon,max=20) {
	var corner1 = L.latLng(zlat-0.001, zlon-0.001);
	var corner2 = L.latLng(zlat+0.001, zlon+0.001);
	var bounds  = L.latLngBounds(corner1, corner2);
	map.fitBounds(bounds);
}

function drawLine(objline) {
	// si les coodonnées du segnment de droite sont fournis, on trace le segment de droite avec ces coordonnées
	// sinon, on trace e segment de droite avec les coordonénes de son milieu selon le cap fourni
	if (objline.coord)
		drawLineWithCoord(objline)
	else
		drawLineWithCap(objline)
}

function drawLineWithCoord(objline) {
	// on va tracer un segment de droite à partir des coordonnées de ses extrémités
	
	var A = new Array(objline.coord[0],objline.coord[1]);
	// On marque une des extrémités du segment de droite
	var markerpoint = {lat: A[0], lng: A[1]};
	
	objline.marker1 = new L.Marker(markerpoint,{draggable:true, title: objline.title+' - 1'});
	map.addLayer(objline.marker1);	
	objline.marker1.on('dragend', function(ev) {changeMarker1(ev,objline);});
	
	var B = new Array(objline.coord[2],objline.coord[3]);
	// On marque l'autre extrémité du segment de droite
	var markerpoint = {lat: B[0], lng: B[1]};
	
	objline.marker2 = new L.Marker(markerpoint,{draggable:true, title: objline.title+' - 2'});
	map.addLayer(objline.marker2);	
	objline.marker2.on('dragend', function(ev) {changeMarker2(ev,objline);});

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new L.polyline(pathCoordinates, {color: objline.color});
	map.addLayer(objline.line);	
	
}

function drawLineWithCap(objline) {
	// on va tracer un segment de droite à partir de son milieu et en utilisant le cap fourni 
	
	// on recherche le point B à 50 mètres du point A selon le cap fourni
	var dist = 50; // 50m
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);
	
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
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)

	displayAngle(objline);
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
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)

	displayAngle(objline);
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
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)
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
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)
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
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)

	displayAngle(objline);
}

function refreshInput(objline) {
	// on reporte les données recalculées dans les input
	/* FL en lat,lon,cap */
	var el = document.getElementById("Lat"+objline.idelem)
	if (el) {
		el.value = objline.lat;
		el.style.display = "block";
	}
	var el = document.getElementById("Lon"+objline.idelem)
	if (el)                  {
		el.value = objline.lon;
		el.style.display = "block";
	}
	var el = document.getElementById("Cap"+objline.idelem)
	if (el) {
		el.value = objline.cap;
		el.style.display = "block";
	}
	/* FL en lat1,lon1 / lat2,lon2 */
	var el = document.getElementById(objline.idelem+"Lat1")
	if (el) {
		el.value = objline.coord[0];
		el.style.display = "block";
	}
	var el = document.getElementById(objline.idelem+"Lon1")
	if (el) {
		el.value = objline.coord[1];
		el.style.display = "block";
	}
	var el = document.getElementById(objline.idelem+"Lat2")
	if (el) {
		el.value = objline.coord[2];
		el.style.display = "block";
	}
	var el = document.getElementById(objline.idelem+"Lon2")
	if (el) {
		el.value = objline.coord[3];
		el.style.display = "block";
	}
}

function constructLine() {
	if (ConstructMarks != false) {
		// on efface les marqueurs de construction
		map.removeLayer(ConstructMarks[0]);
		map.removeLayer(ConstructMarks[1]);
		ConstructMarks = false;
		map.removeLayer(ConstructLine);
		ConstructLine = false;
		return;
	}
	else {
		// on crée les marqueurs de construction
		ConstructMarks = new Array();
		// on commence par placer un point là où la map est centrée
		var center = map.getCenter();
		var lat0 = center.lat;
		var lon0 = center.lng;
		var markerpoint = {lat: lat0, lng: lon0};
	
		ConstructMarks[0] = new google.maps.Marker({
			position: markerpoint, title: 'Marqueur 1'
			,icon: {
				path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
				rotation: 0,
				fillColor: "blue",
				fillOpacity: 1,
				scale: 8,
				strokeColor: "blue",
				strokeWeight: 2,
				}
			,draggable: true
			});
		ConstructMarks[0].setMap(map);
		
		ConstructMarks[0].addListener('dragend', function(ev) {
			// on récupère les coordonnées des0 points
			var latlon = ConstructMarks[0].getLatLng();
			var lat0 = latlon.lat;
			var lon0 = latlon.lng;
			var latlon = ConstructMarks[1].getLatLng();
			var lat1 = latlon.lat;
			var lon1 = latlon.lng;
			// on reconstruit la ligne avec le 2ème point
			ConstructLine.setMap(null);
			var pathCoordinates = [{lat: lat0, lng: lon0},{lat: lat1, lng: lon1}];
			ConstructLine = new google.maps.Polyline({
				path: pathCoordinates,
				geodesic: true,
				strokeColor: "white",
				strokeOpacity: 1.0,
				strokeWeight: 2
			});
			ConstructLine.setMap(map);
			// on calcule la distance entre les 2 points et on affiche le résultat dans la zone info
			var A = new Array(lat0,lon0);
			var B = new Array(lat1,lon1);
			var dist = distanceGPS(A,B);
			var el = document.getElementById("zone-info");
			el.innerHTML = dist;
		});
		// on place un point situé à 2 fois la largeur de la piste au cap 90
		var dist = largeur_piste * 2;
		var cap = 90;
		var B = getDestination(lat0,lon0,cap,dist,RT);
		//console.log('destination:'+B);
		var lat1 = B[0];
		var lon1 = B[1];
		var markerpoint = {lat: lat1, lng: lon1};
	
		ConstructMarks[1] = new google.maps.Marker({
			position: markerpoint, title: 'Marqueur 2'
			,icon: {
				path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
				rotation: 0,
				fillColor: "red",
				fillOpacity: 1,
				scale: 8,
				strokeColor: "red",
				strokeWeight: 2,
				}
			,draggable: true
			});
		ConstructMarks[1].setMap(map);
		ConstructMarks[1].addListener('dragend', function(ev) {
			// on récupère les coordonnées des0 points
			var latlon = ConstructMarks[0].getLatLng();
			var lat0 = latlon.lat;
			var lon0 = latlon.lng;
			var latlon = ConstructMarks[1].getLatLng();
			var lat1 = latlon.lat;
			var lon1 = latlon.lng;
			// on reconstruit la ligne avec le 2ème point
			ConstructLine.setMap(null);
			var pathCoordinates = [{lat: lat0, lng: lon0},{lat: lat1, lng: lon1}];
			ConstructLine = new google.maps.Polyline({
				path: pathCoordinates,
				geodesic: true,
				strokeColor: "white",
				strokeOpacity: 1.0,
				strokeWeight: 2
			});
			ConstructLine.setMap(map);
			// on calcule la distance entre les 2 points et on affiche le résultat dans la zone info
			var A = new Array(lat0,lon0);
			var B = new Array(lat1,lon1);
			var dist = distanceGPS(A,B);
			var el = document.getElementById("zone-info");
			el.innerHTML = dist;
		});
		// on construit une ligne entre les 2 marqueurs
		var pathCoordinates = [{lat: lat0, lng: lon0},{lat: lat1, lng: lon1}];
		ConstructLine = new google.maps.Polyline({
			path: pathCoordinates,
			geodesic: true,
			strokeColor: "white",
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		ConstructLine.setMap(map);
	}
}

function displayAngle(objline) {
	var el = document.getElementById("zone-info");
	var html = "";
	
	// point 1
	var latlon = objline.marker.getLatLng();
	var P1 = new Array(latlon.lat, latlon.lng);
	// point 2
	var latlon = objline.markerB.getLatLng();
	var P2 = new Array(latlon.lat, latlon.lng);

	latlon = objline.markercap.getLatLng();
	var P5 = new Array(latlon.lat, latlon.lng);

	var angle = getAngle(P1,P2);
	var cap = initialBearingTo(P1,P2);
	var angle = 450-cap;
	if (!(angle-360 < 0))
		angle = angle-360;
	html += ',angle 1-2='+rad2deg(angle);

	var angle = getAngle(P1,P5);
	var cap = initialBearingTo(P1,P5);
	var angle = 450-cap;
	if (!(angle-360 < 0))
		angle = angle-360;
	html += ',angle 1-5='+rad2deg(angle);
	
	var cap = deg2rad(objline.cap);
	var angle = ((π*5)/2)-cap;
	if (!angle-(π*2) < 0)
		angle = angle+(π*2);
	html += ',angle cap='+rad2deg(angle);
	var A = new Array(objline.lat,objline.lon);
	var d = 0.0005;
	var B = new Array(A[0]+(d*Math.sin(angle)),A[1]+(d*Math.cos(angle)));
	var r = distanceGPS(A,B);
	var angle = getAngle(A,B);
	var cap = initialBearingTo(A,B);
	var angle = 450-cap;
	if (!(angle-360 < 0))
		angle = angle-360;
	html += ',angle cap calculé='+rad2deg(angle);
	/*
	Trouver la valeur de x'
	x' = X1 + X2
	sin C1 = X1 / Z X1 = Z sin C
	cos C2 = X2 / X X2 = X cos C
	x' = x cos C + z sin C	
	*/
	var x = d;
	
	el.innerHTML = html;
}

function displayCercleTrigo(objline) {
	var dist = 50;
	var A = new Array(objline.lat,objline.lon);
	var Caps = new Array(0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330);
	objline.Points = new Array();
	for (var i=0; i<Caps.length; i++) {
		//var B = new Array(A[0]+(d*Math.sin(Points[i])),A[1]+(d*Math.cos(Points[i])));
		var B = getDestination(objline.lat,objline.lon,Caps[i],dist,RT);
		var markerpoint = {lat: B[0], lng: B[1]};
		objline.Points[i] = new google.maps.Marker({
			position: markerpoint
		});
		objline.Points[i].setMap(map);
	}
}

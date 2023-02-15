var fname = 'ajax/get_circuit.py';
//var fname = 'cgi-bin/get_circuit.py';
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

//document.getElementById("clipboard").style.display = "none"; // On n'affiche pas le contenu du presse-papier


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
				//alert("responseText:"+this.responseText);
				console.log(this.responseText);
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

// Initialize API Googlemap
function initGooglemap() {
  document.getElementById('map').style.display = 'block';
  map = true;
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
			console.log(JSON.stringify(CoordsCircuit));
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
	var zoom = thisCircuit.Zoom*1;
	console.log("lat:"+lat+",lon:"+lon+",zoom:"+zoom);

    optionsMap = {
         zoom: zoom,
         center: new google.maps.LatLng(lat,lon),
         draggableCursor:"crosshair",
         mapTypeId: google.maps.MapTypeId.SATELLITE
    };
	
	map = new google.maps.Map(document.getElementById('map'), optionsMap);

	lat = thisCircuit.Latitude*1;
	lon = thisCircuit.Longitude*1;
	var point = {lat: lat, lng: lon};
	var markerpoint = {lat: lat, lng: lon};
	currentmarker = new google.maps.Marker({
		position: markerpoint, title: 'entrée sur '+thisCircuit.NomCircuit
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

	google.maps.event.addListener(map, 'rightclick', function(event) {
		copyClipboard(event);
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
		//thisCircuit[id] = newval;
	}
}
	
function mouseMove(mousePt) {
	mouseLatLng = mousePt.latLng;
	var mouseCoord = mouseLatLng.toUrlValue();
	var mouseLat = mouseLatLng.lat();
	var mouseLon = mouseLatLng.lng();
	
	var oStatusDiv = document.getElementById("clipboard")	
	if (oStatusDiv) {
		oStatusDiv.value  = mouseLat + ',' + mouseLon;
	}
	//document.getElementById("zone-info").innerHTML = '';
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
	console.log("FL:"+thisCircuit.FL)
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
	el = document.getElementById("LatFL");
	if (thisCircuit.LatFL) {
		el.value = thisCircuit.LatFL;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonFL");
	if (thisCircuit.LonFL) {
		el.value = thisCircuit.LonFL;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapFL");
	if (thisCircuit.CapFL) {
		el.value = thisCircuit.CapFL;
	}
	else el.style.display = 'none';

	/* Int1 en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("Int1Lat1");
	console.log("Int1:"+thisCircuit.Int1)
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int1Lon1");
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int1Lat2");
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int1Lon2");
	if (thisCircuit.Int1) {
		el.value = thisCircuit.Int1[3];
	}
	else el.style.display = 'none';

	/* Int1 en lat,lon,cap */
	el = document.getElementById("LatInt1");
	if (thisCircuit.LatInt1) {
		el.value = thisCircuit.LatInt1;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonInt1");
	if (thisCircuit.LonInt1) {
		el.value = thisCircuit.LonInt1;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapInt1");
	if (thisCircuit.CapInt1) {
		el.value = thisCircuit.CapInt1;
	}
	else el.style.display = 'none';

	/* Int2 en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("Int2Lat1");
	console.log("Int2:"+thisCircuit.Int2)
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int2Lon1");
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int2Lat2");
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int2Lon2");
	if (thisCircuit.Int2) {
		el.value = thisCircuit.Int2[3];
	}
	else el.style.display = 'none';

	/* Int2 en lat,lon,cap */
	el = document.getElementById("LatInt2");
	if (thisCircuit.LatInt2) {
		el.value = thisCircuit.LatInt2;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonInt2");
	if (thisCircuit.LonInt2) {
		el.value = thisCircuit.LonInt2;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapInt2");
	if (thisCircuit.CapInt2) {
		el.value = thisCircuit.CapInt2;
	}
	else el.style.display = 'none';

	/* Int3 en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("Int3Lat1");
	console.log("Int3:"+thisCircuit.Int3)
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int3Lon1");
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int3Lat2");
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("Int3Lon2");
	if (thisCircuit.Int3) {
		el.value = thisCircuit.Int3[3];
	}
	else el.style.display = 'none';

	/* Int3 en lat,lon,cap */
	el = document.getElementById("LatInt3");
	if (thisCircuit.LatInt3) {
		el.value = thisCircuit.LatInt3;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonInt3");
	if (thisCircuit.LonInt3) {
		el.value = thisCircuit.LonInt3;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapInt3");
	if (thisCircuit.CapInt3) {
		el.value = thisCircuit.CapInt3;
	}
	else el.style.display = 'none';

	/* PitIn en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("PitInLat1");
	console.log("PitIn:"+thisCircuit.PitIn)
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitInLon1");
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitInLat2");
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitInLon2");
	if (thisCircuit.PitIn) {
		el.value = thisCircuit.PitIn[3];
	}
	else el.style.display = 'none';

	/* PitIn en lat,lon,cap */
	el = document.getElementById("LatPitIn");
	if (thisCircuit.LatPitIn) {
		el.value = thisCircuit.LatPitIn;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonPitIn");
	if (thisCircuit.LonPitIn) {
		el.value = thisCircuit.LonPitIn;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapPitIn");
	if (thisCircuit.CapPitIn) {
		el.value = thisCircuit.CapPitIn;
	}
	else el.style.display = 'none';

	/* PitOut en lat1,lon1 / lat2,lon2 */
	el = document.getElementById("PitOutLat1");
	console.log("PitOut:"+thisCircuit.PitOut)
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[0];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitOutLon1");
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[1];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitOutLat2");
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[2];
	}
	else el.style.display = 'none';
	el = document.getElementById("PitOutLon2");
	if (thisCircuit.PitOut) {
		el.value = thisCircuit.PitOut[3];
	}
	else el.style.display = 'none';

	/* PitOut en lat,lon,cap */
	el = document.getElementById("LatPitOut");
	if (thisCircuit.LatPitOut) {
		el.value = thisCircuit.LatPitOut;
	}
	else el.style.display = 'none';

	el = document.getElementById("LonPitOut");
	if (thisCircuit.LonPitOut) {
		el.value = thisCircuit.LonPitOut;
	}
	else el.style.display = 'none';

	el = document.getElementById("CapPitOut");
	if (thisCircuit.CapPitOut) {
		el.value = thisCircuit.CapPitOut;
	}
	else el.style.display = 'none';


}

function copyTrack(parm=0) {
	// on copy tous les input et on crée le fichier JSON de la piste
	createNewTrack();
	
	var json = JSON.stringify(Track, null, '\t');
	//console.log(json);
	//var arrayToString = JSON.stringify(Object.assign({}, Track));  // convert array to string
	//console.log(JSON.stringify(arrayToString));
    //var stringToJsonObject = JSON.parse(arrayToString);  // convert string to json object
	//
    //console.log(stringToJsonObject);

	//console.log(JSON.stringify(Object.assign({},Track)));
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

	for (property in Track) {
		console.log(property+':'+Track[property]);
	}
	return true;
}

function saveTrack(parm) {
	console.log('parm saveTrack:'+parm);
	// on copy tous les input et on crée le fichier JSON de la piste
	createNewTrack();

	dataPost = new FormData();
	/*
	for (property in Track) {
		if (Array.isArray(Track[property])) {
			for (var i=0; i<Track[property].length; i++) {
				dataPost.append(property+"-"+i, Track[property][i]);
			}
		}
		else {
			dataPost.append(property, Track[property]);
		}
	}
	*/
	/*
	for (property in Track) {
		dataPost.append(property, Track[property]);
	}
	*/
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
	console.log(JSON.stringify(dataPost));
	
	upLoadCircuitAjax(fname_save);
	
	document.getElementById("zone-info").innerHTML = 'Les données du circuit sont en cours de sauvegarde';
}

function upLoadCircuitAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(proc) {
        if (this.readyState == 4) {
			if (this.status == 200) {
				//alert("responseText:"+this.responseText);
				console.log(this.responseText);
				try {dataReturn = JSON.parse(this.responseText);
					console.log(JSON.stringify(dataReturn));
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
/*
var data = new FormData();
data.append('user', 'person');
data.append('pwd', 'password');
data.append('organization', 'place');
data.append('requiredkey', 'key');

var xhr = new XMLHttpRequest();
xhr.open('POST', 'somewhere', true);
xhr.onload = function () {
    // do something to response
    console.log(this.responseText);
};
xhr.send(data);*/


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
		console.log("drawLine(objStart)")
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
		console.log("drawLine(objStart)")
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
		console.log("drawLine(objStart)")
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
		console.log("drawLine(objStart)")
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
		console.log("drawLine(objStart)")
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
		console.log("drawLine(objStart)")
		drawLine(objPitOut);
	}
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
		//if (!confirm("la ligne est déjà active, voulez-vous la changer ?"))
		//	return;
		setMaxZoom(obj.lat,obj.lon);
		return;
	}
	if (obj.marker1) {
		//if (!confirm("la ligne est déjà active, voulez-vous la changer ?"))
		//	return;
		setMaxZoom(obj.coord[0],obj.coord[1]);
		return;
	}

	obj = new Object();
	// SI la ligne n'existe pas on va la placer là où on était centré
	obj.lat = center.lat();
	obj.lon = center.lng();
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

function resetScreen() {
	// On recentre la map avec le zoom d'origine
	var zoom = thisCircuit.Zoom*1;
	map.setZoom(zoom);
	lat = thisCircuit.Latcenter*1;
	lon = thisCircuit.Loncenter*1;
	var googleLatLng = new google.maps.LatLng(lat,lon); 
	map.setCenter(googleLatLng);
}

function setMaxZoom(zlat,zlon,max=20) {
	var googleLatLng = new google.maps.LatLng(zlat,zlon); 
	map.setCenter(googleLatLng);
	var oldz = map.getZoom();
	var newz = oldz + max;
	if (newz !='NaN') {
		map.setZoom(newz);
	}
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
	
	objline.marker1 = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - 1'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/1.png'
		,draggable: true
		});
	objline.marker1.setMap(map);
	
	var B = new Array(objline.coord[2],objline.coord[3]);
	// On marque l'autre extrémité du segment de droite
	var markerpoint = {lat: B[0], lng: B[1]};
	
	objline.marker2 = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - 2'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/2.png'
		,draggable: true
		});
	objline.marker2.setMap(map);

	objline.marker1.addListener('dragend', function(ev) {changeMarker1(ev,objline);});

	objline.marker2.addListener('dragend', function(ev) {changeMarker2(ev,objline);});

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: objline.color,
		//strokeColor: "black",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	objline.line.setMap(map);

	//objline.coord = new Array(coord1[0],coord1[1],coord2[0],coord2[1]);
	
}

function drawLineWithCap(objline) {
	// on va tracer un segment de droite à partir de son milieu et en utilisant le cap fourni 
	
	// on recherche le point B à 50 mètres du point A selon le cap fourni
	var dist = 50; // 50m
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);
	console.log('destination:'+B);
	
	var A = new Array(objline.lat,objline.lon);
	// On marque le point actuel qui représente le milieu du segment de droite
	var markerpoint = {lat: A[0], lng: A[1]};
	
	objline.marker = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Milieu'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/A.png'
		,draggable: true
		});
	objline.marker.setMap(map);

	// on marque les 2 points sur la droite du cap
	var markerpoint = {lat: B[0], lng: B[1]};
	objline.markercap = new google.maps.Marker({
		position: markerpoint, title: 'Cap'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png'
		,draggable: true
		});
	objline.markercap.setMap(map);
	objline.markercap.addListener('dragend', function(ev) {changeMarkercap(ev,objline);});
		
	// On trace une ligne entre le point milieu du segment de droite et le point cap
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: 'blue',
		strokeOpacity: 1.0,
		strokeWeight: 0.5
	});
	objline.linecap.setMap(map);
	objline.marker.addListener('dragend', function(ev) {changeMarker(ev,objline);});

	// On trace une ligne passant par le point start, perpendiculaire à la droite point start;point gps et 2 points (P1;P-1)
	// situés de part et d'autre du point start à une distance égale à la largeur de la piste
	var icoord = getPerpendiculaire(A,B);
	console.log(icoord);
	var coord1 = pointDroite(A,new Array(icoord[0],icoord[1]),largeur_piste); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 
	var coord2 = pointDroite(A,new Array(icoord[2],icoord[3]),largeur_piste); // le point situé à 50m du point de départ sur le segment de droite de latitude = latitude de A 
	
	var markerpoint = {lat: coord1[0], lng: coord1[1]};
	objline.markerB = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Bord'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/2.png'
		,draggable: true
		});
	objline.markerB.setMap(map);
	//
	objline.markerB.addListener('dragend', function(ev) {changeMarkerB(ev,objline);});
	
	// marqueur 2 pour tests
	var markerpoint = {lat: coord2[0], lng: coord2[1]};
	objline.markerB2 = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Bord opposé'
			,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png'
			,draggable: false
		});
	objline.markerB2.setMap(map);

	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (Array.isArray(icoord)) {
		var pathCoordinates = [{lat: coord1[0], lng: coord1[1]},{lat: coord2[0], lng: coord2[1]}];
		objline.line = new google.maps.Polyline({
			path: pathCoordinates,
			geodesic: true,
			strokeColor: objline.color,
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		objline.line.setMap(map);
	}
	objline.coord = new Array(coord1[0],coord1[1],coord2[0],coord2[1]);
}

function changeMarker(ev,objline) {
	// Le marqueur du milieu de ligne a bougé, on recalcule les coordonnées
	var lat = objline.lat; // latitude avant déplacement
	var lon = objline.lon; // longitude avant déplacement
	var latlon = objline.marker.getPosition();
	
	objline.lat = latlon.lat();
	objline.lon = latlon.lng();
	
	// On va déplacer tous les points de façon homogène sur un plan
	objline.coord[1] += (objline.lon - lon);
	objline.coord[0] += (objline.lat - lat);
	objline.coord[2] += (objline.lat - lat);
	objline.coord[3] += (objline.lon - lon);

	// On marque à nouveau le point par rapport au point de départ
	if (objline.markerB != '') {
		objline.markerB.setMap(null);
		objline.markerB = '';
	}
	var markerpoint = {lat: objline.coord[0], lng: objline.coord[1]};
	objline.markerB = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Bord'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/2.png'
		,draggable: true
		});
	objline.markerB.setMap(map);
	objline.markerB.addListener('dragend', function(ev) {changeMarkerB(ev,objline);});

	// On marque à nouveau le point opposé par rapport au point de départ
	if (objline.markerB2 != '') {
		objline.markerB2.setMap(null);
		objline.markerB2 = '';
	}
	var markerpoint = {lat: objline.coord[2], lng: objline.coord[3]};
	
	objline.markerB2 = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Bord opposé'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png'
    	//	,icon: 'http://maps.google.com/mapfiles/kml/paddle/A.png'
		//,draggable: true
		});
	objline.markerB2.setMap(map);
	
	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (objline.line != '') {
		objline.line.setMap(null);
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: objline.color,
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	objline.line.setMap(map);
	
	// on recalcule le cap
	objline.cap = wrap360(getCap(objline) + 90); // 90° de + par rapport au cap point bord de ligne de départ, point milieu de ligne de départ

	// On remarque le cap
	var dist = 50;
	var A = new Array(objline.lat,objline.lon);
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);
	
	if (objline.markercap != '') {
		objline.markercap.setMap(null);
		objline.markercap = '';
	}
	var markerpoint = {lat: B[0], lng: B[1]};
	objline.markercap = new google.maps.Marker({
		position: markerpoint, title: 'Cap'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png'
		,draggable: true
		});
	objline.markercap.setMap(map);
	objline.markercap.addListener('dragend', function(ev) {changeMarkercap(ev,objline);});

	// On trace une ligne entre le point de départ (milieu du segment de droite) et le point cap
	if (objline.linecap != '') {
		objline.linecap.setMap(null);
		objline.linecap = '';
	}
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: 'blue',
		strokeOpacity: 1.0,
		strokeWeight: 0.5
	});
	objline.linecap.setMap(map);
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)

	displayAngle(objline);
}

function changeMarker1(ev,objline) {
	// Le marqueur 1 du segment de droite a bougé, on recalcule les coordonnées
	var latlon = objline.marker1.getPosition();
	
	objline.coord[0] = latlon.lat();
	objline.coord[1] = latlon.lng();

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	if (objline.line != '') {
		objline.line.setMap(null);
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: objline.color,
		//strokeColor: "pink",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	objline.line.setMap(map);
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)
}

function changeMarker2(ev,objline) {
	// Le marqueur 2 du segment de droite a bougé, on recalcule les coordonnées
	var latlon = objline.marker2.getPosition();
	
	objline.coord[2] = latlon.lat();
	objline.coord[3] = latlon.lng();

	// On va tracer une ligne entre les 2 points pour matérialiser le segment de droite
	if (objline.line != '') {
		objline.line.setMap(null);
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: objline.color,
		//strokeColor: "grey",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	objline.line.setMap(map);
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)
}

function changeMarkerB(ev,objline) {
	// Le marqueur du bord de ligne a bougé, on recalcule pcoord
	var latlon = objline.markerB.getPosition();
	
	objline.coord[0] = latlon.lat();
	objline.coord[1] = latlon.lng();
	
	objline.coord[2] = objline.coord[0]+((objline.lat-objline.coord[0])*2);
	objline.coord[3] = objline.coord[1]+((objline.lon-objline.coord[1])*2);

	// On marque à nouveau le point opposé par rapport au point de départ
	if (objline.markerB2 != '') {
		objline.markerB2.setMap(null);
		objline.markerB2 = '';
	}
	var markerpoint = {lat: objline.coord[2], lng: objline.coord[3]};
	
	objline.markerB2 = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Bord opposé'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png'
		,draggable: false
		});
	objline.markerB2.setMap(map);
	
	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (objline.line != '') {
		objline.line.setMap(null);
		objline.line = '';
	}
	var pathCoordinates = [{lat: objline.coord[0], lng: objline.coord[1]},{lat: objline.coord[2], lng: objline.coord[3]}];
	objline.line = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: objline.color,
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	objline.line.setMap(map);
	
	// on recalcule le cap
	objline.cap = wrap360(getCap(objline) + 90); // 90° de + par rapport au cap point bord de ligne de départ, point milieu de ligne de départ

	// On remarque le cap
	var dist = 50;
	var A = new Array(objline.lat,objline.lon);
	var B = getDestination(objline.lat,objline.lon,objline.cap,dist,RT);
	
	if (objline.markercap != '') {
		objline.markercap.setMap(null);
		objline.markercap = '';
	}
	var markerpoint = {lat: B[0], lng: B[1]};
	objline.markercap = new google.maps.Marker({
		position: markerpoint, title: 'Cap'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png'
		,draggable: true
		});
	objline.markercap.setMap(map);
	objline.markercap.addListener('dragend', function(ev) {changeMarkercap(ev,objline);});

	// On trace une ligne entre le point de départ et le point cap
	if (objline.linecap != '') {
		objline.linecap.setMap(null);
		objline.linecap = '';
	}
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: 'blue',
		strokeOpacity: 1.0,
		strokeWeight: 0.5
	});
	objline.linecap.setMap(map);
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)

	displayAngle(objline);
}

function changeMarkercap(ev,objline) {
	// Le marqueur du point de cap a bougé, on recalcule le cap
	var latlon = objline.markercap.getPosition();
	var A = new Array(objline.lat,objline.lon); // point milieu de ligne
	var B = new Array(latlon.lat(), latlon.lng()); // point cap
	var cap = initialBearingTo(A,B);
		
	// on efface le précédent point cap
	if (objline.markercap != '') {
		objline.markercap.setMap(null);
		objline.markercap = '';
	}
	// on marque le nouveau point cap
	var markerpoint = {lat: B[0], lng: B[1]};
	objline.markercap = new google.maps.Marker({
		position: markerpoint, title: 'Cap'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/red-stars-lv.png'
		,draggable: true
		});
	objline.markercap.setMap(map);
	objline.markercap.addListener('dragend', function(ev) {changeMarkercap(ev,objline);});
		
	// on efface la précédente ligne cap
	if (objline.linecap != '') {
		objline.linecap.setMap(null);
		objline.linecap = '';
	}
		
	// On retrace la ligne entre le point milieu du segment de droite et le point cap
	var pathCoordinates = [{lat: A[0], lng: A[1]},{lat: B[0], lng: B[1]}];
	objline.linecap = new google.maps.Polyline({
		path: pathCoordinates,
		geodesic: true,
		strokeColor: 'blue',
		strokeOpacity: 1.0,
		strokeWeight: 0.5
	});
	objline.linecap.setMap(map);
	
	// On trace une ligne passant par le point start, perpendiculaire à la droite point start;point gps et 2 points (P1;P-1)
	// situés de part et d'autre du point start à une distance égale à 2 fois le point milieu et le point Bord
	// on commence par calculer la distance entre milieu le bord
	var latlon = objline.markerB.getPosition();
	var C = new Array(latlon.lat(), latlon.lng()); // point bord
	var dist = distanceGPS(A,C);
	
//jfk
	var icoord = getPerpendiculaire(A,B);
	console.log(icoord);
	var coord1 = pointDroite(A,new Array(icoord[0],icoord[1]),dist);
	var coord2 = pointDroite(A,new Array(icoord[2],icoord[3]),dist);

	if (objline.markerB != '') {
		objline.markerB.setMap(null);
		objline.markerB = '';
	}
	
	var markerpoint = {lat: coord1[0], lng: coord1[1]};
	objline.markerB = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Bord'
		,icon: 'http://maps.google.com/mapfiles/kml/paddle/2.png'
		,draggable: true
		});
	objline.markerB.setMap(map);
	objline.markerB.addListener('dragend', function(ev) {changeMarkerB(ev,objline);});

	if (objline.markerB2 != '') {
		objline.markerB2.setMap(null);
		objline.markerB2 = '';
	}

	var markerpoint = {lat: coord2[0], lng: coord2[1]};
	objline.markerB2 = new google.maps.Marker({
		position: markerpoint, title: objline.title+' - Bord opposé'
			,icon: 'http://maps.google.com/mapfiles/kml/paddle/wht-blank-lv.png'
			,draggable: false
		});
	objline.markerB2.setMap(map);
	
	// On va tracer une ligne entre les 2 points pour matérialiser la ligne de départ
	if (Array.isArray(icoord)) {
		if (objline.line != '') {
			objline.line.setMap(null);
			objline.line = '';
		}
		var pathCoordinates = [{lat: coord1[0], lng: coord1[1]},{lat: coord2[0], lng: coord2[1]}];
		objline.line = new google.maps.Polyline({
			path: pathCoordinates,
			geodesic: true,
			strokeColor: objline.color,
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		objline.line.setMap(map);
	}
	objline.coord = new Array(coord1[0],coord1[1],coord2[0],coord2[1]);
	
	// on reporte les données recalculées dans les input
	refreshInput(objline)

	displayAngle(objline);
}

function refreshInput(objline) {
	// on reporte les données recalculées dans les input
	console.log("report des données")
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
		ConstructMarks[0].setMap(null);
		ConstructMarks[1].setMap(null);
		ConstructMarks = false;
		ConstructLine.setMap(null);
		ConstructLine = false;
		return;
	}
	else {
		// on crée les marqueurs de construction
		ConstructMarks = new Array();
		// on commence par placer un point là où la map est centrée
		var center = map.getCenter();
		var lat0 = center.lat();
		var lon0 = center.lng();
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
			var latlon = ConstructMarks[0].getPosition();
			var lat0 = latlon.lat();
			var lon0 = latlon.lng();
			var latlon = ConstructMarks[1].getPosition();
			var lat1 = latlon.lat();
			var lon1 = latlon.lng();
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
		console.log('destination:'+B);
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
			var latlon = ConstructMarks[0].getPosition();
			var lat0 = latlon.lat();
			var lon0 = latlon.lng();
			var latlon = ConstructMarks[1].getPosition();
			var lat1 = latlon.lat();
			var lon1 = latlon.lng();
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
	var latlon = objline.marker.getPosition();
	var P1 = new Array(latlon.lat(), latlon.lng());
	// point 2
	var latlon = objline.markerB.getPosition();
	var P2 = new Array(latlon.lat(), latlon.lng());
	//// point 3
	//latlon = objline.markerB2.getPosition();
	//var P3 = new Array(latlon.lat(), latlon.lng());
	//// point 4
	//latlon = objline.markerP1.getPosition();
	//var P4 = new Array(latlon.lat(), latlon.lng());
	// point 5
	latlon = objline.markercap.getPosition();
	var P5 = new Array(latlon.lat(), latlon.lng());

	var angle = getAngle(P1,P2);
	console.log('angle 1-2='+rad2deg(angle));
	var cap = initialBearingTo(P1,P2);
	console.log('bearing='+cap);
	var angle = 450-cap;
	if (!(angle-360 < 0))
		angle = angle-360;
	console.log("cap:"+cap+",angle="+angle);
	html += ',angle 1-2='+rad2deg(angle);

	//var angle = getAngle(P2,P3);
	//console.log('angle 2-3='+rad2deg(angle));
	//var cap = initialBearingTo(P2,P3);
	//console.log('bearing='+cap);
	//var angle = 450-cap;
	//if (!(angle-360 < 0))
	//	angle = angle-360;
	//console.log("cap:"+cap+",angle="+angle);
	//html += ',angle 2-3='+rad2deg(angle);

	//var angle = getAngle(P1,P4);
	//console.log('angle 1-4='+rad2deg(angle));
	//var cap = initialBearingTo(P1,P4);
	//console.log('bearing='+cap);
	//var angle = 450-cap;
	//if (!(angle-360 < 0))
	//	angle = angle-360;
	//console.log("cap:"+cap+",angle="+angle);
	//html += ',angle 1-4='+rad2deg(angle);

	var angle = getAngle(P1,P5);
	console.log('angle 1-5='+rad2deg(angle));
	var cap = initialBearingTo(P1,P5);
	console.log('bearing='+cap);
	var angle = 450-cap;
	if (!(angle-360 < 0))
		angle = angle-360;
	console.log("cap:"+cap+",angle="+angle);
	html += ',angle 1-5='+rad2deg(angle);
	
	var cap = deg2rad(objline.cap);
	var angle = ((π*5)/2)-cap;
	if (!angle-(π*2) < 0)
		angle = angle+(π*2);
	console.log("cap (rad):"+cap+",angle (rad)="+angle);
	console.log("angle(rad)="+angle+",cos="+Math.cos(angle)+",sin="+Math.sin(angle));
	html += ',angle cap='+rad2deg(angle);
	//var A = convCoord(gpslat,gpslatS,gpslon,gpslonS);
	var A = new Array(objline.lat,objline.lon);
	var d = 0.0005;
	var B = new Array(A[0]+(d*Math.sin(angle)),A[1]+(d*Math.cos(angle)));
	var r = distanceGPS(A,B);
	var angle = getAngle(A,B);
	console.log('angle du cap='+rad2deg(angle));
	var cap = initialBearingTo(A,B);
	console.log('bearing='+cap);
	var angle = 450-cap;
	if (!(angle-360 < 0))
		angle = angle-360;
	console.log("cap:"+cap+",angle="+angle);
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

function distanceGPS(A, B) {
	var latA = deg2rad(A[0]);
	var lonA = deg2rad(A[1]);
	var latB = deg2rad(B[0]);
	var lonB = deg2rad(B[1]);
	//console.log('latA='+latA+',lonA='+lonA+',latB='+latB+',lonB='+lonB);
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
	//radius=6371e3;
        const R = radius;
        const φ1 = latA,  λ1 = lonA;
        const φ2 = latB, λ2 = lonB;
        const Δφ = φ2 - φ1;
        const Δλ = λ2 - λ1;

        const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2) * Math.sin(Δλ/2)*Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
		//console.log('distance='+d);
		/*
	*/
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
	//console.log('Acos='+Acos);
	if (Acos > 1) Acos = 1;
	var D = Math.acos(Acos);
	//console.log('D='+D);
    //var S = Math.acos(Math.sin(latA)*Math.sin(latB) + Math.cos(latA)*Math.cos(latB)*Math.cos(Math.abs(longB-longA)))
	var S = D;
    // distance entre les 2 points, comptée sur un arc de grand cercle
		//console.log('distance='+S*RT);
    return S*RT
}

// placer 2 points sur la droite perpendiculaire à la droite A,B passant par A, situées de part et d'autre de A à une distance de A égale à la distance A-B
function getPerpendiculaire(A,B) { // coordonnées du point A, point B
	// les coordonnées sont ramenées sur un plan, abscisse x = longitude, coordonnée y = latitude
	//console.log(A);
	//console.log(B);
	//console.log('coordonnées='+A+','+B);
	var Ya = A[0];
	var Xa = A[1];
	var Yb = B[0];
	var Xb = B[1];
	//console.log('coordonnées d\origine du point A='+Xa+','+Ya);
	//console.log('coordonnées d\origine du point B='+Xb+','+Yb);
	// le rayon du cerlce de centre A est égal à la distance A,B
	var r = distanceGPS(A,B);
	console.log('r='+r);
	
	// coordonnées d'un point B sur un cercle de centre A: X, Y
	var X = Xb-Xa; // X = côté Adjacent de l'angle a
	//console.log('côté adjacent='+X);
	var Y = Yb-Ya; // Y = côté Opposé de l'angle a
	//console.log('côté opposé='+Y);
//	
	var latA = deg2rad(A[0]);
	var lonA = deg2rad(A[1]);
	var latB = deg2rad(B[0]);
	var lonB = deg2rad(B[1]);
	
	var cosA = Math.cos(latA);
	var cosB = Math.cos(latB);
	//console.log('cosinus A,B='+cosA+','+cosB);
	
	var PX = Xa+(Y*(1/cosA));
	var PY = Ya+(X*cosA*-1);
	//console.log('coordonnées corrigées='+PX+','+PY);
	var PXo = Xa-(Y*(1/cosA));
	var PYo = Ya-(X*cosA*-1);
	//console.log('coordonnées opposées='+PXo+','+PYo);
	var newcoord = new Array(PY,PX,PYo,PXo);
	//console.log('newcoord ='+newcoord);
	return newcoord;	
}

// placer un point sur la droite A,B à une distance d du point A
function pointDroite(A,B,d) { // coordonnées du point A, point B et distance à partir de A
	var dtot = distanceGPS(A,B)	;
	//console.log(A);
	//console.log(B);
	//console.log(d);
	//console.log('dist tot='+dtot);
	//console.log('coordonnées='+A+','+B);
	var latp1 = A[0];
	var lonp1 = A[1];
	var latp2 = B[0];
	var lonp2 = B[1];
	var latc = latp1+((latp2-latp1)*d/dtot);
	//console.log('latc='+latc);
	var lonc = lonp1+((lonp2-lonp1)*d/dtot);
	//console.log('lonc='+lonc);
	return new Array(latc,lonc);	
}

function deg2rad(dg) {
	return dg/180*π;
}

function rad2deg(rd) {
	return rd*180/π;
}

// retourne l'angle formés par la droite A,B (A=origine, B=destination)
function getAngle(A,B) {
	console.log('coordonnées='+A+','+B);

	var Ya = A[0];
	var Xa = A[1];
	var Yb = B[0];
	var Xb = B[1];
	
	// coordonnées d'un point B sur un cercle de centre A: X, Y
	var X = Xb-Xa; // X = côté Adjacent de l'angle a
	console.log('côté adjacent='+X);
	var Y = Yb-Ya; // Y = côté Opposé de l'angle a
	console.log('côté opposé='+Y);
	
	// calcul sinus et cosinus avec les coordonnées lat, lon
	var H = Math.sqrt((Y*Y)+(X*X));
	console.log('hypoténuse='+H);
	
	var cosB = X/H;
	var sinB = Y/H;
	console.log('cosB:'+cosB+',sinB:'+sinB);
	
	//if (X<0) cosB = cosB * -1;
	//if (Y<0) sinB = sinB * -1;
	console.log('cosB:'+cosB+',sinB:'+sinB);
	
	var angleB = Math.acos(Math.abs(cosB)); // angle par rapport à l'horizontale
	console.log('angle B='+angleB+'('+rad2deg(angleB)+')');
	if (Number.isNaN(angleB))
		angleB = 0;
	// valeur de l'angle en radian en fonction du signe du sinus et du signe du cosinus
	if (sinB > 0) {
		if (cosB < 0)
			angleB = π - angleB;
	}
	else {
		if (cosB > 0)
			angleB = (2*π)-angleB;
		else
			angleB = π+angleB;
	}
	console.log('angle B (0-360)='+angleB+'('+rad2deg(angleB)+')');
	
	//var angle = rad2deg(angleB);
	//console.log('angle='+angleB);


	
	
	// calcul sinus et cosinus avec la longueur des côtés
	//var OM = distanceGPS(A,B);
	//var OH = distanceGPS(A,new Array(A[0],B[1]));
	//var OK = distanceGPS(new Array(A[0],B[0]),B);
	//var cosB = OH/OM;
	//var sinB = OK/OM;
	//console.log('cosB:'+cosB+'sinB:'+sinB);
	//
	//if (X<0) sinB = sinB * -1;
	//if (Y<0) cosB = cosB * -1;
	//console.log('cosB:'+cosB+',sinB:'+sinB);
	
	var angle = angleB;
	return angle;
	
	//return angle+',X='+X+',Y='+Y+',cos='+cosB+',sin='+sinB+'<br>A('+A[0]+','+A[1]+'),B('+B[0]+','+B[1]+')';
}

function getCap(objline) {
	var Acoord = new Array(objline.coord[0],objline.coord[1]);
	var Bcoord = new Array(objline.coord[2],objline.coord[3]);
	
	var angle = getAngle(Acoord,Bcoord);
	console.log('angle='+angle);
	
	var cap = initialBearingTo(Acoord,Bcoord);
	console.log('bearing='+cap);

	return cap;
	
	var cap =  (π) - angle;
	console.log('angle='+rad2deg(angle)+'cap='+rad2deg(cap));
	if (cap < 0)
		cap = (π*2)+cap;
	console.log('angle='+rad2deg(angle)+'cap='+rad2deg(cap));
	objline.cap = rad2deg(cap);
	
/*
	
	var cap = deg2rad(objline.cap);
	var angle = ((π*5)/2)-cap;
	if (!angle-(π*2) < 0)
		angle = angle+(π*2);
	console.log("cap (rad):"+cap+",angle (rad)="+angle);
*/	

}

//var B = getDestination(objline.lat,objline.lon,objline.cap,dist)
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

/**
 * Returns the initial bearing from ‘this’ point to destination point.
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @returns {number} Initial bearing in degrees from north (0°..360°).
 *
 * @example
 *   const p1 = new LatLon(52.205, 0.119);
 *   const p2 = new LatLon(48.857, 2.351);
 *   const b1 = p1.initialBearingTo(p2); // 156.2°
 */
function initialBearingTo(point1, point2) {
    // tanθ = sinΔλ⋅cosφ2 / cosφ1⋅sinφ2 − sinφ1⋅cosφ2⋅cosΔλ
    // see mathforum.org/library/drmath/view/55417.html for derivation
	var p1lat = point1[0];
	var p1lon = point1[1];
	var p2lat = point2[0];
	var p2lon = point2[1];

    const φ1 = deg2rad(p1lat);
    const φ2 = deg2rad(p2lat);
    const Δλ = deg2rad(p2lon - p1lon);

    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const θ = Math.atan2(y, x);

    const bearing = rad2deg(θ);

    return wrap360(bearing);
}
/**
 * Constrain degrees to range 0..360 (e.g. for bearings); -1 => 359, 361 => 1.
 *
 * @private
 * @param {number} degrees
 * @returns degrees within range 0..360.
 */
function wrap360(degrees) {
    if (0<=degrees && degrees<360) return degrees; // avoid rounding due to arithmetic ops if within range
    return (degrees%360+360) % 360; // sawtooth wave p:360, a:360
}

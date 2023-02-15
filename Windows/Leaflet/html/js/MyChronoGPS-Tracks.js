var currentmarker = '';
var circle = '';
var timer = '';
var retour_geolocation = false;

var lat;
var lng;
//var rayon = 100000;

// Rayon de la terre en mètres (sphère IAG-GRS80)
var RT = 6378137;

var Circuit = false;
var map = false;
var tab_marker=new Array();

var NewCircuit = false;

var icon_image_on="Icones/finish-rouge.png";
var icon_image_off="Icones/finish-bleu.png";

var icon_image=icon_image_off;
var zoom = 6; // zoom initial pour afficher la France dans la map
// le centre de la France !
latfr = 46.71488676953859;
lngfr = 2.6913890507936644;

var nbw = 0;

document.getElementById("zone-info").innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';

document.getElementById('map').style.display = 'block';
map = true;

loadCircuits();

function dataCircuitsReady() {
	go();
}	

// Initialize and add the map
function initMap(lat,lon) {
	map = L.map('map').setView([lat,lon],zoom);
	var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
	Esri_WorldImagery.addTo(map);	
	// Assumes your Leaflet map variable is 'map'..
	L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');
	
	map.on('mousemove', function(ev) {
		mouseMove(ev);
	});
	//
	map.on('contextmenu', function(ev) {
		copyClipboard(ev);
	});
	//
	map.on('click', function(ev) {
		if (!confirm("voulez-vous créer une piste à cet endroit ?"))
			return
		addTracks(ev);
	});

	markCircuit();
}

function go()
{
	initMap(latfr,lngfr);
}

function addTracks(mousePt) {
	mouseLatLng = mousePt.latlng;
	var mouseLat = mouseLatLng.lat;
	var mouseLon = mouseLatLng.lng;
	alert("un circuit va être créer à "+mouseLat+","+mouseLon);
	NewCircuit = new Object();
	NewCircuit.IdCircuit = 0;
	NewCircuit.NomCircuit = "Nouveau Circuit";
	NewCircuit.Latitude = mouseLat;
	NewCircuit.Longitude = mouseLon;
	NewCircuit.LongCircuit = 0;
	
	createMarker(NewCircuit,mouseLat,mouseLon);	
}

function markCircuit() {
	var listeHTML = '<div class="w3-container"><ul>';
	for (var i=0; i < Circuit.circuits.length; i++) {
		console.log('latitude:'+Circuit.circuits[i].Latitude+',longitude:'+Circuit.circuits[i].Longitude);
		var dist = distanceGPS(lat,lng,Circuit.circuits[i].Latitude,Circuit.circuits[i].Longitude);
		icon_image = icon_image_off;
		//if (dist > rayon)
		//	icon_image = icon_image_off;
		console.log(Circuit.circuits[i].NomCircuit+' est situé à '+dist);
		createMarker(Circuit.circuits[i]);
		// remplissage de la liste des circuits
		IdCircuit  = Circuit.circuits[i].IdCircuit;
		NomCircuit  = Circuit.circuits[i].NomCircuit;
		LongCircuit  = Circuit.circuits[i].Longueur;
		LogoCircuit  = Circuit.circuits[i].Logo;
		URLCircuit  = Circuit.circuits[i].URL;
		Adresse = Circuit.circuits[i].Adresse;
		CodePostal = Circuit.circuits[i].CodePostal;
		Ville = Circuit.circuits[i].Ville;
		LatitudeDestination = Circuit.circuits[i].Latitude;
		LongitudeDestination = Circuit.circuits[i].Longitude;
		LatitudeCenter = Circuit.circuits[i].Latcenter;
		LongitudeCenter = Circuit.circuits[i].Loncenter;
		ZoomCenter = Circuit.circuits[i].Zoom;
		TopSaison = Circuit.circuits[i].TopSaison;
		TopNom = Circuit.circuits[i].TopNom;
		TopPrenom = Circuit.circuits[i].TopPrenom;
		TopTime = Circuit.circuits[i].TopTime;
		LatFL = Circuit.circuits[i].LatFL;
		LonFL = Circuit.circuits[i].LonFL;
		LatInt1 = Circuit.circuits[i].LatInt1;
		LonInt1 = Circuit.circuits[i].LonInt1;
		LatInt2 = Circuit.circuits[i].LatInt2;
		LonInt2 = Circuit.circuits[i].LonInt2;
		LatInt3 = Circuit.circuits[i].LatInt3;
		LonInt3 = Circuit.circuits[i].LonInt3;

		//listeHTML += '<li><div class="w3-col l6 s6"><a'+
		listeHTML += '<div class="w3-col l6 s6"><a'+
						' href="#"'+
						' id="lien_circuit'+IdCircuit+'"' +
						' onmouseover="changeMarker(\''+IdCircuit+'\',1);" onmouseout="changeMarker(\''+IdCircuit+'\',0);"'+
						' onclick="showInfoMarker(\''+IdCircuit+'\');"'+
						'>'+NomCircuit+'</a></div>'+
						'<div class="w3-col l6 s6"><a href="MyChronoGPS-DesignTrack.html?id='+NomCircuit+'" class="w3-button w3-round">'+
						'<span class="btnedit-tracks"></span></a></div>'+
						//'</li>';
						'';
	}
	//listeHTML += '</ul></div>';
	listeHTML += '</div>';
	document.getElementById("liste_circuits").innerHTML = listeHTML;
}
function changeMarker(circuit,onoff)
{
	var img_icon;
	if (onoff == 0) {img_icon = icon_image_off;}
	else {img_icon = icon_image_on;}
	var marker = tab_marker[circuit]['marker'];
	var myIcon = L.icon({
		iconUrl: img_icon,
		iconSize: [38, 38],
		popupAnchor: [0, 0]
	});	
	var markerpoint = tab_marker[circuit]['point'];

	//L.marker([51.5, -0.09], {icon: greenIcon}).addTo(map);
	L.marker(markerpoint, {icon: myIcon}).addTo(map);
}
function showInfoMarker(circuit)
{
	
	var marker = tab_marker[circuit]['marker'];
	var point = tab_marker[circuit]['point'];
	var info = tab_marker[circuit]['info'];
	var myIcon = L.icon({
		iconUrl: icon_image_on,
		iconSize: [38, 38],
		popupAnchor: [0, 0]
	});	
	var popup = L.popup()
    .setLatLng(point)
    .setContent(info)
    .openOn(map);
	return;


	//tab_marker[circuit]['bulle'].open(map, marker);
	///*
	//marker.setOptions({
	//icon:img_icon
	//});
	//*/

	var marker = new L.Marker(point,{icon: myIcon, draggable:true}).bindPopup(info);
	map.addLayer(marker);	
 	
	//tab_marker[circuit.IdCircuit]=new Array();
	//tab_marker[circuit.IdCircuit]['marker']=marker;
	//tab_marker[circuit.IdCircuit]['point']=point;
	//tab_marker[circuit.IdCircuit]['info']=info;
}

function createMarker(circuit,newlat,newlon)
{
	var drag = false;
	if (newlat)
		drag = true;
	var clat = circuit.Latcenter*1;
	if (!clat)
		clat = circuit.Latitude;
	var clon = circuit.Loncenter*1;
	if (!clon)
		clon = circuit.Longitude;
	if (typeof(clat) == "undefined") {
		console.log(circuit);
		return;
	}
	//var point = new google.maps.LatLng(clat, clon);
	//
	//var marker = new google.maps.Marker({
    //  				position: point,
	//				title: circuit.NomCircuit,
    //  				map: map,
    //  				icon: icon_image,
	//				dragable: drag,
 	//				anchorPoint:new google.maps.Point(0, 0),
	//			  });
	//
	//var page='MyChronoGPS-DesignTrack.html';
	//var url = '';
	//if (circuit.NomCircuit != "Nouveau Circuit") {
	//	url = 'id='+circuit.NomCircuit;
	//}
	//else {
	//	console.log("on va demander l'affichage d'un nouveau circuit");
	//	url = 'latlng='+NewCircuit.Latitude+','+NewCircuit.Longitude;
	//}
	//
	//var info = 	'<div style="font: 1em \'trebuchet ms\',verdana, helvetica, sans-serif;">' +
	//			'	<table align="center">' +
	//			'		<tr>' +
	//			'			<td colspan="2" align="center">'+
	//			//'				<a href="#" onclick="showCircuit(\''+circuit.NomCircuit+'\');"><B>'+circuit.NomCircuit+'</B></a></td>' +
	//			'       		<a href="'+page+'?'+url+'">'+circuit.NomCircuit+'</a></td>' +
	//			'		</tr>' +
	//			'		<tr>' +
	//			'			<td colspan="2" align="center">'+circuit.LongCircuit+' m</td>' +
	//			'		</tr>' +
	//			'	</table>' +
	//			'</div>';
	var myIcon = L.icon({
		iconUrl: icon_image,
		iconSize: [38, 38],
		popupAnchor: [0, 0]
	});	
	var point = L.latLng(clat, clon);

	var page='MyChronoGPS-DesignTrack.html';
	var url = '';
	if (circuit.NomCircuit != "Nouveau Circuit") {
		url = 'id='+circuit.NomCircuit;
	}
	else {
		console.log("on va demander l'affichage d'un nouveau circuit");
		url = 'latlng='+NewCircuit.Latitude+','+NewCircuit.Longitude;
	}
	
	var info = 	'<div style="font: 1em \'trebuchet ms\',verdana, helvetica, sans-serif;">' +
				'	<table align="center">' +
				'		<tr>' +
				'			<td colspan="2" align="center">'+
				//'				<a href="#" onclick="showCircuit(\''+circuit.IdCircuit+'\');"><B>'+circuit.NomCircuit+'</B></a></td>' +
				'       		<a href="'+page+'?'+url+'">'+circuit.NomCircuit+'</a></td>' +
				'		</tr>' +
				'		<tr>' +
				'			<td colspan="2" align="center">'+circuit.LongCircuit+' m</td>' +
				'		</tr>' +
				'	</table>' +
				'</div>';

	var marker = new L.Marker(point,{icon: myIcon, draggable:true}).bindPopup(info);
	map.addLayer(marker);	
 	
	tab_marker[circuit.IdCircuit]=new Array();
	tab_marker[circuit.IdCircuit]['marker']=marker;
	tab_marker[circuit.IdCircuit]['point']=point;
	tab_marker[circuit.IdCircuit]['info']=info;
	
	//tab_marker[circuit.IdCircuit]['bulle'] = new google.maps.InfoWindow({
	//	content: info
	//});
	//
	//google.maps.event.addListener(marker, 'click', function() {
  	//    tab_marker[circuit.IdCircuit]['bulle'].open(map, marker);
	//});
}

function showCircuit(nomcircuit) {
	var page='MyChronoGPS-DesignTrack.html';
	var url = '';
	if (nomcircuit != "Nouveau Circuit") {
		url = 'id='+nomcircuit;
	}
	else {
		console.log("on va demander l'affichage d'un nouveau circuit");
		url = 'latlng='+NewCircuit.Latitude+','+NewCircuit.Longitude;
	}
	w = window.open (page+'?'+url,'popup', 'menubar=1, location=0, toolbar=1, directories=0, status=1, scrollbars=1, resizable=1, width=1055, height=700') ; 
	w.focus () ;    
}

function deg2rad(dg) {
	return dg/180*Math.PI;
}

function rad2deg(rd) {
	return rd*180/Math.PI;
}

function distanceGPS(lat1, lng1, lat2, lng2) {
	var latA = deg2rad(lat1);
	var lonA = deg2rad(lng1);
	var latB = deg2rad(lat2);
	var lonB = deg2rad(lng2);
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
	var S = D;
    return S*RT
}
	
function mouseMove(mousePt) {
	mouseLatLng = mousePt.latlng;
	//var mouseCoord = mouseLatLng.toUrlValue();
	var mouseLat = mouseLatLng.lat;
	var mouseLon = mouseLatLng.lng;
	
	var oStatusDiv = document.getElementById("mouseTrack")	
	if (oStatusDiv) {
		oStatusDiv.value  = mouseLat + ',' + mouseLon;
	}
	document.getElementById("zone-info").innerHTML = '';
}
	
function copyClipboard(mousePt) {
	mouseMove(mousePt);
	var z_extract = document.getElementById("mouseTrack")
	z_extract.select();
	if ( !document.execCommand( 'copy' ) ) {
		document.getElementById("zone-info").innerHTML = 'erreur de copie dans le presse papier';
		return false;
	}
	document.getElementById("zone-info").innerHTML = 'Les coordonnées du point sont copiés dans le presse papier';
	return true;
}

	
function showPoint() {
	// On recentre la map sur le point contenu dans l'input
	var el = document.getElementById("mouseTrack");
	//var coords = el.value;
	var LatLng = el.value.split(",");
	lat = LatLng[0];
	lon = LatLng[1];
	//var googleLatLng = new google.maps.LatLng(lat,lon); 
	//map.setCenter(googleLatLng);
	//map = L.map('map').setView([lat,lon]);
	map.setView([lat,lon],16);
	
	if (!confirm("voulez-vous créer une piste à cet endroit ?"))
		return
	console.log("un circuit va être créer à "+lat+","+lon);
	NewCircuit = new Object();
	NewCircuit.IdCircuit = 0;
	NewCircuit.NomCircuit = "Nouveau Circuit";
	NewCircuit.Latitude = lat;
	NewCircuit.Longitude = lon;
	NewCircuit.LongCircuit = 0;
	
	createMarker(NewCircuit,lat,lon);	
}
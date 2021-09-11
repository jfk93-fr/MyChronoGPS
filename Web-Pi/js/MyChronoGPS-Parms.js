var fname = 'ajax/get_parms.py';
var data_ready = false;
var Parms = false;
var fname_save = 'ajax/save_parms.php';
var dataPost = false; // Objet recueillant le formulaire à passer à la procédure ajax d'écriture de la piste

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var parms_timer = '';

function loadParms()
{
	loadParmsAjax(fname);
	isParmsReady();
}

function isParmsReady()
{
	if (!Parms) {
		parms_timer = setTimeout(isParmsReady, 300);
		return;
	}
	clearTimeout(parms_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataParmsReady();
}

function loadParmsAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(proc) {
        if (this.readyState == 4) {
			if (this.status == 200) {
				//alert("responseText:"+this.responseText);
				console.log(this.responseText);
				try {Parms = JSON.parse(this.responseText);}
				catch(e) {Parms = this.responseText;}
			}
			else 
			{
				var el = document.getElementById("zone-info");
				if (el)
					el.innerHTML = "fichier " + proc + " non trouv&eacute;";
			}
		}
    }
    //xmlhttp.open("GET", proc+"?nocache=" + Math.random(), true);
    xmlhttp.open("GET", proc, true);
    xmlhttp.send();
}

loadParms();

function dataParmsReady() {
	go();
}	

function go()
{
	var listeHTML = '';
	if (Parms.length > 0) {
		console.log(Parms[0]);
		Parms.params = Parms[0];
		for (variable in Parms.params) {
			console.log(variable);
			if (variable.substr(0,1) == "#") {
				listeHTML += '<li>'+variable.substr(1)+' '+Parms.params[variable]+'<br />';
			}
			else {
				listeHTML += '<input id="'+variable+'" name="'+variable+'" value="'+Parms.params[variable]+'"></li>';
			}
		}
	}
	document.getElementById("liste_params").innerHTML = listeHTML;
}

function copyParms() {
	var z_extract = document.getElementById("clipboard");
	z_extract.style.display = "block";
	// on copy tous les input et on crée le fichier JSON des paramètres
	createNewParms();
	
	var json = JSON.stringify(NewParms, null, '\t');
	console.log(json);
	//var arrayToString = JSON.stringify(Object.assign({}, NewParms));  // convert array to string
	//console.log(JSON.stringify(arrayToString));
    //var stringToJsonObject = JSON.parse(arrayToString);  // convert string to json object
	//
    //console.log(stringToJsonObject);

	//console.log(JSON.stringify(Object.assign({},NewParms)));
	//var z_extract = document.getElementById("clipboard")
	z_extract.value = json;
	z_extract.select();
	if ( !document.execCommand( 'copy' ) ) {
		document.getElementById("zone-info").innerHTML = 'erreur de copie dans le presse papier';
		return false;
	}
	document.getElementById("zone-info").innerHTML = 'Les données paramètres sont copiées dans le presse papier';
	z_extract.style.display = "none";
	
	saveParms();
}

function createNewParms() {
	NewParms = new Object();
	for (variable in Parms.params) {
		var el;
		el = document.getElementById(variable);
		if (el) {
			NewParms[variable] = el.value;
		}
		else {
			NewParms[variable] = Parms.params[variable];
		}
	}

	for (property in NewParms) {
		console.log(property+':'+NewParms[property]);
	}
}

function saveParms() {
	// on copy tous les input et on crée le fichier JSON de la piste
	createNewParms();
	var json = JSON.stringify(NewParms, null, '\t');

	dataPost = new FormData();
	dataPost.append("parms", json);

	console.log(JSON.stringify(dataPost));
	
	upLoadParmsAjax(fname_save);
	
	document.getElementById("zone-info").innerHTML = 'Les données du circuit sont en cours de sauvegarde';
}

function upLoadParmsAjax(proc) 
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


function addTracks(mousePt) {
	mouseLatLng = mousePt.latLng;
	var mouseCoord = mouseLatLng.toUrlValue();
	var mouseLat = mouseLatLng.lat();
	var mouseLon = mouseLatLng.lng();
	console.log("un circuit va être créer à "+mouseLat+","+mouseLon);
	NewCircuit = new Object();
	NewCircuit.IdCircuit = 0;
	NewCircuit.NomCircuit = "Nouveau Circuit";
	NewCircuit.Latitude = mouseLat;
	NewCircuit.Longitude = mouseLon;
	NewCircuit.LongCircuit = 0;
	
	createMarker(NewCircuit,mouseLat,mouseLon);	
}

function markCircuit() {
	var listeHTML = '';
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

		listeHTML += '<li><a'+
						' href="#"'+
						' id="lien_circuit'+IdCircuit+'"' +
						' onmouseover="changeMarker(\''+IdCircuit+'\',1);" onmouseout="changeMarker(\''+IdCircuit+'\',0);"'+
						' onclick="showInfoMarker(\''+IdCircuit+'\');"'+
						'>'+NomCircuit+'</a></li>';
	}
	document.getElementById("liste_circuits").innerHTML = listeHTML;
}
function changeMarker(circuit,onoff)
{
	var img_icon;
	if (onoff == 0) {img_icon = icon_image_off;}
	else {img_icon = icon_image_on;}
  var marker = tab_marker[circuit]['marker'];
	marker.setOptions({
		icon:img_icon
	});
}
function showInfoMarker(circuit)
{
  var marker = tab_marker[circuit]['marker'];
  tab_marker[circuit]['bulle'].open(map, marker);
  /*
	marker.setOptions({
		icon:img_icon
	});
  */
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
	var point = new google.maps.LatLng(clat, clon);

	var marker = new google.maps.Marker({
      				position: point,
					title: circuit.NomCircuit,
      				map: map,
      				icon: icon_image,
					dragable: drag,
 					anchorPoint:new google.maps.Point(0, 0),
				  });

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
				//'				<a href="#" onclick="showCircuit(\''+circuit.NomCircuit+'\');"><B>'+circuit.NomCircuit+'</B></a></td>' +
				'       		<a href="'+page+'?'+url+'">'+circuit.NomCircuit+'</a></td>' +
				'		</tr>' +
				'		<tr>' +
				'			<td colspan="2" align="center">'+circuit.LongCircuit+' m</td>' +
				'		</tr>' +
				'	</table>' +
				'</div>';
 	
	tab_marker[circuit.IdCircuit]=new Array();
	tab_marker[circuit.IdCircuit]['marker']=marker;
	tab_marker[circuit.IdCircuit]['point']=point;
	tab_marker[circuit.IdCircuit]['info']=info;
	
	tab_marker[circuit.IdCircuit]['bulle'] = new google.maps.InfoWindow({
		content: info
	});

	google.maps.event.addListener(marker, 'click', function() {
  	    tab_marker[circuit.IdCircuit]['bulle'].open(map, marker);
	});
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

//function go()
//{
//	// On vérifie que la méthode est implémentée dans le navigateur
//	if ( navigator.geolocation ) {
//		// On demande d'envoyer la position courante à la fonction callback
//		navigator.geolocation.getCurrentPosition( callback, erreur );
//	} else {
//		// Function alternative sinon
//		alternative();
//	}
//}

//function erreur( error ) {
//	retour_geolocation = true;
//	switch( error.code ) {
//		case error.PERMISSION_DENIED:
//			console.log( 'L\'utilisateur a refusé la demande' );
//			break;     
//		case error.POSITION_UNAVAILABLE:
//			console.log( 'Position indéterminée' );
//			break;
//		case error.TIMEOUT:
//			console.log( 'Réponse trop lente' );
//			break;
//	}
//	// Function alternative
//	//alternative();
//	alert('pas d\'alternative !');
//};
//
//function callback( position ) {
//	retour_geolocation = true;
//    lat = position.coords.latitude;
//    lng = position.coords.longitude;
//    //console.log( lat, lng );
//    // Do stuff
//}

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
	mouseLatLng = mousePt.latLng;
	var mouseCoord = mouseLatLng.toUrlValue();
	var mouseLat = mouseLatLng.lat();
	var mouseLon = mouseLatLng.lng();
	
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

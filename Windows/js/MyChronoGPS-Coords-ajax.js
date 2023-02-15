//var fonction_get = 'ajax/get_coords.php';
//var fonction_get = 'cgi-bin/get_coords.py';
var fonction_get = 'ajax/get_coords.py';
var parmAnalysis = urlvar["analysis"];
var Trames = new Array(); // Tableau des trames lues
var nb_trames = 0; // nombre de trames
var Trame = new Object(); // Objet contenant une trame
var nmeatime = 0;
var packettime = 0;
var NMEA = '';
var idsender = '';
var idtrame = '';
var gpscomplete = false;
var gpsfix    = '';
var gpslat    = 0;
var gpslatH   = '';
var gpslon    = 0;
var gpslonH   = '';
var gpsrmcgga = 0;
var gpsnbsat  = 0;
var gpsdop    = '';
var gpsalt    = 0;
var gpsaltU   = '';
var gpscorr   = '';
var gpscorrM  = '';
var gpscap    = 0;
const INVALID = 0;
const VALID = 1;
const NOEUD_KM = 1.852;
var lat0 = 0;
var lon0 = 0;
var no_tour = 0;

var Coords = false;
var nb_coords = 0; // nombre de coordonnées
var msgretproc = false;

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var coords_timer = '';

function loadCoords()
{
	var proc = fonction_get+"?nocache=" + Math.random()+"&analysis="+parmAnalysis
	loadCoordsAjax(proc);
	isCoordsReady();
}

function isCoordsReady()
{
	if (!Coords) {
		coords_timer = setTimeout(isCoordsReady, 300);
		return;
	}
	if (!map) {
		coords_timer = setTimeout(isCoordsReady, 100);
		return;
	}
	clearTimeout(coords_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataCoordsReady();
}

function loadCoordsAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				//alert("responseText:"+this.responseText);
				console.log(this.responseText);
				try {Coords = JSON.parse(this.responseText);
					nb_coords = Coords.length;
				}
				catch(e) {Coords = this.responseText;
				}
			}
			else 
			{
				var el = document.getElementById("zone-info");
				if (el)
					el.innerHTML = "URL " + proc + " non trouv&eacute;e";
			}
		}
    }
    //xmlhttp.open("GET", proc+"?nocache=" + Math.random(), true);
    xmlhttp.open("GET", proc, true);
    xmlhttp.send();
}

/*
				Coords = FileContent;
				nb_coords = Coords.length;
*/
//function is_file_ready()
//{
//	if (nb_coords == 0) {
//		coords_timer = setTimeout(is_file_ready, 1000);
//	}
//	else {
//		clearTimeout(coords_timer);
//		var fileInput = document.getElementById('fileInput');
//		var fileDisplayArea = document.getElementById('fileDisplayArea');
//		fileDisplayArea.innerText = "File is loaded!";
//
//		fileInput.removeEventListener('change', read_file);
//		copyCoords();
//		dataCoordsReady();
//	}
//}
//
//function load_file() {
//		nb_coords = 0;	
//	
//		var fileInput = document.getElementById('fileInput');
//		var fileDisplayArea = document.getElementById('fileDisplayArea');
//		fileInput.addEventListener('change', read_file);
//}
//
//function read_file(e) {
//	fileDisplayArea.innerText = 'please wait';
//		var file = fileInput.files[0];
//		var reader = new FileReader();
//		reader.onload = function(e) {
//			chaine = reader.result;
//			var reg = new RegExp("\r", "g" );
//			var newstr = chaine.replace(reg,'');
//			FileContent=newstr.split('\n');
//			var i = FileContent.length-1;
//			if (FileContent[i] == "")
//				FileContent.pop();
//
//			console.log(JSON.stringify(file));
//			//alert('name:'+file.name);
//			var ext = file.name.split('.');
//			var ie = ext.length-1;
//			if (ie < 0) {
//				alert ('extension du fichier non traitée');
//				return;
//			}
//			if (ext[ie] == 'nmea') {
//				fileDisplayArea.innerText = "NMEA File is being converted !";
//				Trames = FileContent;
//				convertNMEA();
//			}
//			else {
//				Coords = FileContent;
//				nb_coords = Coords.length;
//			}
//		}
//		reader.readAsText(file);	
//}

function convertNMEA() {
	Coords = new Array();
	gpsfix = VALID;
	for (var it=0; it < Trames.length; it++) {
		var gpsline = Trames[it];
		parse_nmea(gpsline);
	}
	nb_coords = Coords.length;
	console.log("Coords:"+Coords.length);
}

function parse_nmea(sentence) {
    NMEA = sentence.split(",");
	// le premier élément commence par $, suivi de 2 caractères identifiant l'émetteur de la trame, suivi de 3 caractères identifiant la trame
	if (NMEA[0].substr(0,1) != '$') {
		console.log("no talker indicator ("+NMEA[0].substr(0,1)+")");
		return;
	}
	idsender = NMEA[0].substr(1,2);
	console.log("sender:"+idsender);
	idtrame = NMEA[0].substr(3,3);
	console.log("idtrame:"+idtrame);
	
	getTimeNmea(); // on va rechercher un temps dans la trame
        
	// on regarde si le temps à changer par rapport au temps du paquet
	console.log("times nmea/packet:"+nmeatime+"/"+packettime);
	if (nmeatime > 0) { //est-ce que la trame en cours possède 1 temps
		if (packettime > 0) { // est-ce qu'il y a un temps associé au paquet
			if (nmeatime != packettime) {
				createPacket();
			}
			else {
				gpscomplete = false;
			}
		}
		else { // le paquet n'avait pas de temps
			packettime = nmeatime; // maintenant il en a un
		}
	}
	if (idtrame == "GGA") {
		if (NMEA.length < 12) {
			console.log("invalid GGA:"+sentence)
			gpsfix = INVALID
		}
		else {
			gpslat  = NMEA[2];
			gpslatH = NMEA[3];
			gpslon  = NMEA[4];
			gpslonH = NMEA[5];
			if (NMEA[6] == "1" || NMEA[6] == "2") {
				gpsfix = gpsfix & VALID
				gpsrmcgga = gpsrmcgga + 1;
			}
			else {
				gpsfix = INVALID;
			}
			gpsnbsat = NMEA[7];
			gpsdop = NMEA[8];
			gpsalt = NMEA[9] * 1;
			gpsaltU = NMEA[10];
			gpscorr = NMEA[11];
			gpscorrM = NMEA[12]; 
		}
	}
	
	if (idtrame == "RMC") {
		if (NMEA.length < 9) {
			console.log("invalid RMC:"+sentence)
			gpsfix = INVALID;
		}
		else {
			if (NMEA[2] == "A") {
				gpsfix = gpsfix & VALID;
				gpsrmcgga = gpsrmcgga + 1;
			}
			else {
				gpsfix = INVALID;
			}
			gpslat  = NMEA[3];
			gpslatH = NMEA[4];
			gpslon  = NMEA[5];
			gpslonH = NMEA[6];
			gpsvitesse = 0.
			if (NMEA[7] != "") {
				gpsvitesse = NMEA[7] * NOEUD_KM;
			}
			gpscap = 0;
			if (NMEA[8] != "") { 
				gpscap = NMEA[8] * 1;
			}
			gpsdate = NMEA[9];
		}
	}
	
}
function getTimeNmea() {
	nmeatime = 0
	if (idtrame == "GGA" || idtrame == "RMC" || idtrame == "ZDA" || idtrame == "GNS"
	|| idtrame == "GRS" || idtrame == "GST" || idtrame == "GXA" || idtrame == "TRF"
	|| idtrame == "ZFO" || idtrame == "ZTG") { 
		nmeatime = NMEA[1];
		return;
	}
	if (idtrame == "GLL") { 
		nmeatime = NMEA[5];
		return;
	}
	if (idtrame == "RLM") { 
		nmeatime = NMEA[5];
		return;
	}
	if (idtrame == "TLL") { 
		nmeatime = NMEA[7];
		return;
	}
	if (idtrame == "TLM") {
		nmeatime = NMEA[14];
		return;
	}
	if (idtrame == "PUBX") {
		if (NMEA[1] == "00" || NMEA[1] == "01" || NMEA[1] == "04")
			nmeatime = NMEA[2];
		return;
	}
	return;
}
            
function createPacket() {
	console.log("gpsrmcgga:"+gpsrmcgga);
	if (gpsrmcgga < 2) { // les données ne sont pas complètes, on ne crée pas le paquet
		gpsrmcgga = 0;
		packettime = nmeatime;
		return;
	}
	gpstime = packettime;
	// on va calculer l'heure et la date locale
	console.log("["+nmeatime+"/"+packettime+"]")
	JJ = gpsdate.substr(0,2);
	MM = gpsdate.substr(2,2);
	AA = "20"+gpsdate.substr(4,2);
	hh = gpstime.substr(0,2);
	mm = gpstime.substr(2,2);
	ss = gpstime.substr(4,2);
		
	latitude = degrees_to_decimal(gpslat,gpslatH)
	longitude = degrees_to_decimal(gpslon,gpslonH)
	
	// on envoie le paquet
	nmea_send()

	gpscomplete = true;
	gpsrmcgga = 0;
	
	packettime = nmeatime;
}

function degrees_to_decimal(coord, hemisphere) {
	//$GPRMC,083000.00,A,4814.49972,N,00400.01847,E,69.161,124.02,240620,,,A*5D
	//			Trames=newstr.split('\n');

	var degmin = coord.split('.');
	var degrees = degmin[0].substr(0,degmin[0].length-2);
	var minutes = degmin[0].substr(degmin[0].length-2);
	minutes += "."+degmin[1];
	//console.log("degrees minutes:"+degrees+" "+minutes);
	degrees = degrees*1
	minutes = minutes/60

    var output = degrees + minutes
    if (hemisphere == 'N' || hemisphere == 'E')
        return output;
    if (hemisphere == 'S' || hemisphere == 'W')
        return -output;

}
        
function nmea_send() {
	var Coord = new Object()
	if (Coords.length == 0) {
		var trackfound = scanCircuit();
		if (!trackfound) {
			fileDisplayArea.innerText = "track not found !";
			return;
		}
		initCircuit(trackfound); // on complète les informations du circuit avec les données lues dans la base
		Coord.NomCircuit = thisCircuit.NomCircuit;
		if (thisCircuit.FL)
			Coord.FL = thisCircuit.FL;
		if (thisCircuit.PitIn)
			Coord.PitIn = thisCircuit.PitIn;
		if (thisCircuit.PitOut)
			Coord.PitOut = thisCircuit.PitOut;
		if (thisCircuit.Int1)
			Coord.Int1 = thisCircuit.Int1;
		if (thisCircuit.Int2)
			Coord.Int2 = thisCircuit.Int2;
		if (thisCircuit.Int3)
			Coord.Int3 = thisCircuit.Int3;
		Coord.date = gpsdate;
		console.log(JSON.stringify(Coord));
		Coords.push(new Array(Coord));
		
		Coord = new Object()
		no_tour = 0;
	}
	var it = Coords.length - 1;
	if (lat0) {
		var linecoord = new Array(thisCircuit.FL[0]*1,thisCircuit.FL[1]*1,thisCircuit.FL[2]*1,thisCircuit.FL[3]*1);
		var segcoords = new Array(lat0,lon0,latitude*1,longitude*1);
		var linecut = isLineCut(linecoord,segcoords);
		if (linecut) {
			no_tour++;
		}
		Coord.tour = no_tour;
	}
	if (Coord.tour > 0) {
		Coord.timestamp = packettime;
		Coord.pointgps = new Array(lat0,lon0);
		Coord.vitesse = gpsvitesse;
		Coord.altitude = gpsalt;
		Coord.cap = gpscap;
		//Coords.push(Coord);
		Coords.push(new Array(Coord));
	}
	lat0 = latitude*1;
	lon0 = longitude*1;
}

function copyCoords() {
	var json = "";
	for (var ic=0; ic < Coords.length; ic++) {
		json += JSON.stringify(Coords[ic])+'\r\n';
	}

	writeToClipboard(json);
	return;
}

async function writeToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error(error);
    alert(error);
  }
}

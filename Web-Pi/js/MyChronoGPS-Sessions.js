var fname = 'ajax/get_sessions.py';
var data_ready = false;
var Sessions = false;

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var sessions_timer = '';

function loadSessions()
{
	var chaine = getSessions(fname);
	isSessionsReady();
	//console.log(chaine);
}

function getSessions(proc) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {Sessions = JSON.parse(this.responseText);}
			catch(e) {Sessions = this.responseText;}
        }
    }
    xmlhttp.open("GET", proc, true);
    xmlhttp.send();
}

function isSessionsReady()
{
	if (!Sessions) {
		sessions_timer = setTimeout(isSessionsReady, 300);
		return;
	}
	clearTimeout(sessions_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';
	dataSessionsReady();
}

loadSessions();

function dataSessionsReady()
{
	var string2display = JSON.stringify(Sessions);
	if (Array.isArray(Sessions)) {
		afficheListeSessions();
	}
	else {
		alert('ko');
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = Sessions;
	}
}
function afficheListeSessions()
{
	var el = document.getElementById("tabsessions");
	var href = "MyChronoGPS-Analysis.html?analysis=analysis-";
	var href2 = "MyChronoGPS-DesignTrack.html?";
	if (!el) {
		alert('tabsessions not found in document');
		return;
	}
	var HTML = "";
	HTML += '<tr>';
	HTML += '	<th>Date</th>';
	HTML += '	<th>Heure</th>';
	HTML += '	<th>Circuit</th>';
	HTML += '	<th></th>';
	HTML += '</tr>';
	
	for (var i=0; i < Sessions.length; i++) {
		var session = Sessions[i];
		var session_file = session.filetime+'.json'; // Nom du fichier de session
		var session_infos = session.infos;
		var Tinfos = session_infos.split(";");
		var NomCircuit = Tinfos[2];
		var Lat1 = Tinfos[3];
		var Lng1 = Tinfos[4];
		var Lat2 = Tinfos[5];
		var Lng2 = Tinfos[6];
		
		HTML += '<tr>';

		HTML += '<td>';
		HTML += '<a ';
		HTML += 'href="'+href+session_file+'">';
		HTML += session.date_session;
		HTML += '</a>';
		HTML += '</td>';

		HTML += '<td>';
		HTML += '<a ';
		HTML += 'href="'+href+session_file+'">';
		HTML += session.heure_session;
		HTML += '</a>';
		HTML += '</td>';

		HTML += '<td>';
		HTML += '<a ';
		HTML += 'href="'+href2;
		if (NomCircuit != "") {
			HTML += 'id='+NomCircuit+'"';
			HTML += '>'+NomCircuit;
		}
		else {
			HTML += "FL=["+Lat1+","+Lng1+","+Lat2+","+Lng2+"]\"";
		}
		HTML += '</a>';
		HTML += '</td>';

		HTML += '<td class=""LCD35-hide">';
		HTML += '<a class="LCD35-hide"';
		var urlFichier = 'ajax/download.py?file='+session.filetime;
		HTML += 'href="'+urlFichier+'&uniq=12" target = "_blank" >';
		HTML += "Télécharger";
		HTML += '</a>';
		HTML += '</td>';
		
		HTML += '</td>';
	}
	el.innerHTML = HTML;
}

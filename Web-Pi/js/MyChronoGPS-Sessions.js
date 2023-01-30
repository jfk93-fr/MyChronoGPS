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
	console.log(chaine);
}

function getSessions(proc) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
		    //alert("responseText:"+this.responseText);
			console.log(this.responseText);
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
	console.log(string2display);
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
		
		var etr = document.createElement('tr');

		var etd = document.createElement('td');
		var ancre = document.createElement('a');
		ancre.href=href+session_file;
		ancre.innerText = session.date_session;
		etd.appendChild(ancre);
		etr.appendChild(etd);

		var etd = document.createElement('td');
		var ancre = document.createElement('a');
		ancre.href=href+session_file;
		ancre.innerText = session.heure_session;
		etd.appendChild(ancre);
		etr.appendChild(etd);

		var etd = document.createElement('td');
		var ancre = document.createElement('a');
		ancre.href=href2;
		if (NomCircuit != "") {
			ancre.href += "id="+NomCircuit;
			ancre.innerText = NomCircuit;
		}
		else {
			ancre.href += "FL=["+Lat1+","+Lng1+","+Lat2+","+Lng2+"]";
			ancre.innerText = "circuit non référencé";
		}
		etd.appendChild(ancre);
		etr.appendChild(etd);

		var etd = document.createElement('td');
		var ancre = document.createElement('a');
		ancre.href = 'ajax/download.py?file='+session.filetime;
		ancre.innerText = "Télécharger";
		ancre.target = "_blank";
		etd.appendChild(ancre);
		etr.appendChild(etd);
		
		el.appendChild(etr);
	}
}

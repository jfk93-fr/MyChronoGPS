function isDocInFullscreen() {
  if (document.fullscreenElement) {
    return true;
  }
  return false;
}
var fullscreen = isDocInFullscreen();


var timer = '';
var Status = false;
var fonction_getGeneral = 'ajax/get_status.py';
var tempcpu = ""
var processShowed = false; 
var processDisk = false;
document.getElementById("process").style.display = "none";
document.getElementById("disks").style.display = "none";

// Début du programme
loadStatus(fonction_getGeneral);

function loadStatus(func)
{
	var proc = func+"?nocache=" + Math.random()
	loadAjax(proc);
	isAjaxReady();
}

function isAjaxReady()
{
	if (!Status) {
		timer = setTimeout(isAjaxReady, 100);
		return;
	}
	clearTimeout(timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataStatusReady();
}

function loadAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				try {
						Status = JSON.parse(this.responseText);
					}
				catch(e) {Status = this.responseText;}
			}
			else 
			{
				var el = document.getElementById("zone-info");
				if (el)
					el.innerHTML = "URL " + proc + " non trouv&eacute;e";
			}
		}
    }
    xmlhttp.open("GET", proc+"?nocache=" + Math.random(), true);
    xmlhttp.send();
}

function dataStatusReady() {
	if (timer) {
		clearTimeout(timer);
	}

	if (!Array.isArray(Status)) {
		// on n'a pas réussi à charger les données
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = 'problème détecté';
		return false;
	}

	Ev = eval(Status[0]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les données
		document.getElementById("loading").style.display = 'block';
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = retour.msgerr;
		// tout recommencer dans quelques secondes
		timer = setTimeout(getNextPoint, 3000);	
		return false;
	}

	thisStatus = Ev;
	document.getElementById("adresseip").innerHTML = thisStatus.adresseip;
	document.getElementById("hostname").innerHTML = thisStatus.hostname;
	document.getElementById("cputemp").innerHTML = thisStatus.cputemp;
	var el = document.getElementById("process");
	var HTML = '<table class="status-table"><tr>';
	for (var i=0; i < thisStatus.pheader.length; i++) {
		HTML += "<th>"+thisStatus.pheader[i]+"</th>";
	}
	HTML += "</tr>";
	for (var i=0; i < thisStatus.myprocess.length; i++) {
		HTML += "<tr>";
		var buf = thisStatus.myprocess[i];
		for (var j=0; j < thisStatus.pheader.length-1; j++) {
			var ip = buf.indexOf(' ');
			var zd = buf.substr(0,ip)
			HTML += "<td>"+zd+"</td>";
			buf = buf.substr(ip).trim();
		}
		HTML += "<td>"+thisStatus.myprocess[i].substr(48)+"</td>"; // la commande complète est située à l'offset 48
		HTML += "</tr>";
	}
	HTML += "</table>";
	el.innerHTML = HTML;

	var el = document.getElementById("disks");
	var HTML = '<table class="status-table"><tr>';
	HTML += "<th>"+thisStatus.disk[0].substr(0,10)+"</th>"; // Filesystem
	HTML += "<th>"+thisStatus.disk[0].substr(16,4)+"</th>"; // Size
	HTML += "<th>"+thisStatus.disk[0].substr(22,4)+"</th>"; // Used
	HTML += "<th>"+thisStatus.disk[0].substr(27,5)+"</th>"; // Avail
	HTML += "<th>"+thisStatus.disk[0].substr(33,4)+"</th>"; // Use%
	HTML += "<th>"+thisStatus.disk[0].substr(38).trim()+"</th>"; // Mounted on
	HTML += "</tr>";
	var ip;
	var zd;
	var buf;
	for (var i=1; i < thisStatus.disk.length; i++) {
		HTML += "<tr>";
		buf = thisStatus.disk[i];
		for (var j=0; j < 6; j++) {
			ip = buf.indexOf(' ');
			if (ip < 0) {zd = buf;}
			else {zd = buf.substr(0,ip);}
			HTML += "<td>"+zd+"</td>";
			buf = buf.substr(ip).trim();
		}
		HTML += "</tr>";
	}
	HTML += "</table>";
	el.innerHTML = HTML;
}

function displayProcess() {
	var el = document.getElementById("process");
	if (processShowed == true) {
		processShowed = false;
		el.style.display = "none";
		document.getElementById("show-process").innerHTML = 'Show Process';
		el = document.getElementById("btnprocess");
		el.className = "btnprocess";
	}
	else {
		processShowed = true;
		el.style.display = "block";
		document.getElementById("show-process").innerHTML = 'X';
		el = document.getElementById("btnprocess");
		el.className = "btnprocess-off";
	}
}

function displayDisks() {
	var el = document.getElementById("disks");
	if (processShowed == true) {
		processShowed = false;
		el.style.display = "none";
		document.getElementById("show-disks").innerHTML = 'Show Disks';
		el = document.getElementById("btndisks");
		el.className = "btndisks";
	}
	else {
		processShowed = true;
		el.style.display = "block";
		document.getElementById("show-disks").innerHTML = 'X';
		el = document.getElementById("btndisks");
		el.className = "btndisks-off";
	}
}

var fonction_get = 'ajax/get_live.py';

var Live = false;
var nb_coords = 0; // nombre de coordonnées
var msgretproc = false;

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var live_timer = '';

function loadLiveCoords()
{
	var proc = fonction_get+"?nocache=" + Math.random()
	loadLiveAjax(proc);
	isLiveReady();
}

function isLiveReady()
{
	if (!Live) {
		live_timer = setTimeout(isLiveReady, 300);
		return;
	}
	if (!map) {
		live_timer = setTimeout(isLiveReady, 100);
		return;
	}
	clearTimeout(live_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataLiveReady();
}

function loadLiveAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				try {Live = JSON.parse(this.responseText);
					nb_coords = Live.length;
				}
				catch(e) {Live = this.responseText;
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
    xmlhttp.open("GET", proc, true);
    xmlhttp.send();
}

var fname = 'ajax/get_parms.py';
var data_ready = false;
var Parms = false;

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
    xmlhttp.open("GET", proc, true);
    xmlhttp.send();
}

loadParms();

function dataParmsReady() {
	var myKey = Parms[0].GoogleMapsAPIKey;
	data_ready = true;
	var mapl = document.getElementById("maploader");
	if (myKey) {
		var newScript = document.createElement("script");
		var newContent = document.createTextNode("src=\"https://maps.googleapis.com/maps/api/js?key=' + myKey + '&libraries=geometry&callback=initGooglemap\"");
		newScript.appendChild(newContent);
		var currentDiv = document.getElementById('maploader');
		document.body.insertBefore(newScript, currentDiv);

	}
}
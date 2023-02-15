var fname = 'ajax/get_circuits.py';
//var fname = 'cgi-bin/get_circuits.py';
var data_ready = false;
var Circuit = false;

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var circuits_timer = '';

function loadCircuits()
{
	loadCircuitsAjax(fname);
	isCircuitsReady();
}

function isCircuitsReady()
{
	if (!Circuit) {
		circuits_timer = setTimeout(isCircuitsReady, 300);
		return;
	}
	if (!map) {
		circuits_timer = setTimeout(isCircuitsReady, 100);
		return;
	}
	clearTimeout(circuits_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataCircuitsReady();
}

function loadCircuitsAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(proc) {
        if (this.readyState == 4) {
			if (this.status == 200) {
				//alert("responseText:"+this.responseText);
				console.log(this.responseText);
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
    //xmlhttp.open("GET", proc+"?nocache=" + Math.random(), true);
    xmlhttp.open("GET", proc, true);
    xmlhttp.send();
}

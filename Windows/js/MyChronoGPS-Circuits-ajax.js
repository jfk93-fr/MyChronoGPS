var fname = 'circuits.json';
var data_ready = false;
var Circuit = false;

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var circuits_timer = '';

function loadCircuits()
{
	loadCircuitsJSON(fname);
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

function loadCircuitsJSON(fname) 
{
	var xhr=createXHR();

  xhr.open("GET", fname+"?nocache=" + Math.random(),true);
	xhr.onreadystatechange=function() { ajax_xhr(xhr); };
	xhr.send(null);
}

function ajax_xhr(xhr)
{
	if (xhr.readyState == 4) 
	{
		if (xhr.status == 200) 
		{
			if (xhr.responseText.substr(0,1) != '{') {
			  alert(xhr.responseText);
			}
			Circuit=eval("(" + xhr.responseText + ")");
		} 
		else 
		{
			var el = document.getElementById("zone-info");
			if (el)
				el.innerHTML = "fichier JSON " + fname + " non trouv&eacute;";
		}
	}
}

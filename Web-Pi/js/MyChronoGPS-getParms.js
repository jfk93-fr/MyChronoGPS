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
	console.log(JSON.stringify(Parms));
	var myKey = Parms[0].GoogleMapsAPIKey;
	console.log(myKey);
	data_ready = true;
	var mapl = document.getElementById("maploader");
	if (myKey) {
		var newScript = document.createElement("script");
		var newContent = document.createTextNode("src=\"https://maps.googleapis.com/maps/api/js?key=' + myKey + '&libraries=geometry&callback=initGooglemap\"");
		//mapl.innerHTML = '<script async defer src="https://maps.googleapis.com/maps/api/js?key=' + myKey + '&libraries=geometry&callback=initGooglemap"></script>';
		//var scriptTag = '<' + 'script async defer src="https://maps.googleapis.com/maps/api/js?key=' + myKey + '&libraries=geometry&callback=initGooglemap">'+'<'+'/script>';
		//document.write(scriptTag);
		newScript.appendChild(newContent);
		var currentDiv = document.getElementById('maploader');
		document.body.insertBefore(newScript, currentDiv);

	}
	//go();
}	

//function go()
//{
//	var listeHTML = '';
//	if (Parms.length > 0) {
//		console.log(Parms[0]);
//		Parms.params = Parms[0];
//		for (variable in Parms.params) {
//			console.log(variable);
//			if (variable.substr(0,1) == "#") {
//				listeHTML += '<li>'+variable.substr(1)+' '+Parms.params[variable]+'<br />';
//			}
//			else {
//				listeHTML += '<input id="'+variable+'" name="'+variable+'" value="'+Parms.params[variable]+'"></li>';
//			}
//		}
//	}
//	document.getElementById("liste_params").innerHTML = listeHTML;
//}

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
	/*
		<div class="w3-responsive">
			<table id="tabsessions"class="w3-table-all">
				<tr>
					<th>Date</th>
					<th>Heure</th>
					<th>Circuit</th>
					<th></th>
				</tr>
			</table>
		</div>
	*/
	var listeHTML = '<div class="w3-responsive"><table id="tabsessions"class="w3-table-all">';
	if (Parms.length > 0) {
		console.log(Parms[0]);
		Parms.params = Parms[0];
		for (variable in Parms.params) {
			console.log(variable);
			if (variable.substr(0,1) == "#") {
				listeHTML += '<tr><td>'+variable.substr(1)+' '+Parms.params[variable]+'<br />';
			}
			else {
				listeHTML += '<input id="'+variable+'" name="'+variable+'" value="'+Parms.params[variable]+'"></td></tr>';
			}
		}
		listeHTML += '</table></div>';
	}
	/*
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
	*/
	document.getElementById("liste_params").innerHTML = listeHTML;
}

function copyParms() {
	var z_extract = document.getElementById("clipboard");
	z_extract.style.display = "block";
	// on copy tous les input et on crée le fichier JSON des paramètres
	createNewParms();
	
	var json = JSON.stringify(NewParms, null, '\t');
	//console.log(json);
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
	
	document.getElementById("zone-info").innerHTML = 'Les données paramètre sont en cours de sauvegarde';
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
						el.innerHTML = "fichier paramètre sauvegard&eacute;";
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

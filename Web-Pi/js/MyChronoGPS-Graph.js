//var ctx = document.getElementById('graph').getContext('2d');
var is_graph = false;
var is_chart_loaded = false;
var tabGraph = new Array();
var lapGraph = new Array();
var chart = false;
var graphmarker = false;
var tmpmark1 = false;
var tmpmark2 = false;
var tmpmark3 = false;
var tmpmark4 = false;
var tmpmark5 = false;
var tmpmark6 = false;
var datag = false;

google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart () {
	// on indique juste que la librairie est chargée et prête, pour l'instant on n'affiche pas de graphe
	is_chart_loaded = true;
}

function switchGraph() {
	if (is_graph) {
		// On arrête l'affichage du graphique
		graphRelease();
		resizeMap();
		is_graph = false;
		return;
	}
	var el = document.getElementById("info-graph");
	if (el) {
		el.style.display = "block";
		el.innerHTML = "graph is loading";
	}
	var el = document.getElementById("container-graph");
	if (el)
		el.style.display = "block";

	is_graph = true;		
	resizeMap();
	datag = new google.visualization.DataTable();
	datag.addColumn('number', 'X');
	
	var maxrows = 0;
	var maxcols = tabShow.length;
	// Boucle de construction des graphiques des tours sélectionnés
	for (var i=0; i < maxcols; i++) {
		console.log(tabShow);
		var il = tabShow[i]-1;
		//drawChartLap(il);
		datag.addColumn('number', 'T'+(il+1)); 
		if (Tours[il].geocoords.length > maxrows) {
			maxrows = Tours[il].geocoords.length;
		}
	}
	console.log(maxrows);
	// préparation du tableau graphe
	var tabGraph = new Array();
	for (var i=0; i < maxrows; i++) {
		var tabCols = new Array();
		for (var j=0; j < maxcols; j++) {
			tabCols.push(0);
		}
		tabGraph.push(tabCols);
	}

	datag.addRows(maxrows); 

	// remplissage du tableau graphe avec les données du tour
	for (var j=0; j < maxcols; j++) {
		var il = tabShow[j]-1;
		drawChartLap(il);
		for (var i=0; i < lapGraph.length; i++) {
			tabGraph[i][j] = lapGraph[i];
		}
	}
	console.log(JSON.stringify(tabGraph));

	for (var i=0; i < maxrows; i++) {
		datag.setCell(i,0,i);
		for (j=0; j < maxcols; j++) {
			var speed = 0;
			if (tabGraph[i][j].speed)
				speed = tabGraph[i][j].speed;
			datag.setCell(i,j+1,speed);
		}
	}

	var options = {
		hAxis: {
			title: 'Echantillon'
		},
		vAxis: {
			title: 'km/h'
		},
		colors: ['#a52714', '#097138'],
		crosshair: {
			color: '#000',
			trigger: 'selection'
		}
	};
	chart = new google.visualization.LineChart(document.getElementById('graph'));
	chart.draw(datag, options);

	google.visualization.events.addListener(chart, 'select', function() {
		var lieu = chart.getSelection();
		if (lieu.length > 0) {
			var x = lieu[0].row;
			var y = lieu[0].column-1;
			var lap = tabShow[y];
			var point2mark = tabGraph[x][y];
			console.log(JSON.stringify(point2mark));
			var cap = point2mark.cap;
		
			if (graphmarker != '') {
				graphmarker.setMap(null);
				graphmarker = '';
			}
			var markerpoint = {lat: point2mark.lat, lng: point2mark.lon};
			console.log(markerpoint);
			graphmarker = new google.maps.Marker({
				position: markerpoint, 
				title: 'T:\t'+lap+'\r\n'+
					'v:\t'+Math.round(point2mark.speed)+'km/h\r\n'+
					'accel:\t'+Math.round(point2mark.accel*100)/100+'g\r\n'+
					'alt:\t'+Math.round(point2mark.altitude)+'m\r\n'+
					'cap:\t'+Math.round(point2mark.cap*10)/10+'° '
				,icon: {
					path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
					rotation: cap,
					fillColor: "cyan",
					fillOpacity: 0.8,
					scale: 5,
					strokeColor: "gold",
					strokeWeight: 2,
					}
				});
			graphmarker.setMap(map);
			setCenter(point2mark.lat, point2mark.lon);
		}
		return;
	});
	var el = document.getElementById("info-graph");
	if (el) {
		el.innerHTML = "";
	}

	return;
}
	
function drawChartLap(il) {
	// Ici, on va construire le tableau du tour en cours 
	//
	lapGraph = new Array();
	var distlap = 0;
	ograph = new Object();
	ograph.dist = distlap; // X axis
	ograph.speed = Tours[il].points[0].vitesse; // Y axis
	ograph.altitude = Tours[il].points[0].altitude;
	ograph.cap = Tours[il].points[0].cap;
	ograph.lat = Tours[il].geocoords[0].lat();
	ograph.lon = Tours[il].geocoords[0].lng();
	lapGraph.push(ograph);
	for (var ip=1; ip < Tours[il].geocoords.length; ip++) {
		var geodist = new Array();
		geodist.push(Tours[il].geocoords[ip-1]);
		geodist.push(Tours[il].geocoords[ip]);
		var dist =	google.maps.geometry.spherical.computeLength(geodist);
		distlap += dist;
		ograph = new Object();
		ograph.dist = distlap; // X axis
		ograph.speed = Tours[il].points[ip].vitesse; // Y axis
		ograph.altitude = Tours[il].points[ip].altitude;
		ograph.cap = Tours[il].points[ip].cap;
		ograph.lat = Tours[il].geocoords[ip].lat();
		ograph.lon = Tours[il].geocoords[ip].lng();
		// calcul de l'accélération
		var accel = (((Tours[il].points[ip].vitesse - Tours[il].points[ip-1].vitesse)) * Frequence) / gkmh;
		ograph.accel = accel;
		
		lapGraph.push(ograph);
	}
	console.log('longueur Graph'+lapGraph.length);
}

function graphRelease() {
	is_graph = false;

	if (graphmarker != '') {
		graphmarker.setMap(null);
		graphmarker = '';
	}
	//var el = document.getElementById("sousmenu-simu");
	//if (el)
	//	el.style.display = "none";
	var el = document.getElementById("sousmenu-map");
	if (el)
		el.style.display = "block";
	var el = document.getElementById("container-graph");
	if (el)
		el.style.display = "none";
	var el = document.getElementById("info-graph");
	if (el)
		el.style.display = "none";
}

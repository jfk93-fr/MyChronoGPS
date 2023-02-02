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
var options = false;
var lieu;

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
		//if (window.innerWidth <= 500) {
		//	document.getElementById("menu-graph-35").style.display = "none";
		//}		
		//else {
			//document.getElementById("menu-graph").style.display = "none";
		//}		
		return;
	}
	//document.getElementById("menu-graph").style.display = "none";
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
	tabGraph = new Array();
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

		options = {
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
		lieu = chart.getSelection();
		if (lieu.length > 0) {
			var x = lieu[0].row;
			var y = lieu[0].column-1;
			//var lap = tabShow[y];
			//var point2mark = tabGraph[x][y];
			//console.log(JSON.stringify(point2mark));
			
			//setMarkerpoint(lap,point2mark);
			setMarkerpoint(x,y);
			//if (graphmarker != '') {
			//	graphmarker.setMap(null);
			//	graphmarker = '';
			//}
			//var markerpoint = {lat: point2mark.lat(), lng: point2mark.lon()};
			//console.log(markerpoint);
			//graphmarker = new google.maps.Marker({
			//	position: markerpoint, 
			//	title: 'T:\t'+lap+'\r\n'+
			//		'v:\t'+Math.round(point2mark.speed)+'km/h\r\n'+
			//		'accel:\t'+Math.round(point2mark.accel*100)/100+'g\r\n'+
			//		'alt:\t'+Math.round(point2mark.altitude)+'m\r\n'+
			//		'cap:\t'+Math.round(point2mark.cap*10)/10+'° '
			//	,icon: {
			//		path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
			//		rotation: cap,
			//		fillColor: "cyan",
			//		fillOpacity: 0.8,
			//		scale: 5,
			//		strokeColor: "gold",
			//		strokeWeight: 2,
			//		}
			//	,draggable: true
			//	});
			//graphmarker.setMap(map);
			//setCenter(markerpoint);
			//graphmarker.addListener('dragend', function(ev) {changeMobilePoint(ev);});
		}
		return;
	});
	var el = document.getElementById("info-graph");
	if (el) {
		el.innerHTML = "";
	}

	return;
}

function setMarkerpoint(x,y) {
	var lap = tabShow[y];
	var point2mark = tabGraph[x][y];

	if (graphmarker != '') {
		graphmarker.setMap(null);
		graphmarker = '';
	}
	var cap = point2mark.cap;
	var markerpoint = {lat: point2mark.lat(), lng: point2mark.lon()};
	console.log(markerpoint);
	graphmarker = new google.maps.Marker({
		position: markerpoint, 
		title: 'T:\t'+lap+'\r\n'+
			'P:\t'+x+'\r\n'+
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
		,draggable: true
		});
	graphmarker.setMap(map);
	setCenter(markerpoint);
	graphmarker.addListener('dragend', function(ev) {changeMobilePoint(ev);});
}

function changeMobilePoint(ev) {
	console.log(JSON.stringify(ev));
	var x = lieu[0].row;
	var y = lieu[0].column-1;
	var lap = tabShow[y];
	var il = lap-1;
	console.log(JSON.stringify(Tours[il].geocoords));
	// recherche du point le plus proche du marker mobile
	var mindist = 999999;
	var dist;
	var im;
	for (var ip=1; ip < Tours[il].geocoords.length; ip++) {
		var lata = ev.latLng.lat();
		var lnga = ev.latLng.lng();
		var latb = Tours[il].geocoords[ip].lat();
		var lngb = Tours[il].geocoords[ip].lng();
		dist = distanceGPS(new Array(lata,lnga),new Array(latb,lngb));
		console.log('dist:'+dist);
		if (dist < mindist) {
			mindist = dist;
			im = ip;
		}
	}
	console.log('mindist:'+mindist);
	console.log('indice point:'+im);
	// on place le mobile sur le point le plus près qu'on a trouvé
	var point2mark = tabGraph[im][0];

	//var point2mark = new Array();
	//point2mark.lat = Tours[il].geocoords[im].lat;
	//point2mark.lon = Tours[il].geocoords[im].lng;
	//point2mark.cap = Tours[il].points[im].cap;
	var x=im;
	var y=0;
	setMarkerpoint(x,y);
	
	//on repère le mobile sur le graphe
	var lieu2 = new Array();
	var newlocation = new Array();
	lieu2.row = im;
	lieu2.column = 0;
	newlocation.push(lieu2);
	
	chart.draw(datag, options);
	chart.setSelection([{'row' : im}]);
	
	//for (var
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
		//var dist =	google.maps.geometry.spherical.computeLength(geodist);
		var dist = distance2segments(geodist);
		distlap += dist;
		ograph = new Object();
		ograph.dist = distlap; // X axis
		ograph.speed = Tours[il].points[ip].vitesse; // Y axis
		ograph.altitude = Tours[il].points[ip].altitude;
		ograph.cap = Tours[il].points[ip].cap;
		ograph.lat = Tours[il].geocoords[ip].lat;
		ograph.lon = Tours[il].geocoords[ip].lng;
		// calcul de l'accélération
		var accel = (((Tours[il].points[ip].vitesse - Tours[il].points[ip-1].vitesse)) * Frequence) / gkmh;
		ograph.accel = accel;
		
		lapGraph.push(ograph);
	}
	console.log('longueur Graph'+lapGraph.length);
}

function graphRelease() {
	is_graph = false;

	//if (graphmarker != '') {
	//	graphmarker.setMap(null);
	//	graphmarker = '';
	//}
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

function distance2segments(coords) {
	var latA = deg2rad(coords[0].lat);
	var lonA = deg2rad(coords[0].lng);
	var latB = deg2rad(coords[1].lat);
	var lonB = deg2rad(coords[1].lng);
	/*
	 **
     * Returns the distance along the surface of the earth from ‘this’ point to destination point.
     *
     * Uses haversine formula: a = sin²(Δφ/2) + cosφ1·cosφ2 · sin²(Δλ/2); d = 2 · atan2(√a, √(a-1)).
     *

        // a = sin²(Δφ/2) + cos(φ1)⋅cos(φ2)⋅sin²(Δλ/2)
        // δ = 2·atan2(√(a), √(1−a))
        // see mathforum.org/library/drmath/view/51879.html for derivation
		
Presuming a spherical Earth with radius R (see below), and that the
locations of the two points in spherical coordinates (longitude and
latitude) are lon1,lat1 and lon2,lat2, then the Haversine Formula 
(from R. W. Sinnott, "Virtues of the Haversine," Sky and Telescope, 
vol. 68, no. 2, 1984, p. 159): 

  dlon = lon2 - lon1
  dlat = lat2 - lat1
  a = (sin(dlat/2))^2 + cos(lat1) * cos(lat2) * (sin(dlon/2))^2
  c = 2 * atan2(sqrt(a), sqrt(1-a)) 
  d = R * c		

Number.prototype.toRadians = function() { return this * π / 180; };
Number.prototype.toDegrees = function() { return this * 180 / π; };
*/
	var radius = RT;
	const R = radius;
	const φ1 = latA,  λ1 = lonA;
	const φ2 = latB, λ2 = lonB;
	const Δφ = φ2 - φ1;
	const Δλ = λ2 - λ1;

	const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2) * Math.sin(Δλ/2)*Math.sin(Δλ/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	const d = R * c;

    // angle en radians entre les 2 points
	var MsinlatA = Math.sin(latA);
	var MsinlatB = Math.sin(latB);
	var McoslatA = Math.cos(latA);
	var McoslatB = Math.cos(latB);
	var Mabs = Math.abs(lonB-lonA);
	var Msin = MsinlatA * MsinlatB;
	var Mcoslat = McoslatA * McoslatB;
	var Mcoslon = Math.cos(Mabs);
	var Mcos = Mcoslat*Mcoslon;
	var Acos = Msin + Mcos;
	if (Acos > 1) Acos = 1;
	var D = Math.acos(Acos);
    //var S = Math.acos(Math.sin(latA)*Math.sin(latB) + Math.cos(latA)*Math.cos(latB)*Math.cos(Math.abs(longB-longA)))
	var S = D;
    // distance entre les 2 points, comptée sur un arc de grand cercle
	var distance = S*RT;
	//console.log('distance='+distance);
    return distance;
}


function isDocInFullscreen() {
  if (document.fullscreenElement) {
    return true;
  }
  return false;
}
var fullscreen = isDocInFullscreen();

var timer = '';
var dashboard_timer = '';
var led_timer = new Array();
led_timer['green'] = '';
led_timer['blue'] = '';
led_timer['yellow'] = '';

var inactiv_timeout = false;
var delai_inactiv = 10000; // 10 secondes d'inactivité au max

var Infos = false;
var timerInfos = '';
var fonction_getInfos = 'ajax/get_infos.py';
var nbsats = ""
var tempcpu = ""
var circuit = ""
var FL = new Array()
var pointgps = new Array()
var nearest = new Array()


var Colors = ['khaki','aqua','blue','red','green','indigo','yellow','orange','pink','brown','lime','cyan','purple','teal'];
var nb_colors = Colors.length;

// Début du programme
loadDashboard();

function dataDashboardReady() {
	go();
}

function go()
{
	if (timer) {
		clearTimeout(timer);
	}
	document.getElementById('dashboard').style.display = 'block';

	if (!Array.isArray(Dashboard)) {
		// on n'a pas réussi à charger les données
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = 'problème détecté';
		return false;
	}

	Ev = eval(Dashboard[0]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les données
		clearDashboard()
		document.getElementById("loading").style.display = 'block';
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = retour.msgerr;
		// tout recommencer dans quelques secondes
		timer = setTimeout(getNextDisplay, 3000);	
		return false;
	}

	thisDashboard = Ev;
	
	displayDashboard();
	
	getInfos();
}

// affichage du tableau de bord
function displayDashboard() {
	document.getElementById("Menu").style.display = 'none';
	document.getElementById("LCD").style.display = 'block';
	clearDashboard()
	var message = thisDashboard.dashboard;
	var command = message.substr(0,1);
	var texte = message.substr(1);
	var tabLines = texte.split('//');
	switch(command) {
		case "D":
		    displayNormal(tabLines);
		    break;
		case "H":
		    displayBig(tabLines);
		    break;
		case "S":
		    displaySmall(tabLines);
		    break;
		case "B":
		    clearDashboard();
		    break;
		default:
		    displayNormal(tabLines);
		    break;
	}
	displayLeds()

	timer = setTimeout(getNextDisplay, 500); // rafraichissement toutes les 1/2 secondes
}
function clearDashboard() {
	var el = document.getElementById('LD');
	el.style.display="none";
	var el = document.getElementById('LH');
	el.style.display="none";
	var el = document.getElementById('LS');
	el.style.display="none";
}
function displayNormal(lines) {
	var el = document.getElementById('LD');
	el.style.display="block";
	var el = document.getElementById('LD0');
	el.innerHTML = lines[0];
	var el = document.getElementById('LD1');
	var texte = ""
	if (lines.length > 1) {
		texte = lines[1];
	}
	el.innerHTML = texte;
}
function displayBig(lines) {
	var el = document.getElementById('LH');
	el.style.display="block";
	var el = document.getElementById('LH0');
	if (lines.length > 1) {
		textLayout('LH0',lines[0]);
	}

	var el = document.getElementById('LH1');
	var texte = ""
	if (lines.length > 1) {
		texte = lines[1];
	}
	el.innerHTML = texte;

	if (lines.length > 2) {
		textLayout('LH2',lines[2]);
	}	
}
function displaySmall(lines) {
	var el = document.getElementById('LS');
	el.style.display="block";
	
	textLayout('LS0',lines[0]);
	
	var el = document.getElementById('LS1');
	var texte = ""
	if (lines.length > 1) {
		texte = lines[1];
		textLayout('LS1',lines[1]);
	}

	var texte = ""
	if (lines.length > 2) {
		texte = lines[2];
		textLayout('LS2',lines[2]);
	}
	
	var texte = ""
	if (lines.length > 3) {
		texte = lines[3];
		textLayout('LS3',lines[3]);
	}
}

function textLayout(div,texte) {
	var el = document.getElementById(div);
	texteleft = texte;
	texteright = "";
	var position = texte.indexOf(" ");
	if (position>0) {
		texteleft = texte.substring(0,position);
		texteright = texte.substring(position);
	}
	var layout = "<div class=\"txtleft\">"+texteleft+"</div>"; 
	layout += "<div class=\"txtright\">"+texteright+"</div>"; 
	
	el.innerHTML = layout;	
}

function displayLeds() {
	var led1 = thisDashboard.led1;
	var led2 = thisDashboard.led2;
	var led3 = thisDashboard.led3;
	if (Array.isArray(led1)) {
		displayLed(led1,'yellow');
	}		
	if (Array.isArray(led2)) {
		displayLed(led2,'blue');
	}		
	if (Array.isArray(led3)) {
		displayLed(led3,'green');
	}		
}
function displayLed(led,color) {
	var action = led[0]*1;
	var flashing = led[1]*1;
	var flashtime = led[2]*1;
	var flashmode = led[3]*1;
	var led = document.getElementById('led-'+color);
	if (led_timer[color]) {
		clearTimeout(led_timer[color]);
	}
	if (action == 0) {
		led.className = 'led-'+color+'-off';
	}
	else {
		if (flashing == 0) {
			led.className = 'led-'+color+'-on';
		}
		else {
			if (flashmode >= 3)
				led.className = 'led-'+color+'-blink';
			else
				led.className = 'led-'+color+'-fast-blink';
			if (flashtime > 0) {
				flashtime = flashtime * 1000;
				led_timer[color] = setTimeout(stopBlinkLed, flashtime);
			}
		}
	}
}

function stopBlinkLed() {
	//for (property in led_timer) {
	//	//console.log(led_timer[property]);
	//}
	return;
	var led = document.getElementById('led-'+color);
	led.className = 'led-'+color+'-off';
	if (led_timer[color]) {
		clearTimeout(led_timer[color]);
	}
}

function stop_blink() {
	var led = document.getElementById('ledw');
	led.className = 'led-green-on';
}

// Rechercher le prochain point
function getNextDisplay() {
	if (timer) {
		clearTimeout(timer);
	}
	var proc = fonction_get+"?nocache=" + Math.random()
	loadDashboardAjax(proc);
	isDisplayReady();
}

function isDisplayReady()
{
	if (!Dashboard) {
		dashboard_timer = setTimeout(isDashboardReady, 100);
		return;
	}
	clearTimeout(dashboard_timer);

	document.getElementById("loading").style.display = 'none';
	var el = document.getElementById("zone-info");
	if (el) {
		el.innerHTML = '';
		//el.innerHTML = 'support fullscreen:'+true;
	}

	if (!Array.isArray(Dashboard)) {
		// on n'a pas réussi à charger les données
		document.getElementById("Menu").style.display = 'none';
		document.getElementById("LCD").style.display = 'block';
		clearDashboard()
		document.getElementById("loading").style.display = 'block';
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = 'problème détecté';
		return false;
	}

	Ev = eval(Dashboard[0]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les données
		document.getElementById("Menu").style.display = 'none';
		document.getElementById("LCD").style.display = 'block';
		clearDashboard()
		document.getElementById("loading").style.display = 'block';
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML += ' '+retour.msgerr;
		// aller vers le prochain point
		timer = setTimeout(getNextDisplay, 3000);
		return false;
	}

	thisDashboard = Ev;
	
	displayDashboard();
	
}

function writeMessage(text_mess,time_mess=1) {
	var delay = 1000;
	var el_message = document.getElementById('zone-info');
	el_message.style.display = 'block';
	el_message.className = "msg-std";
	el_message.innerHTML = text_mess;
	if (time_mess)
		var delay = time_mess * 1000;
	
	var temp = setInterval( function(){
		el_message.style.display = 'none';
        clearInterval(temp);
      }, delay );
}

function displayMenu() {
	if (Dashboard) {
		clearTimeout(dashboard_timer);
	}
	if (timer) {
		clearTimeout(timer);
	}
	document.getElementById("loading").style.display = 'none';
	document.getElementById("LCD").style.display = 'none';
	document.getElementById("dashboard").style.display = 'block';
	document.getElementById("Menu").style.display = 'block';
	setInactiv();
}

function request_shutdown() {
	if (Dashboard) {
		clearTimeout(dashboard_timer);
	}
	if (timer) {
		clearTimeout(timer);
	}
	if (confirm("shutdown system, do you want to continue ?")) {
	    ajax_cmd('shutdown_pi.py');
	}
	else {
		setInactiv(8000); // on refuse la confirmation, on recalibre le délai d'inaction à 8 secondes
	}
}

function request_reboot() {
	if (Dashboard) {
		clearTimeout(dashboard_timer);
	}
	if (timer) {
		clearTimeout(timer);
	}
	if (confirm("reboot system, do you want to continue ?")) {
	    ajax_cmd('reboot_pi.py');
	}
	else {
		setInactiv(8000); // on refuse la confirmation, on recalibre le délai d'inaction à 8 secondes
	}
}

function clear_autodef() {
	if (Dashboard) {
		clearTimeout(dashboard_timer);
	}
	if (timer) {
		clearTimeout(timer);
	}
	if (confirm("clear autodef track, do you want to continue ?")) {
	    ajax_cmd('clear_autodef.py');
		setInactiv(5000); // on temporise 5 secondes, le temps de voir la réponse ajax
	}
	else {
		setInactiv(8000); // on refuse la confirmation, on recalibre le délai d'inaction à 8 secondes
	}
}

function ajax_cmd(cmd) {
	if (timer) {
		clearTimeout(timer);
	}
	if (Dashboard) {
		clearTimeout(dashboard_timer);
	}
	setInactiv(2000); // une commande a été lancée, on recalibre le délai d'inaction à 2 secondes

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            myObj = JSON.parse(this.responseText);

            document.getElementById("info-cmd").innerHTML = myObj.msg;
        }
    }
    xmlhttp.open("GET", "ajax/"+cmd+"?nocache=" + Math.random(), true);
    xmlhttp.send();
}

function setInactiv(delai=delai_inactiv) {
	if (inactiv_timeout) {
		window.clearTimeout(inactiv_timeout);
	}
	inactiv_timeout=window.setTimeout("restartDisplay()", delai);
}

function restartDisplay() {
    document.getElementById("info-cmd").innerHTML = "";
	getNextDisplay();
	getInfos()
}

// Rechercher les prochaines infos (toutes les 2 secondes)
function getInfos() {
	if (timerInfos) {
		clearTimeout(timerInfos);
	}
	var proc = fonction_getInfos+"?nocache=" + Math.random()
	loadInfosAjax(proc);
	isInfosReady();
}

function isInfosReady()
{
	if (!Infos) {
		timerInfos = setTimeout(isInfosReady, 2000);
		return;
	}
	clearTimeout(timerInfos);

	if (!Array.isArray(Infos)) {
		// on n'a pas réussi à charger les données
		clearDashboard()
		document.getElementById("loading").style.display = 'block';
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = 'problème détecté';
		timerInfos = setTimeout(getInfos, 3000);
		return false;
	}

	Ev = eval(Infos[0]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les données
		clearDashboard()
		document.getElementById("loading").style.display = 'block';
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML += ' '+retour.msgerr;
		// aller vers le prochain point
		timerInfos = setTimeout(getInfos, 3000);
		return false;
	}
	
	retour = Ev[0];
	nbsats = retour.nbsats;
	tempcpu = retour.tempcpu;
	circuit = retour.circuit;
	distcircuit = retour.distcircuit;

	var el = document.getElementById("nb-sats");
	el.innerHTML = nbsats;
	
	var el = document.getElementById("signal-container");
	el.style.display="block";
	var ebar1 = document.getElementById("sbar1");
	var ebar2 = document.getElementById("sbar2");
	var ebar3 = document.getElementById("sbar3");
	var ebar4 = document.getElementById("sbar4");
	var ebar5 = document.getElementById("sbar5");
	ebar1.style.height="0%";
	ebar2.style.height="0%";
	ebar3.style.height="0%";
	ebar4.style.height="0%";
	ebar5.style.height="0%";
	if (nbsats > 0) {
		 ebar1.style.height="20%";
	}
	if (nbsats > 3) {
		 ebar2.style.height="40%";
	}
	if (nbsats > 5) {
		 ebar3.style.height="60%";
	}
	if (nbsats > 7) {
		 ebar4.style.height="80%";
	}
	if (nbsats > 9) {
		 ebar5.style.height="100%";
	}

	document.getElementById("tempcpu").innerHTML = tempcpu+'°';
	document.getElementById("NomCircuit").innerHTML = circuit;
	
	// recherche des compléments d'infos sur LIVE
	FL = new Array()
	pointgps = new Array()
	try {
		if (Infos.length > 2) {
			Ev = eval(Infos[1]);
			retourCircuit = Ev[0];
			FL = retourCircuit.FL;
			Ev = eval(Infos[2]);
			retourPoint = Ev[0];
			pointgps = retourPoint.pointgps;
			nearest = retourPoint.neartrk;
			document.getElementById("NomCircuit").innerHTML = nearest[0];
		}
		else {
			if (Infos.length > 1) {
				Ev = eval(Infos[1]);
				retourPoint = Ev[0];
				pointgps = retourPoint.pointgps;
				nearest = retourPoint.neartrk;
				document.getElementById("NomCircuit").innerHTML = nearest[0];
			}
		}
	}
	catch(e) {//console.log(JSON.stringify(Infos));}

	timerInfos = setTimeout(getInfos, 2000);	
}

function loadInfosAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				try {Infos = JSON.parse(this.responseText);}
				catch(e) {Infos = this.responseText;}
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

// Fonction de redimensionnement de l'écran (normal ou fullscreen)
function resizescreen(div2rsz) {
	var el = document.getElementById(div2rsz);
	var bouton = document.getElementById('b_sizescreen');
	if (!fullscreen) {
		bouton.className = 'button_windowscreen';
		set_fullscreen(el);
		fullscreen = true;
		divfull = div2rsz;
	}
	else {
		bouton.className = 'button_fullscreen';
		set_windowscreen();
		fullscreen = false;
	}
}
function set_fullscreen(el) {
   return (el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen).call(el);
}
function set_windowscreen() {
	if(document.exitFullscreen) {
	document.exitFullscreen();
	} else if(document.mozCancelFullScreen) {
	document.mozCancelFullScreen();
	} else if(document.webkitExitFullscreen) {
	document.webkitExitFullscreen();
	}
}

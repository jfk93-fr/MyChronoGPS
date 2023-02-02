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
				//alert("responseText:"+this.responseText);
				//console.log(this.responseText);
				try {
						Status = JSON.parse(this.responseText);
						console.log(this.responseText)
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
		console.log(Status);
		return false;
	}

	Ev = eval(Status[0]);
	retour = Ev;
	if (retour.msgerr) {
		// on n'a pas réussi à charger les données
		//clearDashboard()
		document.getElementById("loading").style.display = 'block';
		var el = document.getElementById("zone-info");
		if (el)
			el.innerHTML = retour.msgerr;
		// tout recommencer dans quelques secondes
		//console.log(retour.msgerr)
		timer = setTimeout(getNextPoint, 3000);	
		return false;
	}

	//console.log(Ev);
	thisStatus = Ev;
	document.getElementById("adresseip").innerHTML = thisStatus.adresseip;
	document.getElementById("hostname").innerHTML = thisStatus.hostname;
	document.getElementById("cputemp").innerHTML = thisStatus.cputemp;
	var el = document.getElementById("process");
	var HTML = '<table class="status-table"><tr>';
	//var title = thisStatus.pheader
	for (var i=0; i < thisStatus.pheader.length; i++) {
		HTML += "<th>"+thisStatus.pheader[i]+"</th>";
	}
	/*HTML += "<th>KILL</th>";*/
	HTML += "</tr>";
	for (var i=0; i < thisStatus.myprocess.length; i++) {
		console.log(thisStatus.myprocess[i]);
		console.log(thisStatus.myprocess[i].substr(48));
		HTML += "<tr>";
		var buf = thisStatus.myprocess[i];
		for (var j=0; j < thisStatus.pheader.length-1; j++) {
			var ip = buf.indexOf(' ');
			var zd = buf.substr(0,ip)
			HTML += "<td>"+zd+"</td>";
			buf = buf.substr(ip).trim();
		}
		HTML += "<td>"+thisStatus.myprocess[i].substr(48)+"</td>"; // la commande complète est située à l'offset 48
		/*HTML += "<th>KILL</th>";*/
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
		console.log(thisStatus.disk[i]);
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

	//thisStatus.myprocess;
	//
	//displayDashboard();
	//
	//getInfos();
}

// affichage du tableau de bord
function displayDashboard() {
	document.getElementById("Menu").style.display = 'none';
	document.getElementById("LCD").style.display = 'block';
	clearDashboard()
	var message = thisDashboard.dashboard;
	var command = message.substr(0,1);
	//console.log(command);
	var texte = message.substr(1);
	//console.log(texte);
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

	//timer = setTimeout(getNextPoint, 200);
	timer = setTimeout(getNextPoint, 500); // rafraichissement toutes les 1/2 secondes
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
	//el.innerHTML = lines[0];
	//var texte = ""
	if (lines.length > 1) {
		//texte = lines[0];
		textLayout('LH0',lines[0]);
	}

	var el = document.getElementById('LH1');
	var texte = ""
	if (lines.length > 1) {
		texte = lines[1];
	}
	el.innerHTML = texte;

	//var texte = ""
	if (lines.length > 2) {
		//var el = document.getElementById('LH2');
		//texte = lines[2];
		textLayout('LH2',lines[2]);
	}
	//el.innerHTML = texte;
	
}
function displaySmall(lines) {
	var el = document.getElementById('LS');
	el.style.display="block";
	
	//var el = document.getElementById('LS0');
	//el.innerHTML = lines[0];
	textLayout('LS0',lines[0]);
	
	var el = document.getElementById('LS1');
	var texte = ""
	if (lines.length > 1) {
		texte = lines[1];
		textLayout('LS1',lines[1]);
	}
	//el.innerHTML = texte;
	
	//var el = document.getElementById('LS2');
	var texte = ""
	if (lines.length > 2) {
		texte = lines[2];
		textLayout('LS2',lines[2]);
	}
	//el.innerHTML = texte;
	
	var texte = ""
	if (lines.length > 3) {
		texte = lines[3];
		textLayout('LS3',lines[3]);
	}
	//var el = document.getElementById('LS3');
	//el.innerHTML = texte;
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
	//console.log('leds='+led1+'/'+led2+'/'+led3);
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
	//if (flashtime == 0)
	//	flashtime = 2; // on va faire un flash pendant au moins 2 secondes
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
	//console.log('timeout');
	for (property in led_timer) {
		//console.log(led_timer[property]);
	}
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
function getNextPoint() {
	if (timer) {
		clearTimeout(timer);
	}
	var proc = fonction_get+"?nocache=" + Math.random()
	loadDashboardAjax(proc);
	isPointReady();
}

function isPointReady()
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
		console.log('isPointReady() erreur');
		console.log(Dashboard);
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
		//console.log(retour.msgerr)
		timer = setTimeout(getNextPoint, 3000);
		return false;
	}

	//console.log(Ev)
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
		    //alert("responseText:"+this.responseText);
			//console.log(this.responseText);
        
            myObj = JSON.parse(this.responseText);
			
			//alert("objet:"+JSON.stringify(myObj));
            
            //document.getElementById("zone-info").innerHTML = myObj.return;
            document.getElementById("info-cmd").innerHTML = myObj.msg;
        }
    }
    xmlhttp.open("GET", "ajax/"+cmd+"?nocache=" + Math.random(), true);
    xmlhttp.send();
}

function setInactiv(delai=delai_inactiv) {
	//var delai = delai_inactiv;
	if (inactiv_timeout) {
		window.clearTimeout(inactiv_timeout);
	}
	inactiv_timeout=window.setTimeout("restartDisplay()", delai);
}

function restartDisplay() {
	getNextPoint();
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
		console.log('isInfosReady() erreur');
		console.log(Infos);
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
	el.innerHTML = 'sat '+nbsats;
	
	//el.style.display="none";
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
	//signal.className = 'signal-container';

	
	
	document.getElementById("tempcpu").innerHTML = tempcpu+'°';
	document.getElementById("NomCircuit").innerHTML = circuit+"("+distcircuit+"m)";
	
	// recherche des compléments d'infos sur LIVE
	FL = new Array()
	pointgps = new Array()
	try {
		if (Infos.length > 2) {
			Ev = eval(Infos[1]);
			retourCircuit = Ev[0];
			//console.log(JSON.stringify(retourCircuit));
			FL = retourCircuit.FL;
			Ev = eval(Infos[2]);
			retourPoint = Ev[0];
			pointgps = retourPoint.pointgps;
			nearest = retourPoint.neartrk;
			document.getElementById("NomCircuit").innerHTML = nearest[0]+"("+nearest[1]+"m)";
			//console.log(document.getElementById("NomCircuit").innerHTML);
			//console.log(JSON.stringify(retourPoint));
		}
		else {
			if (Infos.length > 1) {
				Ev = eval(Infos[1]);
				retourPoint = Ev[0];
				pointgps = retourPoint.pointgps;
				nearest = retourPoint.neartrk;
				document.getElementById("NomCircuit").innerHTML = nearest[0]+"("+nearest[1]+"m)";
				//console.log(document.getElementById("NomCircuit").innerHTML);
				//console.log(JSON.stringify(retourPoint));
			}
		}
	}
	catch(e) {console.log(JSON.stringify(Infos));}
/*

    def createPoint(self):
        self.Line = '[{"timestamp":"'+str(self.gps.gpstime)+'"'
        self.Line += ',"pointgps":['+str(self.gps.latitude)+","+str(self.gps.longitude)
        # to minimise the size of the lines we round to 2 decimal places
        self.Line += '],"vitesse":'+str(round(self.gps.gpsvitesse,2))
        self.Line += ',"altitude":'+str(round(self.gps.gpsaltitude,2))
        self.Line += ',"cap":'+str(round(self.gps.gpscap,2))
        self.Line += ',"lap":'+str(self.chrono.nblap)
        self.Line += '}]'
        #logger.debug("***"+str(self.Line)+"***")

        with open(self.trace, 'a') as trace: # we write the trace file
            trace.write(self.Line+"\r\n")
            trace.close()

    def createLine1(self):
        #logger.info(str(self.chrono.circuit))
        line = '[{"date":"'+str(formatGpsDate(self.gps))+'"'
        NomCircuit = "inconnu"
        #logger.debug("circuit:"+str(type(self.chrono.circuit)))
        if "NomCircuit" in self.chrono.circuit:
            NomCircuit = self.chrono.circuit["NomCircuit"]
        line += ',"NomCircuit":"'+NomCircuit+'"'
        line += ',"FL":['+str(self.chrono.startlat1)+","+str(self.chrono.startlon1)+","+str(self.chrono.startlat2)+","+str(self.chrono.startlon2)+"]"
        if self.chrono.pitin != False and self.chrono.pitout != False:
            line += ',"PitIn":['+str(self.chrono.pitin.lat1)+","+str(self.chrono.pitin.lon1)+","+str(self.chrono.pitin.lat2)+","+str(self.chrono.pitin.lon2)+"]"
            line += ',"PitOut":['+str(self.chrono.pitout.lat1)+","+str(self.chrono.pitout.lon1)+","+str(self.chrono.pitout.lat2)+","+str(self.chrono.pitout.lon2)+"]"
        i = 0
        while i < len(self.chrono.intline):
            line += ',"Int'+str(i+1)+'":['+str(self.chrono.intline[i].lat1)+","+str(self.chrono.intline[i].lon1)+","+str(self.chrono.intline[i].lat2)+","+str(self.chrono.intline[i].lon2)+"]"
            i = i+1            

        line += '}]'
        self.Line1 = line
*/	

	timerInfos = setTimeout(getInfos, 2000);
	
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
	//console.log('est-ce que le navigateur supporte le plein écran:'+fullscreen)
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

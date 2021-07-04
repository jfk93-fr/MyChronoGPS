//var fonction_get = 'ajax/get_dashboard.php';
var fonction_get = 'ajax/get_dashboard.py';

var Dashboard = false;
var msgretproc = false;

var el = document.getElementById("zone-info");
if (el)
	el.innerHTML = 'Les données sont en cours de chargement, veuillez patienter.';
var Dashboard_timer = '';

function loadDashboard()
{
	var proc = fonction_get+"?nocache=" + Math.random()
	loadDashboardAjax(proc);
	isDashboardReady();
}

function isDashboardReady()
{
	if (!Dashboard) {
		Dashboard_timer = setTimeout(isDashboardReady, 100);
		return;
	}
	clearTimeout(Dashboard_timer);
	var el = document.getElementById("zone-info");
	if (el)
		el.innerHTML = '';

	dataDashboardReady();
}

function loadDashboardAjax(proc) 
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
			if (this.status == 200) {
				//alert("responseText:"+this.responseText);
				//console.log(this.responseText);
				try {Dashboard = JSON.parse(this.responseText);}
				catch(e) {Dashboard = this.responseText;}
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

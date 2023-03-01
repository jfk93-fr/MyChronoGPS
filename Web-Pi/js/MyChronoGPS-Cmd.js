function ajax_cmd(cmd) {
    
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
		    //alert("responseText:"+this.responseText);
			//console.log(this.responseText);
        
            myObj = JSON.parse(this.responseText);
			
			//alert("objet:"+JSON.stringify(myObj));
            
            document.getElementById("retour").innerHTML = myObj.return;
            document.getElementById("message").innerHTML = myObj.msg;
        }
    }
    xmlhttp.open("GET", "ajax/"+cmd+"?nocache=" + Math.random(), true);
    xmlhttp.send();
}

function request_reboot() {
	if (confirm("reboot system, do you want to continue ?")) {
	    ajax_cmd('reboot_pi.py');
	}
}

function request_shutdown() {
	if (confirm("shutdown system, do you want to continue ?")) {
	    ajax_cmd('shutdown_pi.py');
	}
}

function clear_autodef() {
	if (confirm("clear autodef track, do you want to continue ?")) {
	    ajax_cmd('clear_autodef.py');
	}
}

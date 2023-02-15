function ajax_cmd(cmd) {
    
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
		    //alert("responseText:"+this.responseText);
			console.log(this.responseText);
        
            myObj = JSON.parse(this.responseText);
			
			//alert("objet:"+JSON.stringify(myObj));
            
            document.getElementById("retour").innerHTML = myObj.return;
            document.getElementById("message").innerHTML = myObj.msg;
        }
    }
    xmlhttp.open("GET", "ajax/"+cmd, true);
    xmlhttp.send();
}

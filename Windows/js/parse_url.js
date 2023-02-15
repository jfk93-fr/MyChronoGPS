if (window.location.search != "") {
	longueur = window.location.search.length - 1;
	data = window.location.search.substr(1,longueur);
	donnees = data.split("&");
	urlvar = new Array();
	urlvarnum = new Array();
	for (var i=0; i < donnees.length; i++) {
		position = donnees[i].indexOf("=");
		variable = donnees[i].substr(0,position);
		pos = position + 1;
		valeur = decodeURI(donnees[i].substr(pos,donnees[i].length));
		while (valeur.search(/\+/) != -1)
		valeur = valeur.replace(/\+/," ");
		urlvar[variable] = valeur;
		urlvarnum[i] = valeur;
	}
}
//si l'adresse de départ est "http://www.mapage.com/index.htm?nom=dupond&prenom=jean&age=50+ans", alors urlvar['nom'] vaut 'dupond', urlvar['prenom'] vaut 'jean', et urlvar['age'] vaut '50 ans'

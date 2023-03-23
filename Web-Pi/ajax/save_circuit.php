<?php
include('ajaxroot.php');
$dir = $ajaxroot.'MyChronoGPS/tracks';

$result = null;
if (!is_dir ($dir)) {
	die ('problème lecture répertoire '.$dir);
}

// on récupère les données POST
$data = array();

$result = new stdClass();
foreach($_POST as $key => $value) {
	$result->$key = $value;
}
$trkname = "NewTrack";
if (array_key_exists("NomCircuit",$_POST)) {
	$trkname = $_POST["NomCircuit"];
	// pour le nom du fichier piste, on remplace les caractères espace par des tirets
	$trkname = str_replace(" ","-",$trkname);
}
foreach($_POST as $key => $value) {
	//error_log($key.'='.json_encode($value)."\n",0);
	$propertyval = $value;
	$valArray = $value;
	$c1 = 0;
	$c2 = 0;
	$valArray = str_replace("[","",$valArray,$c1);
	$valArray = str_replace("]","",$valArray,$c2);
	if ($c1+$c2 > 0) {
		// la variable est entre crochets, il s'agit d'un tableau de valeurs séparées par des virgules
		$propertyval = explode(",",$valArray);
	}
	$data[$key] = $propertyval;
}
if (array_key_exists("IdCircuit",$_POST)) {
	if ($data["IdCircuit"] == 0)
		$data["IdCircuit"] = uniqid();
}

$Track = json_encode($data,JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK);
//$Track = json_encode($data,JSON_NUMERIC_CHECK);
// on va transformer l'objet pour le rendre plus lisible
//$Track = str_replace(",",",\r\n",$Track);

// l'objet Track est créé, on va l'écrire dans le fichier

$filename = $dir.'/'.$trkname.'.trk';

$fichier=fopen($filename,"w+");
if ($fichier == false) {
	die ('problème ouverture fichier '.$filename);
}
fputs($fichier,$Track);
fclose($fichier);
$mode = 775;
if (!chmod($filename, octdec($mode)))
	die('problème changement droits d\'accès fichier '.$filename);

echo $Track;
exit;
?>

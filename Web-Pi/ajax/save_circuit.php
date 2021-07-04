<?php
include('ajaxroot.php');
$dir = $ajaxroot.'pi/MyChronoGPS/tracks';

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
	$propertyval = $value;
	$valArray = $value;
	$c1 = 0;
	$c2 = 0;
	$valArray = str_replace("[","",$valArray,$c1);
	$valArray = str_replace("]","",$valArray,$c2);
	if ($c1+$c2 > 0) {
		// la variable est entre crochets, il s'agit d'un tableau de valeurs séparées par des virgules
		//$Tval = explode(",",$valArray);
		$propertyval = explode(",",$valArray);
		//$propertyval = $Tval;
	}
	$data[$key] = $propertyval;
}
//$m=microtime(true);
//$uniq = trim(sprintf("%8x%05x\n",floor($m),($m-floor($m))*1000000));
//var_dump($uniq);
if (array_key_exists("IdCircuit",$_POST)) {
	if ($data["IdCircuit"] == 0)
		$data["IdCircuit"] = uniqid();
}
//var_dump($data);
//header('Content-type: application/json; charset=UTF-8');
$Track = json_encode($data,JSON_NUMERIC_CHECK);
// on va transformer l'objet pour le rendre plus lisible
$Track = str_replace(",",",\r\n",$Track);

// l'objet Track est créé, on va l'écrire dans le fichier

$filename = $dir.'/'.$trkname.'.trk';
//var_dump($filename);

$fichier=fopen($filename,"w+");
if ($fichier == false) {
	die ('problème ouverture fichier '.$filename);
}
fputs($fichier,$Track);
fclose($fichier);
$mode = 775;
//if (!chmod($filename, 0755))
if (!chmod($filename, octdec($mode)))
	die('problème changement droits d\'accès fichier '.$filename);

echo $Track;
exit;
?>

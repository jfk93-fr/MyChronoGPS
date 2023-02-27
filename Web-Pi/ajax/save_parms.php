<?php
include('ajaxroot.php');
$dir = $ajaxroot.'MyChronoGPS/parms';
$dcache = $ajaxroot.'MyChronoGPS/cache';

$result = null;
if (!is_dir ($dir)) {
	print('problème lecture répertoire '.$dir);
	die;
}

// on récupère les données POST
if (!array_key_exists("parms",$_POST)) {
	print('problème d\'accès aux données POST');
	die;
}

$Parms = $_POST["parms"];
$data = json_decode($Parms);
$Parms = json_encode($data,JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK);

$filename = $dir.'/params.json';
$fichier=fopen($filename,"w+");
if ($fichier == false) {
	print('problème ouverture fichier '.$filename);
	die;
}
fputs($fichier,$Parms);
fclose($fichier);
$mode = 775;
if (!chmod($filename, octdec($mode))) {
	print('problème changement droits d\'accès fichier '.$filename);
	die;
}

$filename = $dcache.'/PARMS';
$fichier=fopen($filename,"w+");
if ($fichier == false) {
	print('problème ouverture fichier '.$filename);
	die;
}
fputs($fichier,$Parms);
fclose($fichier);
$mode = 777;
if (!chmod($filename, octdec($mode))) {
	print('problème changement droits d\'accès fichier '.$filename);
	die;
}

print($Parms);
exit;
?>

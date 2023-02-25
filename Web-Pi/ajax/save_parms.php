<?php
include('ajaxroot.php');
$dir = $ajaxroot.'MyChronoGPS/parms';
$dcache = $ajaxroot.'MyChronoGPS/cache';

$result = null;
if (!is_dir ($dir)) {
	die ('problème lecture répertoire '.$dir);
}

// on récupère les données POST
if (!array_key_exists("parms",$_POST))
	die('problème d\'accès aux données POST');

$Parms = $_POST["parms"];
$data = json_decode($Parms);
$Parms = json_encode($data,JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK);

$filename = $dir.'/params.json';
$fichier=fopen($filename,"w+");
if ($fichier == false) {
	die ('problème ouverture fichier '.$filename);
}
fputs($fichier,$Parms);
fclose($fichier);
$mode = 775;
if (!chmod($filename, octdec($mode)))
	die('problème changement droits d\'accès fichier '.$filename);

$filename = $dcache.'/PARAMS';
$fichier=fopen($filename,"w+");
if ($fichier == false) {
	echo ('problème ouverture fichier '.$filename);
	die;
}
fputs($fichier,$Parms);
fclose($fichier);
$mode = 777;
if (!chmod($filename, octdec($mode))) {
	echo('problème changement droits d\'accès fichier '.$filename);
	die;
}

echo $Parms;
exit;
?>

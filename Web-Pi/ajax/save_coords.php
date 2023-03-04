<?php
include('ajaxroot.php');
$dir = $ajaxroot.'MyChronoGPS/analysis';

$result = array();
if (!is_dir ($dir)) {
	$info = new stdClass();
	$info->msgerr = 'problème lecture répertoire '.$dir;
	array_push($result,$info);
	$json = json_encode($result);
	echo $json;
	die;
}

// on récupère les données POST
$data = array();

foreach($_POST as $key => $value) {
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
$Coords = json_encode($data,JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK);

// On va lire la première ligne du fichier analysis
$locfile = $_GET["analysis"];
if (is_file($dir.'/'.$locfile)) {
	$handle = @fopen($dir.'/'.$locfile, "r");
	if ($handle) {
		$info = fgets($handle);

		//$data = array();
		//array_push($data,$info);
		//$json = json_encode($data);
		//echo $json;

		$coords_origin = json_decode($info)[0];
		fclose($handle);
	}
	else {
		$info = new stdClass();
		$info->msgerr = 'probème lecture fichier '.$dir.'/'.$locfile;
		array_push($result,$info);
		$json = json_encode($result);
		echo $json;
		die;
	}
}
else {
	$info = new stdClass();
	$info->msgerr = 'fichier '.$dir.'/'.$locfile.' non trouvé';
	array_push($result,$info);
	$json = json_encode($result);
	echo $json;
	die;
}

$newcoords = new stdClass();
foreach($coords_origin as $key => $value) {
	$newcoords->$key = $value;
}
$jsoncoords = json_decode($Coords);
foreach($jsoncoords as $key => $value) {
	$newcoords->$key = $value;
}
array_push($result,$newcoords);


// Lecture du fichier d'origine
$contents = file_get_contents($dir.'/'.$locfile);
$lines = explode("\n",$contents);
$lines[0] = json_encode($result);
$newcontent = implode("\n",$lines);
file_put_contents($dir.'/'.$locfile.'.json', $newcontent, FILE_APPEND);
/*



if (count($result) == 0) {
	$info = new stdClass();
	$info->msgerr = 'pas de coordonnée trouvée';
	array_push($result,$info);
	$json = json_encode($result);
	echo $json;
	die;
}


// on récupère les données POST
if (!array_key_exists("parms",$_POST)) {
	$info = new stdClass();
	$info->msgerr = 'problème d\'accès aux données POST');
	array_push($result,$info);
	$json = json_encode($result);
	echo $json;
	die;
}

//$Parms = $_POST["parms"];
//$data = json_decode($Parms);
//$Parms = json_encode($data,JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK);
//
//$filename = $dir.'/params.json';
//$fichier=fopen($filename,"w+");
//if ($fichier == false) {
//	print('problème ouverture fichier '.$filename);
//	die;
//}
//fputs($fichier,$Parms);
//fclose($fichier);
//$mode = 775;
//if (!chmod($filename, octdec($mode))) {
//	print('problème changement droits d\'accès fichier '.$filename);
//	die;
//}
//
//$filename = $dcache.'/PARMS';
//$fichier=fopen($filename,"w+");
//if ($fichier == false) {
//	print('problème ouverture fichier '.$filename);
//	die;
//}
//fputs($fichier,$Parms);
//fclose($fichier);
//$mode = 777;
//if (!chmod($filename, octdec($mode))) {
//	print('problème changement droits d\'accès fichier '.$filename);
//	die;
//}
*/

//$info = new stdClass();
//$info->msgerr = 'tout est ok';
//array_push($result,$info);
$json = json_encode($result);
echo $json;
exit;
?>

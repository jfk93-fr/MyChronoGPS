<?php
include('ajaxroot.php');
$dir = $ajaxroot.'MyChronoGPS/analysis';

$result = array();
$locfile = $_GET["analysis"];
//$file = '\''.$dir.'/'.$locfile.'\'';
if (is_file($dir.'/'.$locfile)) {
#if (is_file($file)) {
	$handle = @fopen($dir.'/'.$locfile, "r");
	//$handle = @fopen($file, "r");
	if ($handle) {
		while ($info = fgets($handle)) {
			array_push($result,$info);
		}
		fclose($handle);
	}
}
else {
	$info = new stdClass();
	$info->msgerr = 'fichier '.$dir.'/'.$locfile.' non trouvé';
	array_push($result,$info);
}

if (count($result) == 0) {
	$info = new stdClass();
	$info->msgerr = 'pas de coordonnée trouvée';
	array_push($result,$info);
}
$json = json_encode($result);
echo $json
?>

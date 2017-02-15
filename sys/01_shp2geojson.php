<?php

$jsonPath = __DIR__ . '/geojson';
if (!file_exists($jsonPath)) {
    mkdir($jsonPath, 0777, true);
}

foreach (glob(__DIR__ . '/shp/*.shp') AS $shpFile) {
    $p = pathinfo($shpFile);
    $jsonFile = $jsonPath . '/' . $p['filename'] . '.json';
    if (file_exists($jsonFile)) {
        unlink($jsonFile);
    }
    exec("ogr2ogr -f \"GeoJSON\" -s_srs EPSG:3826 -t_srs EPSG:4326 {$jsonFile} {$shpFile}");

    $json = json_decode(file_get_contents($jsonFile), true);
    foreach ($json['features'] AS $k => $f) {
        $json['features'][$k]['properties']['sname'] = mb_convert_encoding($json['features'][$k]['properties']['sname'], 'utf-8', 'big5');
    }
    file_put_contents($jsonFile, json_encode($json));
}
<?php

$fh = fopen(__DIR__ . '/water.csv', 'r');
$header = fgetcsv($fh, 2048);
$header[0] = substr($header[0], 3);
$ref = $pool = array();
while ($line = fgetcsv($fh, 2048)) {
    $parts1 = explode('-', $line[1]);
    $parts2 = explode('-', $line[2]);
    $sPool = array();
    foreach ($parts1 AS $k => $v) {
        $v = str_pad($v, 4, '0', STR_PAD_LEFT);
        $ref[trim($parts2[$k])] = $v;
        $sPool[] = $v;
    }
    $line[1] = implode('-', $sPool);
    $pool[$line[1]] = array_combine($header, $line);
}

$result = array();

foreach (glob(__DIR__ . '/geojson/*.json') AS $jsonFile) {
    $json = json_decode(file_get_contents($jsonFile), true);
    foreach ($json['features'] AS $f) {
        $name = trim($f['properties']['sname']);
        if ($name === '松浦系統') {
            $name = '松蒲系統';
        }
        if (isset($ref[$name])) {
            $f['properties']['id'] = $ref[$name];
            $result[$ref[$name]] = $f;
        } elseif (!isset($result[$name])) {
            $result[$name] = array();
        } else {
            $result[$name][] = $f;
        }
    }
}

$json = array(
    'type' => 'FeatureCollection',
    'features' => array(),
);

foreach ($pool AS $keys => $data) {
    $keys = explode('-', $keys);
    if (count($keys) === 1) {
        $key = array_pop($keys);
        $result[$key]['properties'] = $data;
        $json['features'][] = $result[$key];
        unset($result[$key]);
    } else {
        $f = array(
            'type' => 'Feature',
            'properties' => $data,
            'geometry' => array(
                'type' => 'MultiPolygon',
                'coordinates' => array(),
            ),
        );
        foreach ($keys AS $key) {
            if (isset($result[$key])) {
                switch ($result[$key]['geometry']['type']) {
                    case 'MultiPolygon':
                        foreach ($result[$key]['geometry']['coordinates'] AS $polygon) {
                            $f['geometry']['coordinates'][] = $polygon;
                        }
                        break;
                    case 'Polygon':
                        $f['geometry']['coordinates'][] = $result[$key]['geometry']['coordinates'];
                        break;
                }
                unset($result[$key]);
            }
        }
        $json['features'][] = $f;
    }
}

foreach ($result AS $fs) {
    foreach ($fs AS $f) {
        $json['features'][] = $f;
    }
}

$jsonFile = __DIR__ . '/sys.json';
$topoFile = __DIR__ . '/sys.topo.json';

if (file_exists($topoFile)) {
    unlink($topoFile);
}

file_put_contents($jsonFile, json_encode($json, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

exec("/usr/local/bin/mapshaper -i {$jsonFile} -o format=topojson {$topoFile}");

unlink($jsonFile);

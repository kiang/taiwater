<?php

$result = array();
foreach (glob(__DIR__ . '/raw/*.csv') AS $csvFile) {
    $fh = fopen($csvFile, 'r');
    fgetcsv($fh, 2048);
    /*
     * Array
      (
      [0] => 201601
      [1] => A0201-01-006
      [2] => 8
      [3] => 502
      )
     */
    while ($line = fgetcsv($fh, 2048)) {
        if (!isset($result[$line[1]])) {
            $result[$line[1]] = array(
                'total' => 0,
            );
        }
        if (!isset($result[$line[1]][$line[0]])) {
            $result[$line[1]][$line[0]] = array();
        }
        $result[$line[1]][$line[0]][$line[2]] = $line[3];
        $result[$line[1]]['total'] += intval($line[3]);
    }
}

file_put_contents(__DIR__ . '/2016.json', json_encode($result));

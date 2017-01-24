var layerStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0,255,255,0.6)',
        width: 2
    }),
    fill: new ol.style.Fill({
        color: 'rgba(0,200,200,0.1)'
    })
});
var targetLayer, dataWater, selectedCounty, code2name = {};
var waterType = {
    '1': '普通用水',
    '2': '商業用水',
    '3': '工業用水',
    '4': '機關用水',
    '6': '市政用水',
    '7': '船舶用水',
    '8': '優惠用水',
    '9': '臨時用水'
};
$.getJSON('2016.json', {}, function (d) {
    dataWater = d;
});

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
    // generate resolutions and matrixIds arrays for this WMTS
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
}
var popup = new ol.Overlay.Popup();

/*
 * layer
 * EMAP2: 臺灣通用電子地圖透明
 * EMAP6: 臺灣通用電子地圖(不含等高線)
 * EMAP7: 臺灣通用電子地圖EN(透明)
 * EMAP8: Taiwan e-Map
 * PHOTO2: 臺灣通用正射影像
 * ROAD: 主要路網
 */
var baseLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'http://maps.nlsc.gov.tw/S_Maps/wmts',
        layer: 'EMAP6',
        tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true,
        attributions: '<a href="http://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
    }),
    opacity: 0.8
});

var mapLayers = [baseLayer, new ol.layer.Tile({
        source: new ol.source.WMTS({
            matrixSet: 'EPSG:3857',
            format: 'image/png',
            url: 'http://maps.nlsc.gov.tw/S_Maps/wmts',
            layer: 'ROAD',
            tileGrid: new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(projectionExtent),
                resolutions: resolutions,
                matrixIds: matrixIds
            }),
            style: 'default',
            wrapX: true
        }),
        opacity: 0.3
    })];
var cityLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'topo/city.topo.json',
        format: new ol.format.TopoJSON()
    }),
    style: layerStyle
});
cityLayer.on('change', function () {
    if (cityLayer.getSource().getState() === 'ready') {
        cityLayer.getSource().forEachFeature(function (ff) {
            var p = ff.getProperties();
            if (!code2name[p.COUNTYCODE]) {
                code2name[p.COUNTYCODE] = p.COUNTYNAME;
            }
            if (!code2name[p.TOWNCODE]) {
                code2name[p.TOWNCODE] = p.TOWNNAME;
            }
        });
    }
})
mapLayers.push(cityLayer);
var map = new ol.Map({
    layers: mapLayers,
    target: 'map',
    controls: ol.control.defaults({
        attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
            collapsible: false
        })
    }),
    view: new ol.View({
        center: ol.proj.fromLonLat([121, 24]),
        zoom: 10
    })
});
map.addOverlay(popup);
map.on('singleclick', onLayerClick);
map.on('pointermove', onPointerMove);

function onPointerMove(e) {
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        var p = feature.getProperties();
        if (p.COUNTYCODE) {
            $('.navbar-text').html(p.COUNTYNAME + ' > ' + p.TOWNNAME);
        } else if (p.CODE1) {
            $('.navbar-text').html(code2name[p.COUNTY_ID] + ' > ' + code2name[p.TOWN_ID] + ' > ' + p.CODE1);
        }
    });
}
;

function onLayerClick(e) {
    var hasFeature = false;
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        var p = feature.getProperties();
        if (p.COUNTYCODE) {
            $('.navbar-text').html(p.COUNTYNAME + ' > ' + p.TOWNNAME);
            targetLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    url: 'topo/' + p.COUNTYCODE + '.json',
                    format: new ol.format.TopoJSON()
                }),
                style: layerStyle
            });
            targetLayer.once('change', function () {
                if (targetLayer.getSource().getState() === 'ready') {
                    fillTargetColor();
                }
            });
            map.addLayer(targetLayer);
            cityLayer.setVisible(false);
            map.getView().setCenter(e.coordinate);
            map.getView().setZoom(12);
        } else {
            $('.navbar-text').html(code2name[p.COUNTY_ID] + ' > ' + code2name[p.TOWN_ID] + ' > ' + p.CODE1);
            var message = '';
            if (dataWater[p.CODE1] && dataWater[p.CODE1].total > 0) {
                message += '<table class="table table-bordered"><thead><tr><td>月份</td><td>類型</td><td>用水量(度)</td></tr></thead><tbody>';
                for (ym in dataWater[p.CODE1]) {
                    if (ym !== 'total') {
                        var ymDone = false;
                        for (t in dataWater[p.CODE1][ym]) {
                            var ymStr = '';
                            if (!ymDone) {
                                ymStr = ym;
                                ymDone = true;
                            }
                            message += '<tr><td>' + ymStr + '</td><td>' + waterType[t] + '</td><td>' + dataWater[p.CODE1][ym][t] + '</td></tr>';
                        }
                    }
                }
                message += '</tbody></table>';
            }
            if (message !== '') {
                popup.show(e.coordinate, message);
            }
            map.getView().setCenter(e.coordinate);
            map.getView().setZoom(14);
        }
        hasFeature = true;
    });
    if (false === hasFeature) {
        cityLayer.setVisible(true);
        map.getView().setZoom(12);
        targetLayer.setVisible(false);
        popup.hide();
    }
}

function ColorBar(value) {
    if (value == 0)
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,255,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,255,255,0.3)'
            })
        })
    else if (value <= 5000)
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(50,255,0,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(50,255,0,0.3)'
            })
        })
    else if (value <= 10000)
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,0,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,255,0,0.3)'
            })
        })
    else if (value <= 20000)
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255,200,0,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,200,0,0.3)'
            })
        })
    else if (value <= 30000)
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255,0,0,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,0,0,0.3)'
            })
        })
    else if (value <= 50000)
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255,220,0,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,220,0,0.3)'
            })
        })
    else if (value <= 100000)
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(81,255,0,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(81,255,0,0.3)'
            })
        })
    else
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(0,0,0,0.6)',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0,0,0,0.3)'
            })
        })
}

function fillTargetColor() {
    targetLayer.getSource().forEachFeature(function (ff) {
        var cp = ff.getProperties();
        var colorDone = false;
        for (k in dataWater) { // k = code1
            if (colorDone === false && k == cp.CODE1) {
                ff.setStyle(ColorBar(dataWater[k].total));
                colorDone = true;
            }
        }
    });
}
var layerStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0,255,255,0.6)',
        width: 2
    }),
    fill: new ol.style.Fill({
        color: 'rgba(0,200,200,0.1)'
    })
});

var yStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(255,255,0,0.6)',
        width: 2
    }),
    fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.3)'
    })
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

var mapLayers = [baseLayer];
var cityLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'sys.topo.json',
        format: new ol.format.TopoJSON()
    }),
    style: layerStyle
});
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

function onLayerClick(e) {
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        layer.getSource().forEachFeature(function (f) {
            f.setStyle(layerStyle);
        });
        feature.setStyle(yStyle);
        var p = feature.getProperties();
        var message = '';
        var tableValues = {};
        var count = 0;
        for (k in p) {
            if (k !== 'geometry') {
                var parts = k.split('年');
                if (parts.length === 2) {
                    ++count;
                    if (!tableValues[parts[1]]) {
                        tableValues[parts[1]] = {};
                    }
                    tableValues[parts[1]][parts[0]] = p[k];
                } else {
                    message += k + ': ' + p[k] + '<br />';
                }
            }
        }
        if (count > 0) {
            message += '<table class="table table-bordered"><thead><tr><td>&nbsp;</td>';

            for (k in tableValues) {
                for (y in tableValues[k]) {
                    message += '<td>' + y + '</td>';
                }
                break;
            }
            message += '</tr></thead><tbody>';
            for (k in tableValues) {
                message += '<tr><td>' + k + '</td>';
                for (y in tableValues[k]) {
                    message += '<td>' + tableValues[k][y] + '</td>';
                }
                message += '</tr>';
            }
            message += '</tbody></table>';
        }
        popup.show(e.coordinate, message);
        map.getView().setCenter(e.coordinate);
        map.getView().setZoom(12);
    });
}
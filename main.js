$.ajaxSetup({async: false});
var loadedCity = {}, currentCity = '';
var map, area, headers;
$.getJSON('sum.json', {}, function (p) {
    for (k in p) {
        var parts = k.split('|');
        if (parts[0] !== 'code1') {
            continue;
        }
        for (m in p[k]) {
            var c = p[k][m]['county'].replace(/臺/, '台');
            if (!loadedCity[c]) {
                loadedCity[c] = {
                    data: {},
                    json: false
                };
            }
            if (!loadedCity[c]['data'][parts[1]]) {
                loadedCity[c]['data'][parts[1]] = {};
            }
            loadedCity[c]['data'][parts[1]][m] = p[k][m]['amount'];
        }
    }

});
var showCity = function (city) {
    $('.modal').dialog({
        title: "資料載入中",
        modal: true,
        width: 300,
        height: 200,
        closeOnEscape: false,
        resizable: false,
        open: function () {
            $(".ui-dialog-titlebar-close", $(this).parent()).hide(); //hides the little 'x' button
        }
    });
    $('body').addClass("loading");
    currentCity = city;
    $('.mapCity').each(function (k, e) {
        var eCity = $(e).html();
        if (eCity === currentCity) {
            $(e).removeClass('btn-default').addClass('btn-primary');
        } else {
            $(e).removeClass('btn-primary').addClass('btn-default');
        }
    });
    if (loadedCity[currentCity].json === false) {
        $.getJSON('json/' + currentCity + '.json', function (data) {
            loadedCity[currentCity]['json'] = data;
        });
    }
    map.data.forEach(function (l) {
        map.data.remove(l);
    });
    area = map.data.addGeoJson(loadedCity[currentCity]['json']);
    switch (city) {
        case '新北市':
            map.setCenter({lat: 25.053699, lng: 121.507837});
            break;
        case '桃園市':
            map.setCenter({lat: 24.9656572, lng: 121.222804});
            break;
        case '台中市':
            map.setCenter({lat: 24.167804, lng: 120.658214});
            break;
        case '台南市':
            map.setCenter({lat: 22.996169, lng: 120.201330});
            break;
        case '高雄市':
            map.setCenter({lat: 22.643894, lng: 120.317828});
            break;
        case '宜蘭縣':
            map.setCenter({lat: 24.677393, lng: 121.767628});
            break;
        case '新竹縣':
            map.setCenter({lat: 24.726808, lng: 121.109712});
            break;
        case '苗栗縣':
            map.setCenter({lat: 24.532913, lng: 120.836947});
            break;
        case '彰化縣':
            map.setCenter({lat: 24.009515, lng: 120.502431});
            break;
        case '南投縣':
            map.setCenter({lat: 23.939787, lng: 120.968750});
            break;
        case '雲林縣':
            map.setCenter({lat: 23.693670, lng: 120.438016});
            break;
        case '嘉義縣':
            map.setCenter({lat: 23.464988, lng: 120.327423});
            break;
        case '屏東縣':
            map.setCenter({lat: 22.598342, lng: 120.540550});
            break;
        case '台東縣':
            map.setCenter({lat: 22.766960, lng: 121.082108});
            break;
        case '花蓮縣':
            map.setCenter({lat: 23.700363, lng: 121.458446});
            break;
        case '澎湖縣':
            map.setCenter({lat: 23.564544, lng: 119.612168});
            break;
        case '基隆市':
            map.setCenter({lat: 25.124337, lng: 121.735592});
            break;
        case '新竹市':
            map.setCenter({lat: 24.797534, lng: 120.968834});
            break;
        case '嘉義市':
            map.setCenter({lat: 23.479583, lng: 120.454789});
            break;
    }
    showArea();
    setTimeout(function () {
        $('body').removeClass("loading");
        $('.modal').dialog('close');
    }, 500);
}

var showArea = function (areaCode) {
    if (!areaCode) {
        areaCode = '';
    }
    area.forEach(function (value) {
        var key = value.getProperty('CODE1'),
                count = 0;
        if (loadedCity[currentCity]['data'][key]) {
            if (loadedCity[currentCity]['data'][key]['201609']) {
                count += parseInt(loadedCity[currentCity]['data'][key]['201609']);
            }
            if (loadedCity[currentCity]['data'][key]['201610']) {
                count += parseInt(loadedCity[currentCity]['data'][key]['201610']);
            }
        }
        if (isNaN(count)) {
            count = 0;
        }
        value.setProperty('num', count);
        if (areaCode === key) {
            showFeature(value);
        }
    });
    map.data.setStyle(function (feature) {
        color = ColorBar(feature.getProperty('num'));
        return {
            fillColor: color,
            fillOpacity: 0.6,
            strokeWeight: 0
        }
    });
};
function showFeature(feature) {
    var area = feature.getProperty('TOWN') + '[' + feature.getProperty('CODE1') + ']';
    var areaKey = feature.getProperty('CODE1');
    var detail = '<h3>' + area + '</h3><div style="float:right;">單位：(度)</div><table class="table table-boarded">';
    var targetHash = '#' + areaKey;
    if (loadedCity[currentCity]['data'][areaKey]) {
        for (m in loadedCity[currentCity]['data'][areaKey]) {
            detail += '<tr><td>' + m + '</td><td>' + loadedCity[currentCity]['data'][areaKey][m] + '</td></tr>';
        }
    }
    detail += '</table>';
    $('#areaDetail').html(detail);
    if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
    }
}

var routes = {
    '/:theButton/:areaCode': showArea,
    '/:theButton': showArea
};
var router = Router(routes);
function initialize() {
    /*map setting*/
    $('#map-canvas').height(window.outerHeight / 2.2);
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 11,
        center: {lat: 25.053699, lng: 121.507837}
    });
    showCity('新北市');
    router.init();
    $('.mapCity').click(function () {
        showCity($(this).html());
        return false;
    });
    map.data.addListener('mouseover', function (event) {
        var Area = event.feature.getProperty('TOWN') + '[' + event.feature.getProperty('CODE1') + ']';
        map.data.revertStyle();
        map.data.overrideStyle(event.feature, {fillColor: 'white'});
        $('#content').html('<div>' + Area + ' ：' + event.feature.getProperty('num') + ' </div>').removeClass('text-muted');
    });
    map.data.addListener('click', function (event) {
        showFeature(event.feature);
    });
    map.data.addListener('mouseout', function (event) {
        map.data.revertStyle();
        $('#content').html('在地圖上滑動或點選以顯示數據').addClass('text-muted');
    });
}

google.maps.event.addDomListener(window, 'load', initialize);
function ColorBar(value) {
    if (value == 0)
        return "#FFFFFF"
    else if (value <= 2000)
        return "#FFFF66"
    else if (value <= 4000)
        return "#FFFF00"
    else if (value <= 6000)
        return "#FFBF00"
    else if (value <= 8000)
        return "#FF9F00"
    else if (value <= 10000)
        return "#FF3F00"
    else if (value <= 12000)
        return "#FF0000"
    else
        return "#CC0000"
}

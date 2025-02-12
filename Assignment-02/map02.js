mapboxgl.accessToken = 'pk.eyJ1Ijoic2FsbHl4aWUwMSIsImEiOiJjbTZpOHNwbDkwNjQ0Mm1xMzc5YThrMGdiIn0.OXLCwLgEIO7lKMpqekNKlQ';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sallyxie01/cm6jjlhxc004m01s72knvccpy',
    zoom: 10,
    center: [-74, 40.725],
    maxZoom: 15,
    minZoom: 8,
    maxBounds: [[-74.45, 40.45], [-73.55, 41]]
});

// 添加放大缩小按钮
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

map.on('load', function() {
    // 找到 `road-label` 图层（保证 Median Age 图层低于道路）
    let layers = map.getStyle().layers;
    let roadLabelId;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].id.includes('road')) {
            roadLabelId = layers[i].id;
            break;
        }
    }

    map.addLayer({
        'id': 'Median Age Data',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': 'data/median-age-fixed.geojson'  // 确保路径正确
        },
        'paint': {
            'fill-color': ['step', ['to-number', ['get', 'mpop']], 
            '#ede7f6',  // 更浅的紫（≤ 33）
             34, '#d1c4e9',  // 变浅一点的紫（34-38）
             39, '#b39ddb',  // 适中紫（39-43）
             44, '#9575cd',  // 深紫（44-50）
             51, '#7e57c2'   // 最深紫（≥ 51）
            ],
            'fill-opacity': 0.65
        }
    }, roadLabelId);

map.addLayer({
    'id': 'Open Space Data',
    'type': 'fill',
    'source': {
        'type': 'geojson',
        'data': 'data/open_space.geojson'
    },
    'paint': {
        'fill-color': '#B5E26D',  // 绿色填充
        'fill-opacity': 0.5,  // 透明度
    }
});

    // 🔹 先添加数据源
    if (!map.getSource('nycha')) {  
        map.addSource('nycha', {
            'type': 'geojson',
            'data': 'data/nycha_facilities.geojson'
        });
    }

    // **第一层：外圈（空心圆）**
    map.addLayer({
        'id': 'nycha-points-outline',
        'type': 'circle',
        'source': 'nycha',
        'paint': {
            'circle-radius': [
            'interpolate', ['exponential', 2], ['zoom'],
            10, 5,   // zoom 10 时，半径 6
            15, 14,  // zoom 15 时，半径 12
            20, 16   // zoom 20 时，半径 24
        ],
            'circle-stroke-width': 1, // 边框厚度
            'circle-stroke-color': [
                'match', ['get', 'TYPE'],
                'Child Care ', '#EA345C',
                'Community Center', '#AC4BEA',
                'Senior Center', '#F3C81F',
                'Health Clinic', '#4064A3',
                'Vacant', '#969696',                                 
                'Other', '#888888',
                'Child Care - Early Learn', '#EF788E',
                'Religious Services', '#77A0DB',
                '#CCCCCC' // 默认颜色
            ],
            'circle-color': 'transparent', // 让内部透明
        }
    });
    
    // **第二层：内圈（实心圆）**
    map.addLayer({
        'id': 'nycha-points-inner',
        'type': 'circle',
        'source': 'nycha',
        'paint': {
            'circle-radius': [
            'interpolate', ['exponential', 2], ['zoom'],
            10, 3,   // zoom 10 时，半径 3
            15, 8,   // zoom 15 时，半径 6
            20, 12   // zoom 20 时，半径 12
        ],
            'circle-color': [
                'match', ['get', 'TYPE'],
                'Child Care ', '#EA345C',
                'Community Center', '#AC4BEA',
                'Senior Center', '#F3C81F',
                'Health Clinic', '#4064A3',
                'Vacant', '#969696',                                 
                'Other', '#888888',
                'Child Care - Early Learn', '#EF788E',
                'Religious Services', '#77A0DB',
                '#CCCCCC' // 默认颜色
            ],
        }
    });
});

// Create the popup
map.on('click', 'Open Space Data', function (e) {
    let properties = e.features[0].properties;
    let area = e.features[0].properties.SHAPE_AREA || "No data";

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<p><b>Area:</b> ' + area + ' sq ft</p>')
        .addTo(map);
});

map.on('click', 'nycha-points-inner', function (e) {
    let properties = e.features[0].properties;
    let coordinates = e.features[0].geometry.coordinates;

    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
            <h3>${properties.TYPE}</h3>
            <p><b>Development Name:</b> ${properties["DEVELOPMENT NAME"] || 'No Name'}</p>
            <p><b>Address:</b> ${properties.ADDRESS || 'Unknown'}</p>
        `)
        .addTo(map);
});

// 鼠标悬停时改变指针样式
map.on('mouseenter', 'Open Space Data', function () {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'Open Space Data', function () {
    map.getCanvas().style.cursor = '';

 map.on('mouseenter', 'nycha-points-inner', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

 map.on('mouseleave', 'nycha-points-inner', function () {
     map.getCanvas().style.cursor = '';
    });
});


var toggleableLayerIds = ['MTA Station Data', 'Household Income Data'];


for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function(e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();

        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}
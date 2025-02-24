mapboxgl.accessToken = 'pk.eyJ1Ijoic2FsbHl4aWUwMSIsImEiOiJjbTZpOHNwbDkwNjQ0Mm1xMzc5YThrMGdiIn0.OXLCwLgEIO7lKMpqekNKlQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sallyxie01/cm6jjlhxc004m01s72knvccpy',
    center: [-98, 38.88],
    minZoom: 2,
    maxZoom: 8, 
    zoom: 3
});

// ✅ 设置缩放阈值
const zoomThreshold = 4;

map.on('load', () => {
    map.addSource('home_value_state', {
        'type': 'geojson',
        'data': 'data/home_value_state.geojson'
    });

    map.addSource('home_value_county', {
        'type': 'geojson',
        'data': 'data/home_value_county.geojson'
    });

    map.addLayer({
        'id': 'state-home-value',
        'source': 'home_value_state',
        'maxzoom': zoomThreshold,  // 在 zoomThreshold 以下显示
        'type': 'fill',
        'paint': {
        'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'median_home_value'],
        98800, '#F2F12D',  // 20% 
        123700, '#EED322',  // 40%
        157500, '#DA9C20',  // 60% 
        215800, '#B86B25',  // 80%
        1225900, '#723122'  // 100%
    ],

            'fill-opacity': 0.75
        }
    });

    map.addLayer({
        'id': 'county-home-value',
        'source': 'home_value_county',
        'minzoom': zoomThreshold, 
        'type': 'fill',
        'paint': {
        'fill-color': [
    'interpolate',
    ['linear'],
    ['get', 'median_home_value'],
    98800, '#F2F12D',  
    123700, '#EED322', 
    157500, '#DA9C20', 
    215800, '#B86B25', 
    1225900, '#723122'
],
            'fill-opacity': 0.75
        }
    });

    // ✅ 图例控制
    const stateLegendEl = document.getElementById('state-legend');
    const countyLegendEl = document.getElementById('county-legend');

    map.on('zoom', () => {
        if (map.getZoom() > zoomThreshold) {
            stateLegendEl.style.display = 'none';
            countyLegendEl.style.display = 'block';
        } else {
            stateLegendEl.style.display = 'block';
            countyLegendEl.style.display = 'none';
        }
    });

    const popup = new mapboxgl.Popup({
        closeButton: true,  
        closeOnClick: true  
    });

    map.on('click', ['state-home-value', 'county-home-value'], (e) => {
        const value = e.features[0].properties.median_home_value;

        popup.setLngLat(e.lngLat)
            .setHTML(`<strong>Median Home Value:</strong> $${value.toLocaleString()}`)
            .addTo(map);
    });
});

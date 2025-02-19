// 設置 Mapbox Token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FsbHl4aWUwMSIsImEiOiJjbTZpOHNwbDkwNjQ0Mm1xMzc5YThrMGdiIn0.OXLCwLgEIO7lKMpqekNKlQ';

// 共用地圖設定
const commonSettings = {
    zoom: 1.5,
    center: [0, 20],  // 設定全球視角
    style: 'mapbox://styles/sallyxie01/cm6jjlhxc004m01s72knvccpy'
};

// 創建三張地圖
const map1 = new mapboxgl.Map({ container: 'map1', projection: 'mercator', maxZoom: 4, minZoom: 1.5, ...commonSettings });
const map2 = new mapboxgl.Map({ container: 'map2', projection: 'lambertConformalConic', maxZoom: 4, minZoom: 1.5, ...commonSettings });
const map3 = new mapboxgl.Map({ container: 'map3', projection: 'equalEarth', maxZoom: 4, minZoom: 1.2, ...commonSettings });

// GeoJSON 數據路徑
const geojsonPath = 'data/country_level_data_updated.geojson';

// **Natural Breaks (Jenks) 分界點**
const jenksBreaks = [37, 189, 319, 476, 710, 1121];  // ✅ 修正

// 通用函數：在地圖上加載 `GeoJSON`
function addGeoJSONToMap(map, method) {
    map.on('load', function () {
        map.addSource(`waste-data-${method}`, {
            type: 'geojson',
            data: geojsonPath
        });

        let colorStops;

        if (method === "equal-intervals") {
            // **Equal Intervals（等距分類）**
            colorStops = [
                'interpolate', ['linear'], ['coalesce', ['get', 'waste_per_capita_kg_per_year'], 0],
                0, '#d3d3d3',  // 無數據：灰色
                200, '#f8d5cc',
                400, '#f4a582',
                600, '#d6604d',
                800, '#b2182b',
                1000, '#67001f'  
            ];
            
        } else if (method === "quantiles") {
            // **Quantiles（分位數分類）**
            colorStops = [
                'step', ['coalesce', ['get', 'waste_per_capita_kg_per_year'], 0],  
                '#d3d3d3', 1,  // 無數據：灰色
                '#f8d5cc', 200, 
                '#f4a582', 400, 
                '#d6604d', 600, 
                '#b2182b', 800, 
                '#67001f'
            ];

        } else if (method === "natural-breaks") {
            // **修正 `colorStops`**
            colorStops = [
                'step', ['coalesce', ['get', 'waste_per_capita_kg_per_year'], 0],  
                '#d3d3d3', jenksBreaks[0],  // 無數據顯示灰色
                '#f8d5cc', jenksBreaks[1],  // 最淺紅色
                '#f4a582', jenksBreaks[2],  // 橙色
                '#d6604d', jenksBreaks[3],  // 深橙
                '#b2182b', jenksBreaks[4],  // 紅色
                '#67001f', jenksBreaks[5],  // 深紅
                '#67001f'   // 確保最高範圍有顏色
            ];            
        }

        // 添加填充層
        map.addLayer({
            id: `waste-layer-${method}`,
            type: 'fill',
            source: `waste-data-${method}`,
            paint: {
                'fill-color': colorStops,
                'fill-opacity': 0.75
            }
        });

        // 添加邊界線
        map.addLayer({
            id: `waste-borders-${method}`,
            type: 'line',
            source: `waste-data-${method}`,
            paint: {
                'line-color': '#ffffff',
                'line-width': 1
            }
        });

        // 點擊顯示數據
        map.on('click', `waste-layer-${method}`, function (e) {
            const country = e.features[0].properties.ADMIN;  
            const wasteGenerated = e.features[0].properties.waste_per_capita_kg_per_year;
            const GDP = e.features[0].properties.gdp;

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>${country}</strong><br>Waste_per_capita_kg_per_year: ${wasteGenerated.toLocaleString()} kg </strong><br>GDP:${GDP.toLocaleString()} `)
                .addTo(map);
        });

        // 滑鼠懸停效果
        map.on('mouseenter', `waste-layer-${method}`, function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', `waste-layer-${method}`, function () {
            map.getCanvas().style.cursor = '';
        });
    });
}

// 為每張地圖加載不同的數據分類方式
addGeoJSONToMap(map1, "equal-intervals");  // Map1: Equal Intervals
addGeoJSONToMap(map2, "quantiles");  // Map2: Quantiles
addGeoJSONToMap(map3, "natural-breaks");  // Map3: Natural Breaks

// 當地圖載入時顯示對應的 legend
map1.on('load', function () { showLegend("map1"); });
map2.on('load', function () { showLegend("map2"); });
map3.on('load', function () { showLegend("map3"); });

import React, { useEffect, useRef, useState } from 'react';
import { getUnitColor } from '../utils/helpers'; 

// ✅ ต้องมีคำว่า export const ตรงนี้ครับ (ห้ามเป็น export default)
export const LeafletMap = ({ data, onSelectCase, onError }) => {
  const mapRef = useRef(null); 
  const mapInstanceRef = useRef(null); 
  const markersLayerRef = useRef(null); 
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadLeafletResources = async () => {
      // 1. Load CSS
      if (!document.querySelector('#leaflet-css')) { 
        const link = document.createElement('link'); 
        link.id = 'leaflet-css'; 
        link.rel = 'stylesheet'; 
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; 
        document.head.appendChild(link);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 2. Load JS
      if (!window.L) {
        if (!document.querySelector('#leaflet-js')) { 
            const script = document.createElement('script'); 
            script.id = 'leaflet-js'; 
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; 
            script.async = true; 
            document.head.appendChild(script); 
        }
        await new Promise((resolve, reject) => { 
            let count = 0;
            const checkL = () => { 
                if (window.L && typeof window.L.map === 'function') resolve(window.L); 
                else if (count > 100) reject(new Error('Timeout loading Leaflet')); 
                else { count++; setTimeout(checkL, 100); }
            }; 
            checkL(); 
        });
      }
      return window.L;
    };

    loadLeafletResources().then((L) => {
      if (!isMounted) return; 
      if (mapInstanceRef.current) return; 
      if (!mapRef.current) return;
      
      try { 
        const map = L.map(mapRef.current, { preferCanvas: true }).setView([13.7563, 100.5018], 6);
        mapInstanceRef.current = map; 
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
            attribution: '&copy; CARTO', maxZoom: 19
        }).addTo(map); 

        markersLayerRef.current = L.layerGroup().addTo(map);
        
        setTimeout(() => {
            map.invalidateSize();
            setIsMapReady(true);
        }, 500);

      } catch (err) { console.error(err); if (onError) onError(); }
    }).catch((err) => { console.error(err); if (isMounted && onError) onError(); }); 
    
    return () => { isMounted = false; };
  }, [onError]);
  
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.L || !markersLayerRef.current) return;
    
    const markersLayer = markersLayerRef.current;
    const L = window.L;

    markersLayer.clearLayers(); 

    const validPoints = data.filter(d => d.lat && d.long && !isNaN(parseFloat(d.lat)) && !isNaN(parseFloat(d.long)));
    const myRenderer = L.canvas({ padding: 0.5 });

    validPoints.forEach(item => {
      const lat = parseFloat(item.lat);
      const long = parseFloat(item.long);
      const color = getUnitColor(item.unit_kk);
      
      const marker = L.circleMarker([lat, long], {
        renderer: myRenderer,
        radius: 6,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.7
      });

      const popupContent = `
        <div style="color: #333; font-family: 'Sarabun', sans-serif; min-width: 150px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: ${color};">${item.topic}</div>
            <div style="font-size: 12px; margin-bottom: 2px;">กก.${item.unit_kk} ส.ทล.${item.unit_s_tl}</div>
            <div style="font-size: 12px; color: #666;">${item.date_capture}</div>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      marker.on('click', () => onSelectCase(item));
      markersLayer.addLayer(marker);
    });

    if (validPoints.length > 0) { 
        try { 
            const group = L.featureGroup(validPoints.map(p => L.marker([p.lat, p.long]))); 
            mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [50, 50] }); 
        } catch (e) { console.warn("FitBounds failed", e); } 
    }
  }, [data, onSelectCase, isMapReady]);

  return <div ref={mapRef} className="w-full h-full min-h-[50vh] sm:min-h-[500px] bg-slate-800 z-0 relative" />;
};
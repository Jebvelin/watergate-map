import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import gates from './gates.json';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});



function App() {
  const mapRef = useRef(null);
  const [province, setProvince] = useState('all');
  const [office, setOffice] = useState('all');
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const map = L.map('map').setView([14.0, 100.6], 6);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    updateMarkers('all');
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProvinces = Array.from(
  new Set(
    gates
      .filter(g => office === 'all' || g.office === office)
      .map(g => g.province)
  )
).sort();

  const updateMarkers = (selectedProvince = province, selectedOffice = office) => {
  markers.forEach(marker => mapRef.current.removeLayer(marker));

  const newMarkers = gates
    .filter(g => 
      (selectedOffice === 'all' || g.office === selectedOffice) &&
      (selectedProvince === 'all' || g.province === selectedProvince)
    )
    .map(g => {
      if (!g.lat || !g.lon) return null;
      return L.marker([g.lat, g.lon])
        .addTo(mapRef.current)
        .bindPopup(`
          <b>${g.name}</b><br>
          โครงการ: ${g.province}<br>
          แม่น้ำ: ${g.river}<br>
          <a href="https://www.google.com/maps?q=${g.lat},${g.lon}" target="_blank">
            🗺️ ดูใน Google Maps
          </a>
        `)
        .bindTooltip(g.name);
    }).filter(Boolean);

  setMarkers(newMarkers);
};



  const offices = Array.from(new Set(gates.map(g => g.office))).sort();

  return (
    <>
      <header>
        <h2>ระบบแสดงตำแหน่งประตูระบายน้ำในประเทศไทย</h2>
      </header>
      
      <div id="controls">
  <label htmlFor="officeSelect">เลือกสำนักชลประทาน: </label>
  <select
  id="officeSelect"
  onChange={(e) => {
    const selected = e.target.value;
    setOffice(selected);
    setProvince('all');
    updateMarkers('all', selected); 
  }}
  value={office}
>

    <option value="all">แสดงทั้งหมด</option>
    {offices.map(o => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
    <br></br>

  <label htmlFor="provinceSelect">เลือกโครงการ: </label>
  <select
  id="provinceSelect"
  onChange={(e) => {
    const selected = e.target.value;
    setProvince(selected);
    updateMarkers(selected, office); 
  }}
  value={province}
>

    <option value="all">แสดงทั้งหมด</option>
    {filteredProvinces.map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</div>
      <div id="map"></div>
    </>
  );
}

export default App;

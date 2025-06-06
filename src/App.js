import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import gates from './gates.json';
import officeProjects from './offices_projects.json';

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
  const [project, setProject] = useState('all');
  const [office, setOffice] = useState('all');
  const [markers, setMarkers] = useState([]);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const provinceToOffice = {
    'นนทบุรี' : 'คป.พระพิมล',
    'ปทุมธานี': 'คป.ปทุมธานี',
    'สมุทรสาคร': 'คป.สมุทรสาคร',
    'สระบุรี': 'คบ.รังสิตเหนือ',
    'พระนครศรีอยุธยา': 'คบ.รังสิตเหนือ',
    'ปทุมธานี': 'คบ.รังสิตเหนือ',
    'ปทุมธานี': 'คบ.รังสิตใต้',
    'ปทุมธานี': 'คบ.รังสิตใต้',
    
  };
  
  const getColorByOffice = (provName) => {
  for (const office of officeProjects) {
    for (const province of office.provinces) {
      if (province.name === provName) {
        const mainProject = province.projects?.[0];
        return mainProject?.color || '#cccccc';
      }
    }
  }
  return '#cccccc';
};

  const updateMarkers = (selectedProject = project, selectedOffice = office) => {
    if (!mapRef.current) return;
    markers.forEach(marker => mapRef.current.removeLayer(marker));

    const newMarkers = gates
      .filter(g =>
        (selectedOffice === 'all' || g.office === selectedOffice) &&
        (selectedProject === 'all' || g.project === selectedProject)
      )
      .map(g => {
        if (!g.lat || !g.lon) return null;
        return L.marker([g.lat, g.lon])
          .addTo(mapRef.current)
          .bindPopup(`
            <b>${g.name}</b><br>
            โครงการ: ${g.project}<br>
            แม่น้ำ: ${g.river}<br>
            <a href="https://www.google.com/maps?q=${g.lat},${g.lon}" target="_blank">
              🗘️ ดูใน Google Maps
            </a>
          `)
          .bindTooltip(g.name);
      }).filter(Boolean);

    setMarkers(newMarkers);
  };

  const offices = Array.from(new Set(gates.map(g => g.office))).sort();
  const filteredProjects = Array.from(
    new Set(gates.filter(g => office === 'all' || g.office === office).map(g => g.project))
  ).sort();

  useEffect(() => {
    const map = L.map('map').setView([14.0, 100.6], 6);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    fetch('/geojson/provinces.geojson')
      .then(res => res.json())
      .then(data => {
        L.geoJSON(data, {
          style: feature => {
            const provName = feature.properties.pro_th;
            return {
              color: '#000',
              weight: 1.5,
              fillOpacity: 0.3,
              fillColor: getColorByOffice(provName)
            };
          },
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(feature.properties.pro_th);
          }
        }).addTo(mapRef.current);
      });

    updateMarkers('all');
    return () => map.remove();
  }, []);

  return (
    <>
      <header>
        <h2>ระบบแสดงตำแหน่งประตูระบายน้ำในประเทศไทย</h2>
      </header>
      <div id="controls">
        <label>เลือกสำนักชลประทาน: </label>
        <button onClick={() => setShowOfficeModal(true)}>
          {office === 'all' ? 'แสดงทั้งหมด' : office}
        </button>
        <label>เลือกโครงการ: </label>
        <button onClick={() => setShowProjectModal(true)}>
          {project === 'all' ? 'แสดงทั้งหมด' : project}
        </button>
        <button
          style={{ marginLeft: '1rem' }}
          onClick={() => {
            setOffice('all');
            setProject('all');
            updateMarkers('all', 'all');
          }}
        >
          รีเซ็ต
        </button>

        {showOfficeModal && (
          <div className="modal-overlay" onClick={() => setShowOfficeModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>เลือกสำนักชลประทาน</h3>
              <ul className="modal-list">
                <li>
                  <button onClick={() => {
                    setOffice('all');
                    setProject('all');
                    updateMarkers('all', 'all');
                    setShowOfficeModal(false);
                  }}>แสดงทั้งหมด</button>
                </li>
                {offices.map(o => (
                  <li key={o}>
                    <button onClick={() => {
                      setOffice(o);
                      setProject('all');
                      updateMarkers('all', o);
                      setShowOfficeModal(false);
                    }}>{o}</button>
                  </li>
                ))}
              </ul>
              <button className="modal-close" onClick={() => setShowOfficeModal(false)}>ปิด</button>
            </div>
          </div>
        )}

        {showProjectModal && (
          <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>เลือกโครงการ</h3>
              <ul className="modal-list">
                <li>
                  <button onClick={() => {
                    setProject('all');
                    updateMarkers('all', office);
                    setShowProjectModal(false);
                  }}>แสดงทั้งหมด</button>
                </li>
                {filteredProjects.map(p => (
                  <li key={p}>
                    <button onClick={() => {
                      setProject(p);
                      updateMarkers(p, office);
                      setShowProjectModal(false);
                    }}>{p}</button>
                  </li>
                ))}
              </ul>
              <button className="modal-close" onClick={() => setShowProjectModal(false)}>ปิด</button>
            </div>
          </div>
        )}
      </div>
      <div id="map"></div>
    </>
  );
}

export default App;

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Circle } from 'react-leaflet';
import API_BASE from '../config';

const MapExplorer = () => {
  const [allFacilities, setAllFacilities] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  
  // Animation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [discoveredFacilities, setDiscoveredFacilities] = useState([]);
  const [drawnMatches, setDrawnMatches] = useState([]);
  const [aiStatus, setAiStatus] = useState("System Ready");
  const [scanDone, setScanDone] = useState(false);
  
  const intervalsRef = useRef({ radar: null, match: null });

  useEffect(() => {
    return () => {
      if (intervalsRef.current.radar) clearInterval(intervalsRef.current.radar);
      if (intervalsRef.current.match) clearInterval(intervalsRef.current.match);
    };
  }, []);
  
  const mapCenter = [20.5937, 78.9629];

  const generateMockFacilities = (count) => {
    const mocks = [];
    for (let i = 0; i < count; i++) {
      const isSource = i % 2 === 0;
      mocks.push({
        id: `mock-${i}`,
        name: `Simulated ${isSource ? 'Source' : 'Sink'} ${i}`,
        type: isSource ? 'SOURCE' : 'SINK',
        category: isSource ? 'Regional Hub' : 'Industrial Complex',
        capacity_mw: Math.floor(Math.random() * 50) + 10,
        location: {
          lat: mapCenter[0] + (Math.random() * 12 - 6),
          lng: mapCenter[1] + (Math.random() * 12 - 6)
        }
      });
    }
    return mocks;
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/facilities`)
      .then(res => res.json())
      .then(json => {
         const realData = json.facilities || [];
         setAllFacilities(realData);
      })
      .catch(() => setAllFacilities([]));

    fetch(`${API_BASE}/api/matches`)
      .then(res => res.json())
      .then(json => {
        // Filter out any matches missing location data to prevent crashes
        const validMatches = (json.matches || []).filter(m => 
          m && m.source_location && m.sink_location &&
          typeof m.source_location.lat === 'number' && typeof m.source_location.lng === 'number' &&
          typeof m.sink_location.lat === 'number' && typeof m.sink_location.lng === 'number'
        );
        setAllMatches(validMatches);
      })
      .catch(() => setAllMatches([]));
  }, []);

  const initiateScanner = () => {
    setIsScanning(true);
    setScanDone(false);
    setDiscoveredFacilities([]);
    setDrawnMatches([]);
    setScanProgress(0);
    setAiStatus("Pinging Industrial Heat Sources...");

    let progress = 0;
    
    if (intervalsRef.current.radar) clearInterval(intervalsRef.current.radar);
    
    intervalsRef.current.radar = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      
      const currentlyDiscovered = allFacilities.filter(f => {
        const distFromCenter = Math.abs(f.location.lat - mapCenter[0]) + Math.abs(f.location.lng - mapCenter[1]);
        return distFromCenter < (progress / 100) * 30;
      });
      
      setDiscoveredFacilities(currentlyDiscovered);

      if (progress > 30) setAiStatus("Cross-referencing Sinks...");
      if (progress > 60) setAiStatus("AI Engine evaluating Economic Viability...");

      if (progress >= 100) {
        clearInterval(intervalsRef.current.radar);
        intervalsRef.current.radar = null;
        simulateAIMatchAnalysis();
      }
    }, 200);
  };

  const simulateAIMatchAnalysis = () => {
    setAiStatus("Drawing Optimal Viability Paths...");
    
    let matchesDrawn = 0;
    if (intervalsRef.current.match) clearInterval(intervalsRef.current.match);
    
    intervalsRef.current.match = setInterval(() => {
      if (matchesDrawn < allMatches.length) {
        const nextMatch = allMatches[matchesDrawn];
        if (nextMatch) {
          setDrawnMatches(prev => [...prev, nextMatch]);
        }
        matchesDrawn++;
      } else {
        clearInterval(intervalsRef.current.match);
        intervalsRef.current.match = null;
        setIsScanning(false);
        setScanDone(true);
        setAiStatus(`AI Scan Complete: ${allMatches.length} Viable Connections. Redirecting...`);
        setTimeout(() => {
          window.location.href = '/matches';
        }, 2000);
      }
    }, 150);
  };

  // Determine which facilities to show
  const showDiscovered = isScanning || scanDone;
  const facilitiesToShow = showDiscovered ? discoveredFacilities : allFacilities;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 72px)', position: 'relative' }}>
      
      {/* Left panel overlay */}
      <div className="glass-panel" style={{
        position: 'absolute', top: '24px', left: '24px', zIndex: 1000,
        width: '320px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <h2>Heat Mapping</h2>
        
        <button 
          onClick={initiateScanner}
          disabled={isScanning}
          style={{ 
            padding: '12px', 
            background: isScanning ? 'var(--color-surface-hover)' : 'var(--color-primary)', 
            color: 'white', 
            borderRadius: '6px',
            fontWeight: 'bold',
            boxShadow: isScanning ? 'none' : '0 0 15px var(--color-primary-glow)',
            transition: 'all 0.3s'
          }}
        >
          {isScanning ? 'AI Scan in Progress...' : '🔍 Initiate ML Discovery'}
        </button>

        <div style={{ 
          background: 'rgba(0,0,0,0.5)', 
          padding: '12px', 
          borderRadius: '4px',
          borderLeft: `4px solid ${scanDone ? '#2ECC71' : 'var(--color-primary)'}`,
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: scanDone ? '#2ECC71' : 'var(--color-primary-dim)'
        }}>
          &gt; {aiStatus}
        </div>

        {/* Progress bar during scan */}
        {isScanning && (
          <div style={{ width: '100%', height: '4px', background: 'var(--color-surface)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${scanProgress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s', borderRadius: '2px' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '15px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#06B6D4' }}>
              {facilitiesToShow.filter(f => f.type === 'SOURCE').length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Sources</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>
              {facilitiesToShow.filter(f => f.type === 'SINK').length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Sinks</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '15px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-match-high)' }}>{drawnMatches.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Profitable Matches Identified</div>
        </div>

        {/* Legend */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06B6D4' }} /> Heat Source
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} /> Heat Sink
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '3px', background: '#8B5CF6' }} /> Match Connection
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          
          {/* Animated Radar Circle */}
          {isScanning && scanProgress < 100 && (
            <Circle 
              center={mapCenter} 
              pathOptions={{ fillColor: '#8B5CF6', color: '#8B5CF6', fillOpacity: 0.1, weight: 1 }} 
              radius={scanProgress * 25000}
            />
          )}

          {/* Facilities — dim when waiting, bright when discovered */}
          {!showDiscovered && allFacilities.map(f => (
            <CircleMarker 
              key={`base-${f.id}`} 
              center={[f.location.lat, f.location.lng]}
              radius={f.type === 'SOURCE' ? 8 : 6}
              pathOptions={{
                color: f.type === 'SOURCE' ? '#06B6D4' : '#10B981',
                fillColor: f.type === 'SOURCE' ? '#06B6D4' : '#10B981',
                fillOpacity: 0.2,
                weight: 1,
                opacity: 0.3
              }}
            >
              <Popup>
                <strong style={{ color: '#333' }}>{f.name}</strong><br/>
                <span style={{ color: '#666' }}>{f.category} ({f.capacity_mw} MW)</span>
              </Popup>
            </CircleMarker>
          ))}
          
          {/* Actively Discovered / Lit Up Facilities */}
          {showDiscovered && discoveredFacilities.map(f => (
            <CircleMarker 
              key={`disc-${f.id}`} 
              center={[f.location.lat, f.location.lng]}
              radius={f.type === 'SOURCE' ? 8 : 6}
              pathOptions={{
                color: f.type === 'SOURCE' ? '#06B6D4' : '#10B981',
                fillColor: f.type === 'SOURCE' ? '#06B6D4' : '#10B981',
                fillOpacity: 0.9,
                weight: 2
              }}
            >
              <Popup>
                <strong style={{ color: '#333' }}>{f.name}</strong><br/>
                <span style={{ color: '#666' }}>{f.category} ({f.capacity_mw} MW)</span>
              </Popup>
            </CircleMarker>
          ))}

          {/* AI Drawn Matches — safety check on location data */}
          {drawnMatches.map((m, idx) => {
            if (!m || !m.source_location || !m.sink_location) return null;
            return (
              <Polyline 
                key={m.id || `match-${idx}`}
                className="animate-draw-line"
                positions={[
                  [m.source_location.lat, m.source_location.lng],
                  [m.sink_location.lat, m.sink_location.lng]
                ]}
                pathOptions={{
                  color: m.composite_score > 90 ? '#10B981' : (m.composite_score > 70 ? '#06B6D4' : '#8B5CF6'),
                  weight: 3,
                  opacity: 0.9
                }}
              >
                <Popup>
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: '#333' }}>{m.source_name}</strong>
                    <span style={{ color: '#999' }}> → </span>
                    <strong style={{ color: '#333' }}>{m.sink_name}</strong><br/>
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>Score: {m.composite_score} | {m.payback_years} yr payback</span>
                  </div>
                </Popup>
              </Polyline>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapExplorer;

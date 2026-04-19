import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API_BASE from '../config';

const MatchDetail = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/matches/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Match not found');
        return res.json();
      })
      .then(data => setMatch(data))
      .catch(() => {
        // Fallback: fetch all matches and find by id (in case single-match endpoint fails)
        fetch(`${API_BASE}/api/matches`)
          .then(res => res.json())
          .then(json => {
            const m = json.matches.find(x => x.id === id);
            if (m) setMatch(m);
            else setError('Match not found');
          })
          .catch(() => setError('Failed to connect to API'));
      });
  }, [id]);

  if (error) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--color-match-low)' }}>{error}</div>;
  if (!match) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading match details...</div>;

  const viabilityLabel = match.composite_score >= 80 ? 'EXCELLENT VIABILITY' :
    match.composite_score >= 60 ? 'GOOD VIABILITY' : 'MODERATE VIABILITY';
  const viabilityColor = match.composite_score >= 80 ? '#2ECC71' :
    match.composite_score >= 60 ? '#F39C12' : '#E74C3C';

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          <Link to="/matches">← Back to Matches</Link>  /  {match.source_name} → {match.sink_name}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '50%', 
            background: 'rgba(99, 102, 241, 0.1)', border: '2px solid var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 800, color: 'white',
            boxShadow: '0 0 30px var(--color-primary-glow)'
          }}>
            {match.composite_score.toFixed(1)}
          </div>
          <div>
            <div style={{ display: 'inline-block', background: `${viabilityColor}33`, color: viabilityColor, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px' }}>
              {viabilityLabel}
            </div>
            <h1 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'var(--color-heat)' }}>{match.source_name}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '24px' }}>→</span>
              <span style={{ color: 'var(--color-cold)' }}>{match.sink_name}</span>
            </h1>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Scores Card */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '350px', padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>Score Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(match.scores).map(([key, val]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', textTransform: 'capitalize' }}>
                  <span>{key}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: val > 80 ? '#2ECC71' : (val > 60 ? '#F39C12' : '#E74C3C'), borderRadius: '4px', transition: 'width 0.6s ease' }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Distance & Temperature Details */}
          <div style={{ marginTop: '24px', padding: '20px', background: 'var(--color-surface)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Engineering Specifications</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ color: 'white', fontWeight: 600 }}>Routing Distance</div><div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Geographic span + 35% routing overhead</div></div> 
                <strong style={{ fontSize: '16px' }}>{match.distance_km} km</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ color: 'white', fontWeight: 600 }}>Delivery Temp.</div><div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Heat remaining after transit losses</div></div> 
                <strong style={{ fontSize: '16px' }}>{match.effective_temp_c}°C</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ color: 'white', fontWeight: 600 }}>Thermal Loss</div><div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Energy dissipated naturally in pipes</div></div> 
                <strong style={{ fontSize: '16px' }}>{match.thermal_loss_pct}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ color: 'white', fontWeight: 600 }}>Net Energy Transfer</div><div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Usable heat delivered continuously</div></div> 
                <strong style={{ fontSize: '16px' }}>{match.transfer_mw} MW</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Financials & Impact */}
        <div style={{ flex: 2, minWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '32px' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>ROI & Financial Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Annual Savings</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Reduced fossil fuel burn costs</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#2ECC71' }}>${(match.annual_savings_usd / 1000000).toFixed(2)}M</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Total CAPEX</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total infrastructure investment</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>${(match.total_investment_usd / 1000000).toFixed(2)}M</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Payback Period</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Time to break even (at 8% rate)</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{match.payback_years.toFixed(1)} <span style={{fontSize: '14px', fontWeight: 400}}>Years</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Energy Captured</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Reused waste per year</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{match.annual_savings_mwh.toLocaleString()} <span style={{fontSize: '14px', fontWeight: 400}}>MWh/yr</span></div>
                </div>
              </div>

              {/* Infrastructure Breakdown */}
              {match.infrastructure_breakdown && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', fontSize: '13px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>CAPEX Breakdown</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Insulated Piping Grid</span>
                    <span style={{ fontWeight: 600 }}>${(match.infrastructure_breakdown.pipe_cost / 1000000).toFixed(2)}M</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Heat Recovery Exchangers</span>
                    <span style={{ fontWeight: 600 }}>${(match.infrastructure_breakdown.heat_exchanger_cost / 1000).toFixed(0)}K</span>
                  </div>
                  {match.infrastructure_breakdown.storage_cost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Thermal Battery Storage</span>
                      <span style={{ fontWeight: 600 }}>${(match.infrastructure_breakdown.storage_cost / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ flex: 1, padding: '32px' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>Environmental Impact</h3>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Annual CO₂ Reduction</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-primary-dim)' }}>{match.co2_reduction_tonnes.toLocaleString()} <span style={{fontSize: '16px', fontWeight: 400}}>tonnes</span></div>
              </div>
              <div style={{ fontSize: '14px', background: 'var(--color-surface-hover)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                🚗 Equivalent to removing <strong>{Math.round(match.co2_reduction_tonnes * 0.21)} cars</strong> from the road.
              </div>
              <div style={{ fontSize: '14px', background: 'var(--color-surface-hover)', padding: '12px', borderRadius: '8px' }}>
                🌲 Or growing <strong>{Math.round(match.co2_reduction_tonnes * 16.5)} trees</strong> for 10 years.
              </div>
              {match.storage_recommended && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', borderRadius: '8px', fontSize: '13px', color: '#F39C12' }}>
                  ⚡ Thermal storage recommended for this match due to seasonal mismatch
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button onClick={() => alert("Connection Request Sent to Facility Manager.")} style={{ background: 'var(--color-primary)', border: 'none', color: 'white', padding: '12px 32px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', width: '100%', fontSize: '16px' }}>Initiate Formal Engineering Connection Request &rarr;</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MatchDetail;

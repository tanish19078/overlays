import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../config';

const MatchesList = () => {
  const [allMatches, setAllMatches] = useState([]);
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/matches`)
      .then(res => res.json())
      .then(json => setAllMatches(json.matches || []))
      .catch(() => setError('Failed to connect to API. Is the server running?'));
  }, []);

  // Client-side filter & sort
  const filtered = allMatches
    .filter(m => m.composite_score >= minScore)
    .sort((a, b) => {
      if (sortBy === 'savings') return b.annual_savings_usd - a.annual_savings_usd;
      if (sortBy === 'distance') return a.distance_km - b.distance_km;
      if (sortBy === 'payback') return a.payback_years - b.payback_years;
      return b.composite_score - a.composite_score; // default: score
    });

  if (error) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--color-match-low)' }}>{error}</div>;

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Heat Sharing Matches</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} viable matches {minScore > 0 ? `(score ≥ ${minScore})` : 'discovered across facilities'}</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <select 
            value={minScore} 
            onChange={e => setMinScore(Number(e.target.value))}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'white', padding: '8px 16px', borderRadius: '6px' }}
          >
            <option value={0}>Min Score: All</option>
            <option value={90}>Min Score: 90+</option>
            <option value={70}>Min Score: 70+</option>
            <option value={50}>Min Score: 50+</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'white', padding: '8px 16px', borderRadius: '6px' }}
          >
            <option value="score">Sort By: Score</option>
            <option value="savings">Sort By: Savings</option>
            <option value="distance">Sort By: Distance</option>
            <option value="payback">Sort By: Payback</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {allMatches.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', color: 'var(--color-text-muted)' }}>No matches found for the current filters.</div>
        ) : filtered.map((m) => (
          <div key={m.id} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            
            {/* Score Badge */}
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: m.composite_score > 90 ? 'rgba(46, 204, 113, 0.1)' : m.composite_score > 70 ? 'rgba(99, 102, 241, 0.1)' : 'rgba(243, 156, 18, 0.1)',
              border: `2px solid ${m.composite_score > 90 ? 'var(--color-match-high)' : m.composite_score > 70 ? 'var(--color-primary)' : '#F39C12'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: '24px', fontWeight: 800, color: m.composite_score > 90 ? 'var(--color-match-high)' : 'white'
            }}>
              {m.composite_score.toFixed(1)}
            </div>

            {/* Main Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-heat)' }}>{m.source_name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                <span style={{ color: 'var(--color-cold)' }}>{m.sink_name}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>📏 {m.distance_km} km apart</span>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>🔄 {m.seasonal_complementarity} overlap</span>
                {m.storage_recommended && <span style={{ background: 'rgba(243,156,18,0.15)', padding: '4px 8px', borderRadius: '4px', color: '#F39C12' }}>⚡ Storage recommended</span>}
              </div>

              {/* Metrics Row */}
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Transfer</div>
                  <div style={{ fontWeight: 600 }}>{m.transfer_mw.toFixed(1)} MW</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Savings</div>
                  <div style={{ fontWeight: 600, color: '#2ECC71' }}>${(m.annual_savings_usd / 1000000).toFixed(1)}M/yr</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>CO₂ Reduction</div>
                  <div style={{ fontWeight: 600 }}>{m.co2_reduction_tonnes.toLocaleString()} t/yr</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Payback</div>
                  <div style={{ fontWeight: 600 }}>{m.payback_years.toFixed(1)} yrs</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <Link to={`/matches/${m.id}`} style={{
                display: 'block', background: 'var(--color-primary)', color: 'white', border: '1px solid var(--color-primary-dim)',
                padding: '12px 24px', borderRadius: '6px', fontWeight: 600, transition: 'all 0.2s',
                textAlign: 'center', textDecoration: 'none'
              }}>
                Tap to unlock best match & more &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchesList;

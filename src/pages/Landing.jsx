import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../config';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, subtitle }) => (
  <div className="glass-panel" style={{ padding: '24px', flex: 1, minWidth: '220px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '10px', 
        background: 'var(--color-surface-hover)', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', fontSize: '20px' 
      }}>
        {icon}
      </div>
      <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>
    </div>
    <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }} className={title.includes('CO') || title.includes('Savings') ? 'text-gradient' : ''}>
      {value}
    </div>
    <div style={{ color: 'var(--color-primary-dim)', fontSize: '13px' }}>{subtitle}</div>
  </div>
);

const Landing = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/summary`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {}); // Silently fail — show fallback
  }, []);

  const facilityCount = stats ? stats.overview.total_facilities : '35+';
  const matchCount = stats ? stats.matching.total_viable_matches : '—';
  const savingsM = stats ? `$${(stats.impact.total_annual_savings_usd / 1000000).toFixed(0)}M` : '—';
  const co2K = stats ? `${Math.round(stats.impact.total_co2_reduction_tonnes / 1000)}K` : '—';
  const sourceCount = stats ? stats.overview.total_sources : '15';
  const sinkCount = stats ? stats.overview.total_sinks : '20';

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '100px 0', 
        position: 'relative',
        background: 'radial-gradient(circle at 50% 0%, var(--color-surface-hover) 0%, transparent 60%)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '900px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ 
              display: 'inline-block', padding: '6px 16px', background: 'var(--color-surface-hover)', 
              borderRadius: '20px', fontSize: '14px', fontWeight: 600, color: 'var(--color-primary-dim)',
              border: '1px solid var(--color-border)', marginBottom: '32px'
            }}>
              🔥 The #1 Industrial Heat Marketplace
            </div>
            
            <h1 style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-2px' }}>
              Turn Every Factory's Exhaust Into a <span className="text-gradient">Neighbor's Resource</span>
            </h1>
            
            <p style={{ fontSize: '20px', color: 'var(--color-text-secondary)', marginBottom: '48px', lineHeight: 1.6, maxWidth: '800px', margin: '0 auto 48px' }}>
              AI-powered proximity matching connects industrial waste heat sources with nearby thermal energy consumers — saving millions in energy costs and thousands of tonnes of CO₂.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <Link to="/map" style={{
                background: 'linear-gradient(135deg, var(--color-primary), #8083ff)',
                color: 'white', padding: '16px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 600,
                boxShadow: '0 0 30px var(--color-primary-glow)'
              }}>
                Explore the Map
              </Link>
              <Link to="/register" style={{
                background: 'transparent', border: '1px solid var(--color-border-focus)',
                color: 'var(--color-primary-dim)', padding: '16px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 600,
              }}>
                Register Your Facility
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <StatCard title="Facilities" value={facilityCount} icon="🏭" subtitle={`${sourceCount} Sources • ${sinkCount} Sinks`} />
            <StatCard title="Viable Matches" value={matchCount} icon="🔗" subtitle="AI-computed pairings" />
            <StatCard title="Annual Savings" value={savingsM} icon="💰" subtitle="Estimated potential" />
            <StatCard title="CO₂ Reduced" value={co2K} icon="🌍" subtitle="Tonnes per year" />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '36px', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>How OverLays Works</h2>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { step: 1, title: 'Register', desc: "Upload your facility's heat profile or demand curve.", icon: '📝' },
              { step: 2, title: 'Match', desc: "Our ML algorithm finds compatible partners by distance, temperature and grade.", icon: '🤖' },
              { step: 3, title: 'Analyze', desc: "Review NPV, payback period, and CO₂ savings projections.", icon: '📊' },
              { step: 4, title: 'Connect', desc: "Start sharing waste heat and drastically cut energy bills.", icon: '🤝' }
            ].map(s => (
              <div key={s.step} className="glass-panel" style={{ flex: 1, minWidth: '250px', padding: '32px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
                <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--color-surface-hover)', marginBottom: '16px', lineHeight: 1 }}>
                  0{s.step}
                </div>
                <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>{s.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

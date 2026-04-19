import React, { useEffect, useState } from 'react';
import API_BASE from '../config';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend);

const StatCard = ({ title, value, icon, subtitle }) => (
  <div className="glass-panel" style={{ padding: '24px', flex: 1, minWidth: '220px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
    </div>
    <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>{value}</div>
    <div style={{ color: 'var(--color-primary-dim)', fontSize: '13px' }}>{subtitle}</div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [topMatches, setTopMatches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/analytics/summary`).then(r => r.json()),
      fetch(`${API_BASE}/api/matches/top?n=5`).then(r => r.json()),
      fetch(`${API_BASE}/api/analytics/regional`).then(r => r.json()),
    ])
      .then(([analytics, matchData, regionalData]) => {
        setData(analytics);
        setTopMatches(matchData.matches || []);
        setRegions(regionalData.regions || []);
      })
      .catch(err => setError('Failed to connect to API. Make sure the server is running on port 3001.'));
  }, []);

  if (error) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--color-match-low)' }}>{error}</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading dashboard data...</div>;

  const lineData = {
    labels: data.seasonal.months,
    datasets: [
      {
        label: 'Supply (MW)',
        data: data.seasonal.monthly_supply_mw,
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Demand (MW)',
        data: data.seasonal.monthly_demand_mw,
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Real top matches data
  const barData = {
    labels: topMatches.map(m => `${m.source_name.split(' - ')[0].split(' ').slice(0,2).join(' ')} → ${m.sink_name.split(' - ')[0].split(' ').slice(0,2).join(' ')}`),
    datasets: [{
      label: 'Composite Score',
      data: topMatches.map(m => m.composite_score),
      backgroundColor: topMatches.map(m => 
        m.composite_score > 90 ? 'rgba(46, 204, 113, 0.8)' :
        m.composite_score > 70 ? 'rgba(99, 102, 241, 0.8)' :
        'rgba(243, 156, 18, 0.8)'
      ),
      borderRadius: 4
    }]
  };

  const donutData = {
    labels: Object.keys(data.breakdown.source_categories),
    datasets: [{
      data: Object.values(data.breakdown.source_categories).map(c => c.total_mw),
      backgroundColor: ['#FF6B35', '#F39C12', '#2ECC71', '#4ECDC4', '#6366F1', '#C0C1FF'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#F9FAFB' } }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' } }
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '32px' }}>Analytics Dashboard</h1>
      
      {/* Top Stats */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard title="Facilities Registered" value={data.overview.total_facilities} icon="🏢" subtitle={`${data.overview.total_sources} Sources / ${data.overview.total_sinks} Sinks`} />
        <StatCard title="Viable Matches" value={data.matching.total_viable_matches} icon="🔗" subtitle={`Avg Score: ${data.matching.avg_composite_score}`} />
        <StatCard title="Annual Savings" value={`$${(data.impact.total_annual_savings_usd / 1000000).toFixed(1)}M`} icon="💰" subtitle={`${data.impact.total_annual_savings_mwh.toLocaleString()} MWh/yr`} />
        <StatCard title="CO₂ Reduced" value={`${Math.round(data.impact.total_co2_reduction_tonnes / 1000)}K t`} icon="🌱" subtitle={`Avg payback: ${data.impact.avg_payback_years} yrs`} />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ flex: 2, minWidth: '400px', padding: '24px', height: '400px' }}>
          <h3 style={{ marginBottom: '24px' }}>Monthly Supply vs Demand</h3>
          <div style={{ height: '300px' }}><Line data={lineData} options={chartOptions} /></div>
        </div>
        <div className="glass-panel" style={{ flex: 1, minWidth: '300px', padding: '24px', height: '400px' }}>
          <h3 style={{ marginBottom: '24px' }}>Top Matches by Score</h3>
          <div style={{ height: '300px' }}><Bar data={barData} options={{...chartOptions, indexAxis: 'y'}} /></div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ flex: 1, minWidth: '300px', padding: '24px', height: '400px' }}>
          <h3 style={{ marginBottom: '24px' }}>Source Capacity by Category (MW)</h3>
          <div style={{ height: '300px' }}><Doughnut data={donutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: {color: '#fff'} } } }} /></div>
        </div>
        <div className="glass-panel" style={{ flex: 2, minWidth: '400px', padding: '24px', height: '400px', overflow: 'auto' }}>
          <h3 style={{ marginBottom: '24px' }}>Regional Heat Balance</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '12px' }}>Region</th>
                <th style={{ padding: '12px' }}>Facilities</th>
                <th style={{ padding: '12px' }}>Sources (MW)</th>
                <th style={{ padding: '12px' }}>Sinks (MW)</th>
                <th style={{ padding: '12px' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {regions.map(r => (
                <tr key={r.region} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600 }}>{r.region}</td>
                  <td style={{ padding: '16px 12px' }}>{r.facility_count}</td>
                  <td style={{ padding: '16px 12px', color: 'var(--color-heat)' }}>{r.sources_mw} MW</td>
                  <td style={{ padding: '16px 12px', color: 'var(--color-cold)' }}>{r.sinks_mw} MW</td>
                  <td style={{ padding: '16px 12px', color: r.balance > 0 ? '#2ECC71' : '#E74C3C', fontWeight: 600 }}>
                    {r.balance > 0 ? '+' : ''}{r.balance} MW
                  </td>
                </tr>
              ))}
              {regions.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No regional data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

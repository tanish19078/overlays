import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(10, 14, 26, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--color-border)',
      height: '72px',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-heat), var(--color-primary))',
            width: '32px', height: '32px', borderRadius: '8px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '18px'
          }}>
            O
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Over<span style={{ color: 'var(--color-primary)' }}>Lays</span>
          </span>
        </NavLink>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <NavLink to="/dashboard" style={({isActive}) => ({
            color: isActive ? 'var(--color-primary-dim)' : 'var(--color-text-secondary)',
            fontWeight: 500, fontSize: '14px', transition: 'color 0.2s'
          })}>Dashboard</NavLink>
          
          <NavLink to="/map" style={({isActive}) => ({
            color: isActive ? 'var(--color-primary-dim)' : 'var(--color-text-secondary)',
            fontWeight: 500, fontSize: '14px', transition: 'color 0.2s'
          })}>Explore Map</NavLink>
          
          <NavLink to="/matches" style={({isActive}) => ({
            color: isActive ? 'var(--color-primary-dim)' : 'var(--color-text-secondary)',
            fontWeight: 500, fontSize: '14px', transition: 'color 0.2s'
          })}>Matches</NavLink>
          
          <NavLink to="/register" style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            padding: '8px 16px',
            borderRadius: '6px',
            color: 'var(--color-text-primary)',
            fontWeight: 500, fontSize: '14px',
            transition: 'all 0.2s'
          }}>Register Facility</NavLink>

          <Link to="/map" style={{
            background: 'linear-gradient(135deg, var(--color-primary), #8083ff)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 0 15px var(--color-primary-glow)'
          }}>Get Started</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

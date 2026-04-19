import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';

const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'white', fontSize: '16px', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' };

const Registration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    type: 'SOURCE',
    category: 'factory',
    lat: '',
    lng: '',
    address: '',
    capacity_mw: 35,
    temp_min_c: 60,
    temp_max_c: 200,
    temp_avg_c: 130,
    grade: 'MID',
    availability: 0.9,
    has_heat_exchanger: false,
    pipe_ready: false,
    available_space_m2: 100,
    heating_cost_per_mwh: 50,
    organization: '',
    contact_email: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const gradeBtn = (grade, label) => (
    <button
      type="button"
      onClick={() => set('grade', grade)}
      style={{
        flex: 1, padding: '12px',
        background: form.grade === grade ? 'rgba(99, 102, 241, 0.2)' : 'var(--color-surface)',
        border: form.grade === grade ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        color: form.grade === grade ? 'var(--color-primary-dim)' : 'white',
        borderRadius: '6px', fontWeight: form.grade === grade ? 600 : 400, cursor: 'pointer'
      }}
    >{label}</button>
  );

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ...form,
        location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        capacity_mw: parseFloat(form.capacity_mw),
        temp_min_c: parseFloat(form.temp_min_c),
        temp_max_c: parseFloat(form.temp_max_c),
        temp_avg_c: parseFloat(form.temp_avg_c),
        availability: parseFloat(form.availability),
        available_space_m2: parseFloat(form.available_space_m2),
        heating_cost_per_mwh: parseFloat(form.heating_cost_per_mwh),
      };
      const res = await fetch(`${API_BASE}/api/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }
      setStep(5); // Success
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Basics', 'Thermal Profile', 'Infrastructure', 'Submit'];

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '1000px' }}>
      
      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isCompleted = step > s;
            const isCurrent = step === s;
            return (
              <React.Fragment key={s}>
                {i > 0 && <div style={{ height: '4px', width: '50px', background: isCompleted ? '#2ECC71' : 'var(--color-surface-hover)', borderRadius: '2px' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: isCompleted ? '#2ECC71' : isCurrent ? 'var(--color-primary)' : 'transparent',
                    border: !isCompleted && !isCurrent ? '2px solid var(--color-surface-hover)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCompleted ? '#000' : isCurrent ? '#fff' : 'var(--color-text-secondary)',
                    fontWeight: 800, fontSize: '14px'
                  }}>
                    {isCompleted ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '11px', color: isCurrent ? 'var(--color-primary-dim)' : 'var(--color-text-muted)' }}>{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Success State */}
      {step === 5 && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Facility Registered!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Your facility has been added to the matching pool. The AI engine will now compute viable heat-sharing pairs.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/matches')} style={{ background: 'var(--color-primary)', color: 'white', padding: '12px 32px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>View Matches</button>
            <button onClick={() => navigate('/map')} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'white', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Explore Map</button>
          </div>
        </div>
      )}

      {step < 5 && (
        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Main Form */}
          <div className="glass-panel" style={{ flex: 2, padding: '32px' }}>
            
            {/* Step 1: Basics */}
            {step === 1 && (<>
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Basic Information</h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Facility Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tata Steel Jamshedpur" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Type *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                    <option value="SOURCE">Heat Source (I produce waste heat)</option>
                    <option value="SINK">Heat Sink (I need thermal energy)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                    <option value="factory">Factory</option>
                    <option value="steel_plant">Steel Plant</option>
                    <option value="data_center">Data Center</option>
                    <option value="power_plant">Power Plant</option>
                    <option value="cement_factory">Cement Factory</option>
                    <option value="chemical_plant">Chemical Plant</option>
                    <option value="greenhouse">Greenhouse</option>
                    <option value="district_heating">District Heating</option>
                    <option value="cold_storage">Cold Storage</option>
                    <option value="food_processing">Food Processing</option>
                    <option value="residential">Residential</option>
                    <option value="industrial_preheating">Industrial Pre-Heating</option>
                    <option value="aquaculture">Aquaculture</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Latitude *</label>
                  <input type="number" step="0.0001" value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="e.g. 22.7876" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Longitude *</label>
                  <input type="number" step="0.0001" value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="e.g. 86.2030" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Organization</label>
                  <input value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="Company name" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Contact Email</label>
                  <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="you@company.com" style={inputStyle} />
                </div>
              </div>
            </>)}

            {/* Step 2: Thermal Profile */}
            {step === 2 && (<>
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Thermal Profile</h2>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Thermal Capacity (MW)</label>
                <input type="number" value={form.capacity_mw} onChange={e => set('capacity_mw', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Min Temp (°C)</label>
                  <input type="number" value={form.temp_min_c} onChange={e => set('temp_min_c', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Avg Temp (°C)</label>
                  <input type="number" value={form.temp_avg_c} onChange={e => set('temp_avg_c', e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Max Temp (°C)</label>
                  <input type="number" value={form.temp_max_c} onChange={e => set('temp_max_c', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Heat Grade</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {gradeBtn('LOW', 'LOW (<80°C)')}
                  {gradeBtn('MID', 'MID (80-250°C)')}
                  {gradeBtn('HIGH', 'HIGH (>250°C)')}
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Availability (0-1)</label>
                <input type="number" step="0.01" min="0" max="1" value={form.availability} onChange={e => set('availability', e.target.value)} style={inputStyle} />
              </div>
              {form.type === 'SINK' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Heating Cost ($/MWh)</label>
                  <input type="number" value={form.heating_cost_per_mwh} onChange={e => set('heating_cost_per_mwh', e.target.value)} style={inputStyle} />
                </div>
              )}
            </>)}

            {/* Step 3: Infrastructure */}
            {step === 3 && (<>
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Infrastructure Readiness</h2>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: form.has_heat_exchanger ? 'rgba(99,102,241,0.15)' : 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.has_heat_exchanger} onChange={e => set('has_heat_exchanger', e.target.checked)} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Heat Exchanger</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Existing HX installed</div>
                  </div>
                </label>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: form.pipe_ready ? 'rgba(99,102,241,0.15)' : 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.pipe_ready} onChange={e => set('pipe_ready', e.target.checked)} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Pipe Ready</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Connected to pipe network</div>
                  </div>
                </label>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Available Space (m²)</label>
                <input type="number" value={form.available_space_m2} onChange={e => set('available_space_m2', e.target.value)} style={inputStyle} />
              </div>
            </>)}

            {/* Step 4: Review & Submit */}
            {step === 4 && (<>
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Review & Submit</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Name:</span> <strong>{form.name || '—'}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Type:</span> <strong>{form.type}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Category:</span> <strong>{form.category}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Location:</span> <strong>{form.lat}, {form.lng}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Capacity:</span> <strong>{form.capacity_mw} MW</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Grade:</span> <strong>{form.grade}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Temp Range:</span> <strong>{form.temp_min_c}–{form.temp_max_c}°C</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Availability:</span> <strong>{(form.availability * 100).toFixed(0)}%</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Heat Exchanger:</span> <strong>{form.has_heat_exchanger ? '✓' : '✗'}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Pipe Ready:</span> <strong>{form.pipe_ready ? '✓' : '✗'}</strong></div>
              </div>
              {submitError && <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(231,76,60,0.15)', borderRadius: '8px', color: '#E74C3C', fontSize: '14px' }}>❌ {submitError}</div>}
            </>)}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px' }}>
              <button
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                style={{ background: 'transparent', border: '1px solid var(--color-border)', color: step === 1 ? 'var(--color-text-muted)' : 'white', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, cursor: step === 1 ? 'default' : 'pointer', opacity: step === 1 ? 0.5 : 1 }}
              >Back</button>
              {step < 4 ? (
                <button onClick={() => setStep(s => s + 1)} style={{ background: 'var(--color-primary)', border: 'none', color: 'white', padding: '12px 32px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Continue</button>
              ) : (
                <button onClick={submit} disabled={submitting} style={{ background: '#2ECC71', border: 'none', color: '#000', padding: '12px 32px', borderRadius: '6px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer' }}>
                  {submitting ? 'Registering...' : '🚀 Register Facility'}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div style={{ flex: 1 }}>
            <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
              <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>Registration Summary</h3>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Facility Name</div>
                <div style={{ fontWeight: 600 }}>{form.name || 'Not yet entered'}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Type</div>
                <div style={{ display: 'inline-block', background: form.type === 'SOURCE' ? 'var(--color-heat)' : 'var(--color-cold)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                  {form.type === 'SOURCE' ? 'HEAT SOURCE' : 'HEAT SINK'}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Capacity</div>
                <div style={{ fontWeight: 600 }}>{form.capacity_mw} MW</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Location</div>
                <div style={{ fontWeight: 600 }}>{form.lat && form.lng ? `${form.lat}, ${form.lng}` : 'Not set'}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Grade</div>
                <div style={{ fontWeight: 600 }}>{form.grade} ({form.grade === 'LOW' ? '<80°C' : form.grade === 'MID' ? '80-250°C' : '>250°C'})</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registration;

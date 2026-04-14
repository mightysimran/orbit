import React from 'react';

export default function Navbar() {
  return (
    <div style={styles.navbar}>
      <h2 style={styles.title}>Dashboard</h2>
      <div style={styles.profile}>
        <span style={styles.badge}>Admin Mode</span>
        <div style={styles.avatar}>A</div>
      </div>
    </div>
  );
}

const styles = {
  navbar: { height: '70px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', marginLeft: '250px' },
  title: { margin: 0, fontSize: '20px', color: '#0F172A' },
  profile: { display: 'flex', alignItems: 'center', gap: '15px' },
  badge: { backgroundColor: '#DBEAFE', color: '#1E3A8A', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1E3A8A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }
};
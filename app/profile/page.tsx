'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, userData, loading, logout, updateUserName, refreshUserData } = useAuth();
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userData?.displayName) {
      setNewName(userData.displayName);
    }
  }, [userData]);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="gradient-text" style={{ fontSize: '24px' }}>Loading...</div>
      </main>
    );
  }

  if (!user || !userData) {
    return null;
  }

  const handleUpdateName = async () => {
    if (newName.trim() && newName !== userData.displayName) {
      await updateUserName(newName.trim());
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTopUp = () => {
    if (userData.isAnonymous) {
      alert('Guest accounts cannot top-up. Please sign in with email or Google.');
      return;
    }
    window.open('https://trakteer.id/Aleocrophic/tip', '_blank');
  };

  return (
    <main style={{ minHeight: '100vh', padding: '100px 24px 60px' }}>
      {/* Back Button */}
      <div style={{ maxWidth: '800px', margin: '0 auto 24px' }}>
        <a href="/" style={{ color: '#9c4dcc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Back to Home
        </a>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #9c4dcc, #6a1b9a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              color: 'white'
            }}>
              {userData.displayName?.charAt(0).toUpperCase() || '?'}
            </div>

            <div style={{ flex: 1 }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(0,0,0,0.3)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                  />
                  <button onClick={handleUpdateName} className="btn btn-primary" style={{ padding: '10px 16px' }}>
                    Save
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                    {userData.displayName}
                    {userData.isAnonymous && <span style={{ fontSize: '14px', opacity: 0.6, marginLeft: '8px' }}>(Guest)</span>}
                  </h1>
                  <p style={{ opacity: 0.6 }}>{userData.email || 'Anonymous User'}</p>
                </>
              )}
            </div>

            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn btn-outline" style={{ padding: '10px 16px' }}>
                ✏️ Edit Name
              </button>
            )}
          </div>
        </div>

        {/* ACRON Balance */}
        <div className="card card-glow-gold" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ opacity: 0.6, marginBottom: '8px' }}>ACRON Balance</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="acron-coin" style={{ width: '48px', height: '48px', fontSize: '20px' }}>A</div>
                <span style={{ fontSize: '42px', fontWeight: 800 }} className="gradient-text">
                  {userData.acronBalance}
                </span>
              </div>
            </div>
            <button
              onClick={handleTopUp}
              className="btn btn-gold"
              disabled={userData.isAnonymous}
              style={{ opacity: userData.isAnonymous ? 0.5 : 1 }}
            >
              💳 Top Up ACRON
            </button>
          </div>
          {userData.isAnonymous && (
            <p style={{ marginTop: '12px', fontSize: '13px', opacity: 0.7, color: '#ffd54f' }}>
              ⚠️ Guest accounts cannot top-up. Sign in with email or Google to unlock.
            </p>
          )}
        </div>

        {/* Licenses */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>🔑 Your Licenses</h2>
          
          {userData.licenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</p>
              <p>No licenses yet</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Purchase PRO+ or ULTIMATE to get a license key</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userData.licenses.map((license, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: license.tier === 'ultimate' 
                      ? 'linear-gradient(135deg, rgba(255,213,79,0.1), rgba(200,164,21,0.1))'
                      : 'linear-gradient(135deg, rgba(156,77,204,0.1), rgba(106,27,154,0.1))',
                    border: `1px solid ${license.tier === 'ultimate' ? 'rgba(255,213,79,0.3)' : 'rgba(156,77,204,0.3)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: license.tier === 'ultimate' ? 'var(--gradient-gold)' : 'var(--gradient-purple)',
                      color: license.tier === 'ultimate' ? '#1a1a2e' : 'white'
                    }}>
                      {license.tierName}
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>
                      {new Date(license.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <code style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      letterSpacing: '1px'
                    }}>
                      {license.key}
                    </code>
                    <button
                      onClick={() => copyLicenseKey(license.key)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: copied === license.key ? '#4caf50' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {copied === license.key ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={handleLogout} className="btn btn-outline" style={{ color: '#f44336', borderColor: '#f44336' }}>
            🚪 Log Out
          </button>
        </div>
      </div>
    </main>
  );
}

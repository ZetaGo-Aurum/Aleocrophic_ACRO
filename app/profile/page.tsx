'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

export default function ProfilePage() {
  const { user, userData, loading, logout, updateUserName, updateUserPhoto, refreshUserData } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newName, setNewName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
  };

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="gradient-text loading-text">Loading...</div>
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
      showToast('✓ Name updated successfully!', 'success');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Convert to base64 for storage (simplified - in production use Firebase Storage)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateUserPhoto(base64);
        showToast('✓ Profile photo updated!', 'success');
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast('Failed to upload photo', 'error');
      setUploadingPhoto(false);
    }
  };

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    showToast('✓ License key copied!', 'success');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTopUp = () => {
    if (userData.isAnonymous) {
      showToast('Guest accounts cannot top-up. Please sign in with email or Google.', 'warning');
      return;
    }
    window.open('https://trakteer.id/Aleocrophic/tip', '_blank');
  };

  return (
    <main className="profile-page">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Back Button */}
      <div className="profile-header-nav">
        <a href="/" className="back-link">
          ← Back to Home
        </a>
      </div>

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-card profile-header-card">
          <div className="profile-header">
            {/* Avatar with upload */}
            <div 
              className={`profile-avatar-large ${uploadingPhoto ? 'uploading' : ''}`}
              onClick={handlePhotoClick}
              title="Click to change photo"
            >
              {userData.photoURL ? (
                <img src={userData.photoURL} alt="Profile" />
              ) : (
                <span>{userData.displayName?.charAt(0).toUpperCase() || '?'}</span>
              )}
              <div className="avatar-overlay">
                <span>📷</span>
              </div>
            </div>

            <div className="profile-info">
              {isEditing ? (
                <div className="name-edit-form">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="name-input"
                    placeholder="Your name"
                  />
                  <div className="name-edit-actions">
                    <button onClick={handleUpdateName} className="btn btn-primary btn-sm">
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn btn-ghost btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">
                    {userData.displayName}
                    {userData.isAnonymous && <span className="guest-badge">(Guest)</span>}
                  </h1>
                  <p className="profile-email">{userData.email || 'Anonymous User'}</p>
                </>
              )}
            </div>

            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn btn-outline btn-sm">
                ✏️ Edit Name
              </button>
            )}
          </div>
        </div>

        {/* ACRON Balance */}
        <div className="profile-card balance-card">
          <div className="balance-content">
            <div className="balance-info">
              <p className="balance-label">ACRON Balance</p>
              <div className="balance-display">
                <div className="acron-coin-large">A</div>
                <span className="balance-amount gradient-text">
                  {userData.acronBalance}
                </span>
              </div>
            </div>
            <button
              onClick={handleTopUp}
              className="btn btn-gold"
              disabled={userData.isAnonymous}
            >
              💳 Top Up ACRON
            </button>
          </div>
          {userData.isAnonymous && (
            <p className="balance-warning">
              ⚠️ Guest accounts cannot top-up. Sign in with email or Google to unlock.
            </p>
          )}
        </div>

        {/* Licenses */}
        <div className="profile-card">
          <h2 className="card-title">🔑 Your Licenses</h2>
          
          {userData.licenses.length === 0 ? (
            <div className="empty-licenses">
              <span className="empty-icon">🔒</span>
              <p>No licenses yet</p>
              <p className="empty-hint">Purchase PRO+ or ULTIMATE to get a license key</p>
            </div>
          ) : (
            <div className="licenses-list">
              {userData.licenses.map((license, i) => (
                <div
                  key={i}
                  className={`license-item ${license.tier}`}
                >
                  <div className="license-header">
                    <span className={`license-badge ${license.tier}`}>
                      {license.tierName}
                    </span>
                    <span className="license-date">
                      {new Date(license.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="license-key-row">
                    <code className="license-key">{license.key}</code>
                    <button
                      onClick={() => copyLicenseKey(license.key)}
                      className={`copy-btn ${copied === license.key ? 'copied' : ''}`}
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
        <div className="profile-actions">
          <button onClick={handleLogout} className="btn btn-danger">
            🚪 Log Out
          </button>
        </div>
      </div>
    </main>
  );
}

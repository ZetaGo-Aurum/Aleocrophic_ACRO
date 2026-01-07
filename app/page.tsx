'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const screenshots = [
    { src: '/screenshots/screenshot_blender.jpg', alt: 'Blender 3D Modeling', caption: 'Blender 4.3.2 - 3D Modeling & Animation' },
    { src: '/screenshots/screenshot_krita.jpg', alt: 'Krita Digital Painting', caption: 'Krita - Digital Painting' },
    { src: '/screenshots/screenshot_kdenlive.jpg', alt: 'Kdenlive Video Editor', caption: 'Kdenlive - Video Editing' },
    { src: '/screenshots/screenshot_lmms.jpg', alt: 'LMMS Music Production', caption: 'LMMS - Music Production' },
    { src: '/screenshots/screenshot_vscode.jpg', alt: 'VS Code IDE', caption: 'Visual Studio Code - Development' },
    { src: '/screenshots/screenshot_krita_splash.jpg', alt: 'Krita Splash', caption: 'Krita 25th Anniversary Edition' },
  ];

  const handleBuyClick = (tier: 'proplus' | 'ultimate') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (userData?.isAnonymous) {
      alert('Guest accounts cannot purchase. Please sign in with email or Google.');
      return;
    }
    const quantity = tier === 'proplus' ? 1 : 2;
    window.open(`https://trakteer.id/Aleocrophic/tip?quantity=${quantity}`, '_blank');
  };

  return (
    <main>
      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Navigation */}
      <nav className="nav-glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/acron.png" alt="ACRON" style={{ width: '32px', height: '32px' }} />
          <span style={{ fontSize: '22px', fontWeight: 800 }} className="gradient-text">ACRO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#gallery" className="nav-link">Gallery</a>
          
          {loading ? (
            <div style={{ width: '100px' }} />
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Balance */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '100px',
                background: 'rgba(255,213,79,0.1)',
                border: '1px solid rgba(255,213,79,0.3)'
              }}>
                <span style={{ fontSize: '14px' }}>🪙</span>
                <span style={{ fontWeight: 600, color: '#ffd54f' }}>{userData?.acronBalance || 0}</span>
              </div>
              <a href="/profile" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                👤 Profile
              </a>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-effect" />
        <div className="hero-glow" />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ACRON Coin */}
          <div className="animate-float" style={{ marginBottom: '32px' }}>
            <img 
              src="/acron.png" 
              alt="ACRON Coin" 
              style={{ 
                width: '120px', 
                height: '120px',
                filter: 'drop-shadow(0 0 40px rgba(255, 213, 79, 0.5))'
              }} 
            />
          </div>

          <h1 className="hero-title">
            <span className="gradient-text">ACRO PRO Edition</span>
          </h1>
          
          <p className="hero-subtitle">
            Premium Linux Distribution for Termux
          </p>
          
          <p className="hero-tagline">
            Ubuntu 25.10 • 1000+ Software • GPU Optimization • 24/7 Keep-Alive
          </p>

          <div className="hero-buttons">
            <a href="#pricing" className="btn btn-gold btn-lg">
              🚀 Get Started Free
            </a>
            <a href="https://github.com/ZetaGo-Aurum/modded-ubuntu" target="_blank" className="btn btn-outline btn-lg">
              ⭐ Star on GitHub
            </a>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">1000+</span>
              <span className="stat-label">Apps</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">v3.5</span>
              <span className="stat-label">Latest</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">4.5</span>
              <span className="stat-label">OpenGL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="container">
          <h2 className="section-title">Why Choose ACRO?</h2>
          <div className="features-grid">
            {[
              { icon: '💻', title: '1000+ Apps', desc: 'VSCode, Blender, GIMP, LibreOffice, and more pre-installed' },
              { icon: '🎮', title: 'GPU Gaming', desc: 'OpenGL 4.5+ with optimized rendering for games' },
              { icon: '🔊', title: 'Full Audio', desc: 'PulseAudio configured and working perfectly' },
              { icon: '📁', title: 'Storage Access', desc: 'Direct access to Android storage folders' },
              { icon: '🔋', title: '24/7 Mode', desc: 'Keep-alive feature prevents Termux from stopping' },
              { icon: '🎨', title: 'Modern UI', desc: 'Beautiful XFCE desktop with premium themes' },
            ].map((item, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{item.icon}</div>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="section-title">Choose Your Edition</h2>
          
          <div className="pricing-grid">
            {/* FREE Tier */}
            <div className="pricing-card tier-free">
              <div className="pricing-header">
                <span className="tier-badge tier-badge-free">FREE</span>
                <h3 className="tier-name">🆓 PRO</h3>
                <p className="tier-desc">Open Source</p>
                <div className="tier-price">
                  <span className="price-value">FREE</span>
                </div>
              </div>
              
              <ul className="feature-list">
                <li>1000+ Pre-installed Software</li>
                <li>XFCE Desktop Environment</li>
                <li>PulseAudio (Sound Works!)</li>
                <li>VNC Server Ready</li>
                <li>Storage Sharing</li>
                <li>neofetch ACRO Branding</li>
                <li>Basic GPU Support</li>
              </ul>
              
              <div className="code-block">
                <code>git clone https://github.com/ZetaGo-Aurum/modded-ubuntu && cd modded-ubuntu && bash setup.sh</code>
              </div>
              
              <a 
                href="https://github.com/ZetaGo-Aurum/modded-ubuntu" 
                target="_blank"
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                📥 Install from GitHub
              </a>
            </div>

            {/* PRO+ Tier */}
            <div className="pricing-card tier-proplus">
              <div className="tier-popular-badge">POPULAR</div>
              <div className="pricing-header">
                <span className="tier-badge tier-badge-proplus">ADD-ON</span>
                <h3 className="tier-name">⭐ PRO+</h3>
                <p className="tier-desc">Gaming & Theme Pack</p>
                <div className="tier-price">
                  <span className="price-currency">Rp</span>
                  <span className="price-value">62.500</span>
                </div>
                <div className="acron-display">
                  <img src="/acron.png" alt="ACRON" style={{ width: '28px', height: '28px' }} />
                  <span>= 1 ACRON</span>
                </div>
              </div>
              
              <ul className="feature-list">
                <li>🎮 GPU Gaming Optimization</li>
                <li>🕹️ 10+ Gaming Emulators</li>
                <li>🎨 15+ Premium Themes</li>
                <li>⚡ Performance Tools</li>
                <li>📺 OBS Streaming Ready</li>
                <li>🎮 Steam for proot</li>
                <li>📞 Email Support (24h)</li>
              </ul>
              
              <div className="addon-notice">
                ⚠️ Requires <strong>PRO (Free)</strong> installed first
              </div>
              
              <button 
                onClick={() => handleBuyClick('proplus')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                🛒 Buy with 1 ACRON
              </button>
            </div>

            {/* ULTIMATE Tier */}
            <div className="pricing-card tier-ultimate">
              <div className="tier-best-badge">BEST VALUE</div>
              <div className="pricing-header">
                <span className="tier-badge tier-badge-ultimate">FULL PACK</span>
                <h3 className="tier-name">🏆 ULTIMATE</h3>
                <p className="tier-desc">Everything Included</p>
                <div className="tier-price">
                  <span className="price-currency">Rp</span>
                  <span className="price-value">125.000</span>
                </div>
                <div className="acron-display">
                  <img src="/acron.png" alt="ACRON" style={{ width: '28px', height: '28px' }} />
                  <img src="/acron.png" alt="ACRON" style={{ width: '28px', height: '28px' }} />
                  <span>= 2 ACRON</span>
                </div>
              </div>
              
              <ul className="feature-list">
                <li>✨ All PRO+ Features</li>
                <li>🔐 Full Pentest Suite</li>
                <li>🛡️ Privacy & Tor Tools</li>
                <li>💻 Developer Pro Pack</li>
                <li>🎬 Content Creator Bundle</li>
                <li>🔧 Forensics & RE Tools</li>
                <li>👑 VIP Support (6h)</li>
                <li>♾️ Lifetime Updates</li>
              </ul>
              
              <div className="addon-notice addon-notice-gold">
                ⚠️ Requires <strong>PRO (Free)</strong> installed first
              </div>
              
              <button 
                onClick={() => handleBuyClick('ultimate')}
                className="btn btn-gold"
                style={{ width: '100%' }}
              >
                🛒 Buy with 2 ACRON
              </button>
            </div>
          </div>

          {/* Important Note */}
          <div className="info-card">
            <h4>📌 Penting untuk Pembeli PRO+ / ULTIMATE</h4>
            <p>
              PRO+ dan ULTIMATE adalah <strong>add-on pack</strong>, bukan software terpisah. 
              Install <strong>ACRO PRO (Free)</strong> dari GitHub terlebih dahulu sebagai engine utama.
              Setelah pembayaran, Anda akan menerima <strong>License Key</strong> yang valid seumur hidup.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="section" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="container">
          <h2 className="section-title">📸 Gallery</h2>
          
          <div className="gallery-grid">
            {screenshots.map((shot, i) => (
              <div key={i} className="gallery-item">
                <div className="gallery-image">
                  <img 
                    src={shot.src} 
                    alt={shot.alt}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<div class="gallery-placeholder">🖼️</div>';
                      }
                    }}
                  />
                </div>
                <div className="gallery-caption">{shot.caption}</div>
              </div>
            ))}
          </div>
          
          <p className="gallery-note">
            Screenshots from ACRO PRO Edition running on Android via Termux + VNC
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">📖 Quick Start Guide</h2>
          
          <div className="guide-card">
            <h3>Requirements</h3>
            <ul className="feature-list">
              <li>Termux from F-Droid</li>
              <li>VNC Viewer (AVNC recommended)</li>
              <li>15-20GB free storage</li>
              <li>Stable internet connection</li>
            </ul>
            
            <h3>Installation</h3>
            <div className="code-block">
              <code># Update Termux</code><br />
              <code>yes | pkg up</code><br /><br />
              <code># Clone and install</code><br />
              <code>pkg install git wget -y</code><br />
              <code>git clone --depth=1 https://github.com/ZetaGo-Aurum/modded-ubuntu.git</code><br />
              <code>cd modded-ubuntu && bash setup.sh</code>
            </div>
            
            <h3>After Installation</h3>
            <div className="code-block">
              <code># Restart Termux, then:</code><br />
              <code>ubuntu</code><br /><br />
              <code># Create user (first time):</code><br />
              <code>bash user.sh</code><br /><br />
              <code># Install GUI:</code><br />
              <code>sudo bash gui.sh</code>
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <a 
                href="https://github.com/ZetaGo-Aurum/modded-ubuntu" 
                target="_blank"
                className="btn btn-outline"
              >
                📄 Full Documentation on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/acron.png" alt="ACRON" style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
          <div className="gradient-text" style={{ fontSize: '28px', fontWeight: 700 }}>
            ACRO PRO Edition
          </div>
          <p>Premium Linux Distribution for Termux</p>
        </div>
        
        <div className="footer-links">
          <a href="https://github.com/ZetaGo-Aurum" target="_blank">GitHub</a>
          <a href="https://trakteer.id/Aleocrophic" target="_blank">Trakteer</a>
          <a href="mailto:deltaastra24@gmail.com">Support</a>
        </div>
        
        <p className="footer-copyright">
          © 2024-2026 <strong>ZetaGo-Aurum</strong> | <strong>ALEOCROPHIC</strong> Brand
        </p>
      </footer>
    </main>
  );
}

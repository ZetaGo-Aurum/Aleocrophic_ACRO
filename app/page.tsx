'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/AuthModal';
import InvoiceCard from '@/components/InvoiceCard';
import Toast from '@/components/Toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';

export default function Home() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [pricingConfig, setPricingConfig] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'os' | 'store'>('os');

  // Fetch Pricing Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setPricingConfig(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  // Fetch Products
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
     const q = query(collection(db, 'products'), orderBy('name'));
     const unsub = onSnapshot(q, col => {
        setProducts(col.docs.map(d => ({id: d.id, ...d.data()})));
     });
     return () => unsub();
  }, []);

  const getPriceDetails = (tier: string, baseAcron: number, baseRp: number) => {
    if (pricingConfig?.discount_active && pricingConfig?.discount_tiers?.includes(tier)) {
        const percent = pricingConfig.discount_percent || 0;
        // Discount affects RP price (Fiat), but ACRON quantity remains fixed.
        // User buys ACRON cheaper at Trakteer, but pays full ACRON amount here.
        const discountRp = baseRp * ((100 - percent) / 100);
        return {
            acron: baseAcron, // Fixed (1 or 2)
            rp: discountRp.toLocaleString('id-ID'),
            originalRp: baseRp.toLocaleString('id-ID'),
            isDiscounted: true,
            percent: percent
        };
    }
    return {
        acron: baseAcron,
        rp: baseRp.toLocaleString('id-ID'),
        originalRp: null,
        isDiscounted: false,
        percent: 0
    };
  };

  const proPrice = getPriceDetails('proplus', 1, 62500);
  const ultPrice = getPriceDetails('ultimate', 2, 125000);

  // Broadcast Logic
  const [showBroadcast, setShowBroadcast] = useState(false);

  useEffect(() => {
    if (pricingConfig?.broadcast_active && pricingConfig?.broadcast_message) {
        setShowBroadcast(true);
        if (!pricingConfig.broadcast_permanent && pricingConfig.broadcast_duration) {
            const timer = setTimeout(() => {
                setShowBroadcast(false);
            }, pricingConfig.broadcast_duration * 1000);
            return () => clearTimeout(timer);
        }
    } else {
        setShowBroadcast(false);
    }
  }, [pricingConfig]);

  // Countdown Logic
  const [countdown, setCountdown] = useState<string>('');
  useEffect(() => {
    if (showBroadcast && pricingConfig?.broadcast_target_time) {
       const interval = setInterval(() => {
          const target = new Date(pricingConfig.broadcast_target_time).getTime();
          const now = new Date().getTime();
          const dist = target - now;

          if (dist < 0) {
             setCountdown('EXPIRED');
             if (pricingConfig.broadcast_auto_expire) {
                setShowBroadcast(false);
             }
             clearInterval(interval);
          } else {
             const days = Math.floor(dist / (1000 * 60 * 60 * 24));
             const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
             const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
             const seconds = Math.floor((dist % (1000 * 60)) / 1000);
             setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
          }
       }, 1000);
       return () => clearInterval(interval);
    }
  }, [showBroadcast, pricingConfig]);

  const screenshots = [
    { src: '/screenshots/screenshot_blender.jpg', alt: 'Blender 3D Modeling', caption: 'Blender 4.3.2 - 3D Modeling & Animation' },
    { src: '/screenshots/screenshot_krita.jpg', alt: 'Krita Digital Painting', caption: 'Krita - Digital Painting' },
    { src: '/screenshots/screenshot_kdenlive.jpg', alt: 'Kdenlive Video Editor', caption: 'Kdenlive - Video Editing' },
    { src: '/screenshots/screenshot_lmms.jpg', alt: 'LMMS Music Production', caption: 'LMMS - Music Production' },
    { src: '/screenshots/screenshot_vscode.jpg', alt: 'VS Code IDE', caption: 'Visual Studio Code - Development' },
    { src: '/screenshots/screenshot_krita_splash.jpg', alt: 'Krita Splash', caption: 'Krita 25th Anniversary Edition' },
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuyClick = async (tier: 'proplus' | 'ultimate') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (userData?.isAnonymous) {
      showToast('Guest accounts cannot purchase. Please sign in with email or Google.', 'warning');
      return;
    }

    const priceDetails = tier === 'proplus' ? proPrice : ultPrice;
    const requiredAcron = priceDetails.acron;
    const tierName = tier === 'proplus' ? 'PRO+' : 'ULTIMATE';
    
    // Check if user has enough balance
    if ((userData?.acronBalance || 0) >= requiredAcron) {
      try {
        // Show processing toast (keep it visible longer or until success)
        showToast(`Processing purchase for ${tierName}...`, 'warning');
        
        const response = await fetch('/api/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            tier,
            tierName,
            // API handles validation, we just send tier/uid. Price ignored by secure API.
          })
        });

        const result = await response.json();

        if (result.success) {
          await refreshUserData(); // Refresh balance and licenses
          showToast(`🎉 Purchase Successful! ${tierName} unlocked.`, 'success');
          
          // Show Invoice
          setInvoiceData({
            tierName: result.data.license.tierName,
            price: requiredAcron,
            transactionId: result.data.license.transactionId,
            licenseKey: result.data.license.key,
            date: result.data.license.createdAt,
            newBalance: result.data.newBalance
          });
          setShowInvoice(true);
        } else {
          showToast(`❌ Purchase failed: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error(error);
        showToast('❌ Network error during purchase', 'error');
      }
    } else {
      // Not enough balance - redirect to Trakteer
      showToast(`❌ ACRON tidak cukup! Perlu ${requiredAcron} ACRON untuk ${tierName}`, 'error');
      setTimeout(() => {
        window.open(`https://trakteer.id/Aleocrophic/tip?quantity=${Math.ceil(requiredAcron)}`, '_blank');
      }, 1500);
    }
  };

  return (
    <main>
      {/* Mobile Sidebar (Hamburger) */}
      <div className={`md:hidden fixed z-[60] top-0 left-0 w-64 h-full bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-4 flex justify-between items-center border-b border-gray-700">
            <span className="text-xl font-bold gradient-text">ACRON Store</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">✕</button>
         </div>
         <div className="p-4 space-y-4">
            <button onClick={() => { setActiveTab('os'); setIsSidebarOpen(false); }} className={`block w-full text-left ${activeTab === 'os' ? 'text-teal-400 font-bold' : 'text-gray-300'} hover:text-white`}>ACRO OS</button>
            <button onClick={() => { setActiveTab('store'); setIsSidebarOpen(false); }} className={`block w-full text-left ${activeTab === 'store' ? 'text-teal-400 font-bold' : 'text-gray-300'} hover:text-white`}>Official Store</button>
            {user ? (
               <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-3 mb-4">
                     {userData?.photoURL && <img src={userData.photoURL} alt="User" className="w-8 h-8 rounded-full" />}
                     <span className="text-sm font-bold text-white">{userData?.displayName}</span>
                  </div>
                  <div className="text-yellow-500 mb-4">Balance: {userData?.acronBalance} ACRON</div>
                  <a href="/profile" className="block text-center w-full bg-gray-800 py-2 rounded text-sm mb-2">My Profile</a>
               </div>
            ) : (
               <button onClick={() => { setIsSidebarOpen(false); setShowAuthModal(true); }} className="w-full bg-teal-600 py-2 rounded text-white font-bold">Sign In</button>
            )}
         </div>
      </div>
      
      {/* Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-[50] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Navigation (Desktop & Mobile Header) */}
      <nav 
        className="nav-glass transition-all duration-300 top-0 h-[68px] flex items-center justify-between"
        style={{ marginTop: 0 }}
      >
        <div className="nav-brand flex items-center h-full pl-4">
          <button className="md:hidden text-white mr-4 text-2xl" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <img src="/acron.png" alt="ACRON" className="nav-logo h-10 w-auto" />
          <span className="nav-title gradient-text ml-2">ACRON</span>
        </div>
        
        <div className="nav-menu flex items-center h-full pr-4 hidden md:flex">
          <button onClick={() => setActiveTab('os')} className={`nav-link ${activeTab === 'os' ? 'text-teal-400 border-b-2 border-teal-400' : ''}`}>ACRO OS</button>
          <button onClick={() => setActiveTab('store')} className={`nav-link ${activeTab === 'store' ? 'text-teal-400 border-b-2 border-teal-400' : ''}`}>Store</button>
          
          {loading ? (
            <div className="nav-skeleton" />
          ) : user ? (
            <div className="nav-user flex items-center">
              {/* Balance */}
              <div className="nav-balance">
                <span className="balance-icon">🪙</span>
                <span className="balance-value">{userData?.acronBalance || 0}</span>
              </div>
              
              {/* Profile Avatar */}
              <a href="/profile" className="nav-avatar ml-3">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <span>{userData?.displayName?.charAt(0).toUpperCase() || '?'}</span>
                  </div>
                )}
              </a>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary btn-sm">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Broadcast Banner (Positioned BELOW Header EXACTLY at 68px) */}
      {showBroadcast && (
         <div className="fixed top-[68px] left-0 right-0 z-40 h-10 bg-gradient-to-r from-yellow-600 to-red-600 text-white animate-slide-down shadow-xl flex items-center">
            <div className="container mx-auto px-4 flex justify-center items-center h-full">
               <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-xl animate-pulse">📢</span>
                  <p className="font-bold text-sm md:text-base drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis">
                     {pricingConfig.broadcast_message} 
                     {pricingConfig.broadcast_target_time && <span className="ml-2 text-yellow-300 font-mono">[{countdown}]</span>}
                  </p>
               </div>
               {!pricingConfig.broadcast_permanent && (
                 <button 
                   onClick={() => setShowBroadcast(false)}
                   className="absolute right-4 text-white hover:text-gray-200 transition"
                 >
                   ✕
                 </button>
               )}
            </div>
         </div>
      )}

      {/* === ACRO OS TAB === */}
      {activeTab === 'os' && (
      <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-effect" />
        <div className="hero-glow" />
        
        <div className="hero-content">
          {/* ACRON Coin */}
          <div className="hero-coin animate-float">
            <img src="/acron.png" alt="ACRON Coin" />
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
              <span className="stat-label">APPS</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">v3.5</span>
              <span className="stat-label">LATEST</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">4.5</span>
              <span className="stat-label">OPENGL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section section-dark">
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
                  <span className="price-value-free">FREE</span>
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
                className="btn btn-outline btn-block"
              >
                📥 Install from GitHub
              </a>
            </div>

            {/* PRO+ Tier */}
            <div className={`pricing-card tier-proplus ${proPrice.isDiscounted ? 'border-yellow-500' : ''}`}>
              {proPrice.isDiscounted && (
                 <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    DISCOUNT {proPrice.percent}%
                 </div>
              )}
              <div className="tier-popular-badge">POPULAR</div>
              <div className="pricing-header">
                <span className="tier-badge tier-badge-proplus">ADD-ON</span>
                <h3 className="tier-name">⭐ PRO+</h3>
                <p className="tier-desc">Gaming & Theme Pack</p>
                
                <div className="tier-price flex flex-col items-center">
                    {proPrice.isDiscounted && (
                       <span className="text-gray-500 line-through text-sm">Rp {proPrice.originalRp}</span>
                    )}
                  <div className="flex items-center">
                      <span className="price-currency">Rp</span>
                      <span className={`price-value ${proPrice.isDiscounted ? 'text-yellow-400' : ''}`}>
                          {proPrice.rp}
                      </span>
                  </div>
                </div>

                <div className="acron-display mt-2">
                  <img src="/acron.png" alt="ACRON" />
                  <span>= {proPrice.acron} ACRON</span>
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
                className="btn btn-primary btn-block"
              >
                🛒 Buy with {proPrice.acron} ACRON
              </button>
            </div>

            {/* ULTIMATE Tier */}
            <div className={`pricing-card tier-ultimate ${ultPrice.isDiscounted ? 'border-yellow-500' : ''}`}>
              {ultPrice.isDiscounted && (
                 <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    DISCOUNT {ultPrice.percent}%
                 </div>
              )}
              <div className="tier-best-badge">BEST VALUE</div>
              <div className="pricing-header">
                <span className="tier-badge tier-badge-ultimate">FULL PACK</span>
                <h3 className="tier-name">🏆 ULTIMATE</h3>
                <p className="tier-desc">Everything Included</p>
                
                <div className="tier-price flex flex-col items-center">
                    {ultPrice.isDiscounted && (
                       <span className="text-gray-500 line-through text-sm">Rp {ultPrice.originalRp}</span>
                    )}
                  <div className="flex items-center">
                      <span className="price-currency">Rp</span>
                      <span className={`price-value ${ultPrice.isDiscounted ? 'text-yellow-400' : ''}`}>
                          {ultPrice.rp}
                      </span>
                  </div>
                </div>

                <div className="acron-display mt-2">
                  <img src="/acron.png" alt="ACRON" />
                  <img src="/acron.png" alt="ACRON" />
                  <span>= {ultPrice.acron} ACRON</span>
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
                className="btn btn-gold btn-block"
              >
                🛒 Buy with {ultPrice.acron} ACRON
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
      <section id="gallery" className="section section-dark">
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
            <div className="guide-section">
              <h3>Requirements</h3>
              <ul className="feature-list compact">
                <li>Termux from F-Droid</li>
                <li>VNC Viewer (AVNC recommended)</li>
                <li>15-20GB free storage</li>
                <li>Stable internet connection</li>
              </ul>
            </div>
            
            <div className="guide-section">
              <h3>Installation</h3>
              <div className="code-block">
                <code># Update Termux</code><br />
                <code>yes | pkg up</code><br /><br />
                <code># Clone and install</code><br />
                <code>pkg install git wget -y</code><br />
                <code>git clone --depth=1 https://github.com/ZetaGo-Aurum/modded-ubuntu.git</code><br />
                <code>cd modded-ubuntu && bash setup.sh</code>
              </div>
            </div>
            
            <div className="guide-section">
              <h3>After Installation</h3>
              <div className="code-block">
                <code># Restart Termux, then:</code><br />
                <code>ubuntu</code><br /><br />
                <code># Create user (first time):</code><br />
                <code>bash user.sh</code><br /><br />
                <code># Install GUI:</code><br />
                <code>sudo bash gui.sh</code>
              </div>
            </div>
            
            <div className="guide-footer">
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
      </>
      )}

      {/* === STORE TAB === */}
      {activeTab === 'store' && (
      <section id="products" className="min-h-screen py-20 bg-gray-900 relative">
         <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 gradient-text" data-aos="fade-up">
               Official Store
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {products.map((product) => (
                  <div key={product.id} className={`bg-gray-800 rounded-2xl p-6 border ${product.highlight ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg' : 'border-gray-700'} hover:scale-105 transition duration-300`}>
                     {product.highlight && <div className="text-yellow-400 text-xs font-bold mb-2 uppercase tracking-wide">⭐ Featured</div>}
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold text-white">{product.name}</h3>
                        <span className="bg-gray-700 px-3 py-1 rounded-full text-yellow-400 font-mono font-bold">
                           {product.price} ACRON
                        </span>
                     </div>
                     <p className="text-gray-400 mb-6 min-h-[3rem]">{product.description}</p>
                     
                     <div className="space-y-3">
                        {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-4" />}
                        
                        {product.fileUrl ? (
                           <a 
                             href={product.fileUrl} 
                             target="_blank"
                             className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-teal-500/30 transition transform active:scale-95"
                           >
                             Download Now ⬇️
                           </a>
                        ) : (
                           <button disabled className="block w-full text-center py-3 rounded-xl bg-gray-700 text-gray-400 font-bold cursor-not-allowed">
                             Unavailable
                           </button>
                        )}
                     </div>
                  </div>
               ))}
               
               {products.length === 0 && (
                  <div className="col-span-3 text-center text-gray-500 py-12">
                     <p>Coming Soon...</p>
                  </div>
               )}
            </div>
         </div>
      </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/acron.png" alt="ACRON" className="footer-logo" />
          <div className="footer-title gradient-text">ACRO PRO Edition</div>
          <p className="footer-tagline">Premium Linux Distribution for Termux</p>
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
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Invoice Card */}
      <InvoiceCard 
        isOpen={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        data={invoiceData}
      />
    </main>
  );
}

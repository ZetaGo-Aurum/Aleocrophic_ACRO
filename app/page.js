'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [readmeContent, setReadmeContent] = useState('');
  const [loadingReadme, setLoadingReadme] = useState(true);

  useEffect(() => {
    // 1. Fetch GitHub README
    fetchGitHubReadme();

    // 2. Smooth Scroll for Anchor Links
    const handleAnchorClick = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  const fetchGitHubReadme = async (retryCount = 0, branch = 'main') => {
    const MAX_RETRIES = 2;
    setLoadingReadme(true);

    try {
      const response = await fetch(`https://raw.githubusercontent.com/ZetaGo-Aurum/Aleocrophic_ACRO/${branch}/README.md`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const markdown = await response.text();
      
      if (typeof window.marked !== 'undefined') {
        setReadmeContent(window.marked.parse(markdown));
      } else {
        setReadmeContent(`<pre class="whitespace-pre-wrap text-sm text-gray-300">${markdown}</pre>`);
      }
      setLoadingReadme(false);

    } catch (error) {
      console.error('[UI_ERROR] Failed to fetch GitHub README', error);

      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchGitHubReadme(retryCount + 1, branch), delay);
      } else {
        setLoadingReadme(false);
        setReadmeContent(`
          <div class="text-center py-12 px-4 glass-card border-red-500/20 bg-red-500/5 rounded-xl">
            <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
            <h3 class="text-white font-bold mb-2">Gagal Memuat Dokumentasi</h3>
            <p class="text-gray-400 text-sm">Terjadi kesalahan saat mengambil file dari GitHub.</p>
          </div>
        `);
      }
    }
  };

  const checkOrderStatus = async () => {
    if (typeof window.Swal === 'undefined') return;

    try {
      const { value: formValues } = await window.Swal.fire({
        title: 'Cek Status Lisensi',
        html: `
          <div class="space-y-4 text-left">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Email Pembeli</label>
              <input id="swal-input1" class="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#d0bcff] outline-none" placeholder="email@contoh.com">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Order ID / Reference</label>
              <input id="swal-input2" class="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#d0bcff] outline-none" placeholder="TRK-XXXXX atau Order ID">
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Periksa Sekarang',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#00e676',
        background: '#1a1a1e',
        color: '#ffffff',
        preConfirm: () => {
          const email = document.getElementById('swal-input1').value;
          const orderId = document.getElementById('swal-input2').value;
          
          if (!email || !orderId) {
            window.Swal.showValidationMessage('Harap isi email dan Order ID');
            return false;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            window.Swal.showValidationMessage('Format email tidak valid');
            return false;
          }
          
          return { email, orderId };
        }
      });

      if (formValues) {
        const { email, orderId } = formValues;
        
        window.Swal.fire({
          title: 'Memproses...',
          text: 'Sedang memverifikasi status pembayaran Anda',
          allowOutsideClick: false,
          didOpen: () => {
            window.Swal.showLoading();
          },
          background: '#1a1a1e',
          color: '#ffffff'
        });

        await performLicenseCheck(email, orderId);
      }
    } catch (error) {
      console.error('[UI_ERROR] checkOrderStatus flow failed', error);
    }
  };

  const performLicenseCheck = async (email, orderId, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const baseDelay = 1000;

    try {
      const response = await fetch(`./api/premium/check-status.php?email=${encodeURIComponent(email)}&order_id=${encodeURIComponent(orderId)}`);
      
      if (response.status === 403) {
        throw new Error('FORBIDDEN');
      }

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP_${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        const licenseKey = data.license_key || (data.data && data.data.license_key);
        
        window.Swal.fire({
          icon: 'success',
          title: 'Lisensi Ditemukan!',
          html: `
            <div class="text-left space-y-4">
              <p class="text-sm text-gray-300">Pembayaran Anda telah diverifikasi. Berikut adalah lisensi Anda:</p>
              <div class="bg-black/40 p-4 rounded-lg border border-[#d0bcff]/30">
                <code class="text-[#d0bcff] font-mono text-lg break-all select-all">${licenseKey}</code>
              </div>
            </div>
          `,
          confirmButtonText: 'Salin & Tutup',
          confirmButtonColor: '#00e676',
          background: '#1a1a1e',
          color: '#ffffff'
        }).then((result) => {
          if (result.isConfirmed) {
            navigator.clipboard.writeText(licenseKey);
          }
        });
      } else {
        window.Swal.fire({
          icon: 'info',
          title: 'Belum Ada Lisensi',
          text: data.message || 'Pembayaran Anda mungkin masih dalam proses atau data tidak ditemukan.',
          confirmButtonText: 'Mengerti',
          background: '#1a1a1e',
          color: '#ffffff'
        });
      }

    } catch (error) {
      if (retryCount < MAX_RETRIES && (error.message.startsWith('HTTP_5') || error.message === 'Failed to fetch')) {
        const delay = Math.pow(2, retryCount) * baseDelay;
        setTimeout(() => performLicenseCheck(email, orderId, retryCount + 1), delay);
      } else {
        window.Swal.fire({
          icon: 'error',
          title: error.message === 'FORBIDDEN' ? 'Akses Ditolak (403)' : 'Pengecekan Gagal',
          text: error.message === 'FORBIDDEN' ? 'Server menolak permintaan Anda.' : 'Gagal terhubung ke server.',
          background: '#1a1a1e',
          color: '#ffffff'
        });
      }
    }
  };

  return (
    <>
      {/* Global Background Blobs */}
      <div className="bg-blob-container">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob pointer-events-none"></div>
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      </div>

      {/* Navbar Simple */}
      <nav className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center z-[1000] gap-4 sm:gap-0 bg-[#0f0f13]/80 backdrop-blur-md sm:bg-transparent transition-all duration-300">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#d0bcff] to-purple-600 rounded-full flex items-center justify-center text-[#121212] font-bold text-xl shadow-lg shadow-purple-500/30">A</div>
          <span className="font-bold text-xl tracking-tight text-white">Aleocrophic</span>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button onClick={checkOrderStatus} className="text-xs sm:text-sm font-bold text-[#efb8c8] hover:text-white transition-all flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-[#efb8c8]/30 hover:bg-[#efb8c8]/10 active:scale-95 flex-1 sm:flex-none">
            <i className="fas fa-search"></i> Cek Status
          </button>
          <a href="https://github.com/ZetaGo-Aurum/modded-ubuntu" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#d0bcff] transition-colors text-xl sm:text-2xl p-2" title="View Source on GitHub">
            <i className="fab fa-github"></i>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mt-28 sm:mt-48 lg:mt-32 mb-12 relative px-4 sm:px-6 lg:px-8 mx-auto">
        
        {/* Left: Text & Info */}
        <div className="space-y-6 sm:space-y-8 text-center lg:text-left relative z-10 lg:sticky lg:top-24">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-card border border-[#d0bcff]/30 text-[#d0bcff] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 hover:bg-white/5 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
            Official ACRON Payment Gateway
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r from-[#d0bcff] via-white to-[#efb8c8] drop-shadow-2xl">
            The OS<br className="hidden sm:block" /> For Elites.
          </h1>
          
          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Basis fitur utama tersedia di <strong className="text-white">PRO tanpa PLUS</strong>. Upgrade ke <strong className="text-[#d0bcff]">PRO+ atau ULTIMATE</strong> untuk pack tambahan dan license key eksklusif. 
            <span className="block mt-2 text-sm italic">Pastikan sudah mendownload ACRO OS ubuntu-modded dari GitHub terlebih dahulu.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 items-center">
            <a href="#pricing" className="btn-material w-full sm:w-auto px-8 py-4 rounded-full bg-[#d0bcff] text-[#121212] font-bold text-lg flex items-center justify-center gap-2 active:scale-95">
              <span>Pilih Tier</span>
              <i className="fas fa-arrow-right"></i>
            </a>
            <a href="https://github.com/ZetaGo-Aurum/Aleocrophic_ACRO" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95">
              <i className="fab fa-github"></i> Download OS
            </a>
          </div>
          
          {/* GitHub README Content Area */}
          <div id="github-readme" className="github-content">
            <div className="flex items-center gap-2 mb-4 text-[#d0bcff] border-b border-white/10 pb-2">
              <i className="fab fa-github"></i>
              <h3 className="font-bold text-lg m-0">Latest Updates from GitHub</h3>
            </div>
            {loadingReadme ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded"></div>
                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-300 text-left" dangerouslySetInnerHTML={{ __html: readmeContent }} />
            )}
            <div className="mt-4 text-center">
              <a href="https://github.com/ZetaGo-Aurum/modded-ubuntu" target="_blank" rel="noopener noreferrer" className="text-xs text-[#d0bcff] hover:underline">View Full README on GitHub &rarr;</a>
            </div>
          </div>
        </div>

        {/* Right: Pricing Cards */}
        <div id="pricing" className="relative w-full space-y-8 sm:space-y-10 lg:space-y-6">

          {/* Tier 0: PRO tanpa Plus Edition */}
          <div className="glass-card rounded-[2rem] p-6 sm:p-8 relative overflow-hidden ring-1 ring-white/5 hover:ring-white/20 transition-all duration-300 group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-400 to-gray-600"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="font-bold text-2xl text-white group-hover:text-gray-300 transition-colors">PRO tanpa Plus</h3>
                <p className="text-sm text-gray-400">Core OS Features</p>
              </div>
              <div className="text-left sm:text-right bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto">
                <div className="text-3xl font-bold text-white uppercase tracking-tight">Gratis</div>
                <div className="text-xs text-gray-500 uppercase tracking-tighter">Community Support</div>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full my-6"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-check-circle text-gray-500 w-5 text-center"></i> <span>Core Ubuntu Base</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-check-circle text-gray-500 w-5 text-center"></i> <span>Basic Optimizations</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-check-circle text-gray-500 w-5 text-center"></i> <span>1000+ Software Access</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-check-circle text-gray-500 w-5 text-center"></i> <span>Standard Repo Access</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 line-through decoration-gray-600">
                <i className="fas fa-times-circle text-red-900/50 w-5 text-center"></i> <span>Premium Features</span>
              </div>
            </div>

            <a href="https://github.com/ZetaGo-Aurum/modded-ubuntu" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-4 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white font-bold transition-all border border-white/10 active:scale-95">
              <i className="fab fa-github mr-2"></i> Get from GitHub
            </a>
          </div>

          {/* Tier 1: Pro+ */}
          <div className="glass-card rounded-[2rem] p-6 sm:p-8 relative overflow-hidden ring-1 ring-white/10 hover:ring-[#d0bcff]/50 transition-all duration-300 group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-cyan-300"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="font-bold text-2xl text-white group-hover:text-[#d0bcff] transition-colors">PRO+ Edition</h3>
                <p className="text-sm text-gray-400">Perfect for Gamers</p>
              </div>
              <div className="text-left sm:text-right bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto">
                <div className="text-3xl font-bold text-white">1 ACRON</div>
                <div className="text-xs text-gray-500 uppercase tracking-tighter">Rp 62.500</div>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full my-6"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-microchip text-blue-400 w-5 text-center"></i> <span>GPU Gaming Optimization</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-gamepad text-blue-400 w-5 text-center"></i> <span>Gaming Emulators</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-paint-brush text-blue-400 w-5 text-center"></i> <span>Premium Themes (10+)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-tachometer-alt text-blue-400 w-5 text-center"></i> <span>Performance Tweaks</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-cogs text-blue-400 w-5 text-center"></i> <span>Extra Configurations</span>
              </div>
            </div>

            <a href="https://trakteer.id/aleocrophic/tip?quantity=1" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-4 rounded-xl bg-white/5 hover:bg-[#d0bcff] hover:text-[#121212] font-bold transition-all border border-white/10 active:scale-95">
              Get Pro+ (1 ACRON)
            </a>
          </div>

          {/* Tier 2: Ultimate */}
          <div className="glass-card rounded-[2rem] p-6 sm:p-8 relative overflow-hidden ring-1 ring-purple-500/30 hover:ring-purple-400 transition-all duration-300 group transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-pulse-slow"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
              <div>
                <h3 className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">ULTIMATE</h3>
                <p className="text-sm text-gray-400">For Hackers & Devs</p>
              </div>
              <div className="text-left sm:text-right bg-purple-500/10 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto">
                <div className="flex items-center sm:justify-end gap-2">
                  <i className="fas fa-crown text-yellow-400 text-sm animate-bounce"></i>
                  <div className="text-3xl font-bold text-white">2 ACRON</div>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-tighter">Rp 125.000</div>
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4 mb-6 relative z-10">
              <p className="text-xs text-purple-200 text-center font-semibold flex items-center justify-center gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-400"></span>
                Includes all Pro+ features PLUS:
                <span className="w-1 h-1 rounded-full bg-purple-400"></span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-user-secret text-purple-400 w-5 text-center"></i> <span>Pentest Suite</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-bug text-purple-400 w-5 text-center"></i> <span>Metasploit Framework</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-user-shield text-purple-400 w-5 text-center"></i> <span>Privacy Tools (Tor, VPN)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-terminal text-purple-400 w-5 text-center"></i> <span>Dev Pro Pack</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-infinity text-purple-400 w-5 text-center"></i> <span>Lifetime Updates</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <i className="fas fa-user-lock text-yellow-400 w-5 text-center"></i> <span>VIP Priority Support</span>
              </div>
            </div>

            <a href="https://trakteer.id/aleocrophic/tip?quantity=2" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-5 rounded-xl bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all shadow-lg shadow-purple-900/50 relative z-10 active:scale-95">
              Unlock Ultimate Power (2 ACRON)
            </a>
            <p className="text-[10px] text-center text-gray-500 mt-3 uppercase tracking-widest">Support Aleocrophic development directly.</p>
          </div>

          <footer className="text-center text-xs text-gray-600 w-full pt-4">
            &copy; 2025-2026 Aleocrophic. <span className="hidden sm:inline">Modded Ubuntu made with ❤️ by Rayhan.</span>
            <div className="mt-1 text-[10px] opacity-50">Secure Key Delivery via Webhook.</div>
          </footer>

        </div>
      </main>
    </>
  );
}

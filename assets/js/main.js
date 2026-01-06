/**
 * Global Image Handling & Optimization
 */
function handleImageError(event) {
    const img = event.target;
    if (img && !img.dataset.retry) {
        console.warn(`[IMAGE_LOAD_ERROR] Failed to load image: ${img.src}`);
        img.dataset.retry = "true";
        // Caching optimization: Use a reliable placeholder service with cache headers
        img.src = 'https://via.placeholder.com/400x200?text=IMAGE+NOT+FOUND';
        img.alt = 'GAGAL LOAD IMAGE';
        img.classList.add('image-fallback');
    }
}

// Add caching hint for dynamically loaded images
function optimizeImage(img) {
    if (img && !img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
    }
}

window.addEventListener('error', function(event) {
    if (event.target.tagName === 'IMG') {
        handleImageError(event);
    }
}, true);

// Observe DOM for new images to optimize
const imageObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.tagName === 'IMG') optimizeImage(node);
            if (node.querySelectorAll) {
                node.querySelectorAll('img').forEach(optimizeImage);
            }
        });
    });
});
imageObserver.observe(document.body, { childList: true, subtree: true });

/**
 * Log errors to a monitoring service (simulated)
 * @param {string} type - Error type (e.g., 'API_ERROR', 'UI_ERROR')
 * @param {string} message - Error message
 * @param {object} details - Additional details
 */
function logErrorToService(type, message, details = {}) {
    const errorEvent = {
        timestamp: new Date().toISOString(),
        type,
        message,
        details,
        userAgent: navigator.userAgent
    };
    
    // In a real app, this would be a fetch call to an analytics endpoint
    // For now, we log structured data to console and dispatch an event
    console.error(`[MONITORING] [${type}] ${message}`, details);
    
    // Dispatch custom event for local handling (e.g., UI notifications)
    window.dispatchEvent(new CustomEvent('app:error', { detail: errorEvent }));
}

/**
 * Fetch README.md from GitHub with retry and improved error handling
 * @param {number} retryCount - Current retry attempt
 * @param {string} branch - Branch to fetch from (default: 'main')
 */
async function fetchGitHubReadme(retryCount = 0, branch = 'main') {
    const readmeContainer = document.getElementById('github-readme');
    const readmeBody = document.getElementById('readme-body');
    const MAX_RETRIES = 2;
    
    if (!readmeContainer || !readmeBody) return;

    try {
        // Clear previous state
        readmeBody.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 space-y-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-material-primary"></div>
                <p class="text-gray-400">Fetching documentation from GitHub...</p>
            </div>
        `;
        readmeContainer.classList.remove('hidden');

        const response = await fetch(`https://raw.githubusercontent.com/ZetaGo-Aurum/Aleocrophic_ACRO/${branch}/README.md`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const markdown = await response.text();
        
        // Use marked library if available, otherwise fallback to simple text
        if (typeof marked !== 'undefined') {
            readmeBody.innerHTML = marked.parse(markdown);
        } else {
            readmeBody.innerHTML = `<pre class="whitespace-pre-wrap text-sm text-gray-300">${markdown}</pre>`;
        }

        // Apply syntax highlighting if Prism is available
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(readmeBody);
        }

        // Fix image paths in markdown
        const images = readmeBody.querySelectorAll('img');
        images.forEach(img => {
            if (!img.src.startsWith('http')) {
                img.src = `https://raw.githubusercontent.com/ZetaGo-Aurum/Aleocrophic_ACRO/${branch}/${img.getAttribute('src')}`;
            }
            img.classList.add('max-w-full', 'h-auto', 'rounded-lg', 'my-4', 'shadow-lg');
            img.onerror = handleImageError;
        });

    } catch (error) {
        logErrorToService('UI_ERROR', 'Failed to fetch GitHub README', { 
            error: error.message, 
            retryCount,
            branch 
        });

        if (retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 1000;
            readmeBody.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-yellow-500 mb-2">Retrying in ${delay/1000}s...</p>
                    <p class="text-gray-500 text-sm">Attempt ${retryCount + 1} of ${MAX_RETRIES}</p>
                </div>
            `;
            setTimeout(() => fetchGitHubReadme(retryCount + 1, branch), delay);
        } else {
            readmeBody.innerHTML = `
                <div class="text-center py-12 px-4 glass-card border-red-500/20 bg-red-500/5 rounded-xl">
                    <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                    <h3 class="text-white font-bold mb-2">Gagal Memuat Dokumentasi</h3>
                    <p class="text-gray-400 text-sm mb-6">Terjadi kesalahan saat mengambil file dari GitHub. Silakan periksa koneksi internet Anda atau coba lagi nanti.</p>
                    <button onclick="fetchGitHubReadme()" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Check License Status via API
 */
async function checkLicenseStatus(email, orderId) {
    const checkBtn = document.getElementById('check-btn');
    const resultContainer = document.getElementById('check-result');
    
    if (!checkBtn || !resultContainer) return;

    try {
        // UI State: Loading
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Checking...';
        resultContainer.classList.add('hidden');

        const response = await fetch(`./api/premium/check-status.php?email=${encodeURIComponent(email)}&order_id=${encodeURIComponent(orderId)}`);
        const data = await response.json();

        // UI State: Result
        resultContainer.classList.remove('hidden');
        
        if (data.status === 'success') {
            resultContainer.innerHTML = `
                <div class="p-6 rounded-xl bg-green-500/10 border border-green-500/20 animate-fade-in">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                            <i class="fas fa-check text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-white font-bold text-lg">License Found!</h3>
                            <p class="text-green-400 text-sm">Your payment has been verified.</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="bg-black/20 p-4 rounded-lg border border-white/5">
                            <p class="text-gray-400 text-xs uppercase tracking-wider mb-1">Your License Key</p>
                            <code class="text-material-primary font-mono text-lg break-all select-all">${data.license_key}</code>
                        </div>
                        <p class="text-gray-400 text-xs italic">
                            <i class="fas fa-info-circle mr-1"></i> Keep this key safe. Do not share it with others.
                        </p>
                    </div>
                </div>
            `;
        } else {
            resultContainer.innerHTML = `
                <div class="p-6 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                            <i class="fas fa-times text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-white font-bold text-lg">No License Found</h3>
                            <p class="text-red-400 text-sm">${data.message || 'Payment verification failed.'}</p>
                        </div>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        logErrorToService('API_ERROR', 'License check failed', { error: error.message });
        resultContainer.classList.remove('hidden');
        resultContainer.innerHTML = `
            <div class="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm">
                <i class="fas fa-exclamation-triangle mr-2"></i> System is currently busy. Please try again later.
            </div>
        `;
    } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = 'Check License Status';
    }
}

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch GitHub README
    fetchGitHubReadme();

    // 2. Handle License Check Form
    const checkForm = document.getElementById('license-check-form');
    if (checkForm) {
        checkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const orderId = document.getElementById('order_id').value;
            if (email && orderId) {
                checkLicenseStatus(email, orderId);
            }
        });
    }

    // 3. Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 4. Parallax Effect for Hero
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
            heroContent.style.opacity = 1 - (scrolled / 700);
        });
    }
});

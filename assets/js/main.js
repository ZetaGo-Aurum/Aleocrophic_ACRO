/**
<<<<<<< Updated upstream
=======
 * Handle Image Loading Errors
 * Replaces broken images with a fallback placeholder
 */
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
>>>>>>> Stashed changes
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

    // Show container
    readmeContainer.classList.remove('hidden');

    try {
        const repoOwner = 'ZetaGo-Aurum';
        const repoName = 'modded-ubuntu';
        
        // Use a cache-busting parameter to ensure fresh content
        const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/README.md?t=${new Date().getTime()}`;
        
        console.log(`Fetching GitHub README: ${url} (Attempt ${retryCount + 1}, Branch: ${branch})`);
        
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                // If main branch fails, try master branch on first failure
                if (branch === 'main') {
                    console.warn('README not found on main branch, trying master...');
                    return fetchGitHubReadme(0, 'master');
                }
                logErrorToService('README_404', `README.md not found on ${branch}`, { url });
                throw new Error(`README.md not found (404) on ${branch}.`);
            }
            logErrorToService('HTTP_ERROR', `HTTP Error: ${response.status}`, { url, status: response.status });
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const markdown = await response.text();
        
        if (!markdown || markdown.trim() === '') {
            logErrorToService('EMPTY_CONTENT', "README.md is empty.", { url });
            throw new Error("README.md is empty.");
        }

        if (typeof marked !== 'undefined') {
            // Limit content length for preview to avoid heavy rendering
            const previewLength = 1500;
            const truncatedMarkdown = markdown.length > previewLength 
                ? markdown.substring(0, previewLength) + '\n\n... (Lihat selengkapnya di GitHub)' 
                : markdown;
            
            readmeBody.innerHTML = marked.parse(truncatedMarkdown);
            console.log("GitHub README successfully loaded and rendered.");
        } else {
            logErrorToService('RENDERER_ERROR', "Marked.js not loaded", {});
            readmeBody.innerHTML = '<p class="text-yellow-400">Renderer not ready. Please refresh.</p>';
        }

    } catch (error) {
        // Only log generic errors if they haven't been logged by specific checks above
        if (!error.message.includes('HTTP Error') && !error.message.includes('README.md not found')) {
             console.error('Error fetching GitHub README:', error);
        }
        
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying in 2 seconds...`);
            setTimeout(() => fetchGitHubReadme(retryCount + 1, branch), 2000);
        } else {
            // Final failure log
            logErrorToService('FETCH_FAILED', error.message, { retryCount });
            
            readmeBody.innerHTML = `
                <div class="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p class="text-red-400 font-bold mb-2">Gagal memuat update terbaru.</p>
                    <p class="text-xs text-gray-400">${error.message}</p>
                    <button onclick="fetchGitHubReadme()" class="mt-3 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-200 px-3 py-1 rounded-full transition-all">
                        <i class="fas fa-sync-alt"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Check Order Status / Claim Key
 * Triggered by the "Cek Status" button in the navbar
 */
async function checkOrderStatus() {
    try {
        const { value: email } = await Swal.fire({
            title: 'Cek Status Pembayaran',
            input: 'email',
            inputLabel: 'Masukkan alamat email Trakteer kamu',
            inputPlaceholder: 'user@example.com',
            showCancelButton: true,
            confirmButtonText: 'Cek Sekarang',
            cancelButtonText: 'Batal',
            background: '#1a1a24',
            color: '#ffffff',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            customClass: {
                popup: 'glass-card border border-white/10 rounded-[2rem]',
                confirmButton: 'btn-material bg-material-primary text-acro-dark font-bold px-6 py-2 rounded-full',
                cancelButton: 'text-gray-400 hover:text-white transition-colors'
            }
        });

        if (!email) return;

        Swal.fire({
            title: 'Memproses...',
            text: 'Mencari data lisensi untuk ' + email,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#1a1a24',
            color: '#ffffff'
        });

        const response = await fetch(`api/premium/check-status.php?email=${encodeURIComponent(email)}`);
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            Swal.fire({
                title: 'Lisensi Ditemukan!',
                html: `
                    <div class="text-left space-y-3 mt-4">
                        <div class="p-3 bg-white/5 rounded-xl border border-white/10">
                            <p class="text-[10px] text-gray-500 uppercase tracking-widest">Supporter</p>
                            <p class="font-bold text-material-primary">${data.supporter_name}</p>
                        </div>
                        <div class="p-3 bg-white/5 rounded-xl border border-white/10">
                            <p class="text-[10px] text-gray-500 uppercase tracking-widest">Tier Edition</p>
                            <p class="font-bold text-white">${data.tier}</p>
                        </div>
                        <div class="p-4 bg-material-primary/10 rounded-xl border border-material-primary/30 relative group">
                            <p class="text-[10px] text-material-primary uppercase tracking-widest mb-1">License Key</p>
                            <code id="license-key" class="font-mono text-lg text-material-primary font-bold break-all">${data.license_key}</code>
                            <button onclick="copyToClipboard('${data.license_key}')" class="absolute top-2 right-2 text-material-primary hover:text-white transition-colors" title="Copy Key">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <p class="text-[10px] text-gray-500 text-center italic mt-4">Terima kasih telah mendukung pengembangan Aleocrophic!</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Tutup',
                background: '#1a1a24',
                color: '#ffffff',
                customClass: {
                    popup: 'glass-card border border-white/10 rounded-[2rem]',
                    confirmButton: 'btn-material bg-material-primary text-acro-dark font-bold px-6 py-2 rounded-full'
                }
            });
        } else {
            Swal.fire({
                title: 'Gagal',
                text: result.message || 'Data tidak ditemukan.',
                icon: 'error',
                background: '#1a1a24',
                color: '#ffffff',
                customClass: {
                    popup: 'glass-card border border-white/10 rounded-[2rem]',
                    confirmButton: 'btn-material bg-red-500 text-white font-bold px-6 py-2 rounded-full'
                }
            });
        }
    } catch (error) {
        logErrorToService('CHECK_STATUS_ERROR', error.message);
        Swal.fire({
            title: 'Error',
            text: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.',
            icon: 'error',
            background: '#1a1a24',
            color: '#ffffff'
        });
    }
}

/**
 * Utility to copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Key berhasil disalin!',
            showConfirmButton: false,
            timer: 2000,
            background: '#1a1a24',
            color: '#ffffff'
        });
    });
}

// Make functions available globally for onclick events
window.checkOrderStatus = checkOrderStatus;
window.copyToClipboard = copyToClipboard;
window.fetchGitHubReadme = fetchGitHubReadme;

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubReadme();
});

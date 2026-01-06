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

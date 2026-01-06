document.addEventListener('DOMContentLoaded', () => {
    // Check protocol
    if (window.location.protocol === 'file:') {
        console.warn("Aplikasi berjalan via file:// protocol. PHP tidak akan berfungsi. Gunakan server lokal (XAMPP/PHP -S).");
    }

    // Expose function globally for the button onclick
    window.checkOrderStatus = checkOrderStatus;

    // Load GitHub README
    fetchGitHubReadme();
});

function checkOrderStatus() {
    Swal.fire({
        title: '🔍 Cek Status & Claim Key',
        input: 'email',
        inputLabel: 'Masukkan email Trakteer kamu',
        inputPlaceholder: 'email@contoh.com',
        confirmButtonText: 'Cari License',
        showCancelButton: true,
        background: '#1e1b26',
        color: '#fff',
        showLoaderOnConfirm: true,
        customClass: {
            input: 'text-center'
        },
        preConfirm: (email) => {
            if (!email) {
                Swal.showValidationMessage('Email wajib diisi');
                return;
            }
            return fetch(`/api/ACRO PREMIUM/check-status.php?email=${encodeURIComponent(email)}`)
                .then(response => {
                    const contentType = response.headers.get("content-type");
                    if (!response.ok) {
                        if (contentType && contentType.includes("application/json")) {
                            return response.json().then(data => { throw new Error(data.message || 'Gagal memeriksa status.') });
                        } else {
                            throw new Error(`Server Error (${response.status}). Pastikan backend berjalan.`);
                        }
                    }
                    return response.json();
                })
                .catch(error => {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            const data = result.value;
            
            if (data.status === 'success') {
                let htmlContent = `
                    <p class="mb-4 text-gray-300">Terima kasih atas dukunganmu, <b>${data.data.supporter_name}</b>!</p>
                    <div class="key-display select-all" onclick="copyToClipboard(this)">${data.data.license_key}</div>
                    <p class="text-sm text-gray-400 mt-2">Tier: <span class="text-material-primary font-bold">${data.data.tier}</span></p>
                    <p class="text-xs text-gray-500 mt-4">Klik License Key untuk menyalin.</p>
                `;

                Swal.fire({
                    title: '🎉 License Key Ditemukan!',
                    html: htmlContent,
                    icon: 'success',
                    background: '#1e1b26',
                    color: '#fff',
                    confirmButtonText: 'Tutup'
                });
            } else {
                Swal.fire({
                    title: 'Tidak Ditemukan',
                    text: data.message || 'Belum ada donasi yang terverifikasi dengan email ini.',
                    icon: 'info',
                    background: '#1e1b26',
                    color: '#fff'
                });
            }
        }
    });
}

function copyToClipboard(element) {
    const text = element.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalBg = element.style.background;
        element.style.background = 'rgba(0, 255, 0, 0.2)';
        setTimeout(() => {
            element.style.background = originalBg;
        }, 200);
        
        // Optional: Toast notification
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            background: '#1e1b26',
            color: '#fff'
        });
        Toast.fire({
            icon: 'success',
            title: 'Copied to clipboard'
        });
    });
}

async function fetchGitHubReadme() {
    const readmeContainer = document.getElementById('github-readme');
    const readmeBody = document.getElementById('readme-body');
    
    if (!readmeContainer || !readmeBody) return;

    // Show container
    readmeContainer.classList.remove('hidden');

    try {
        // Fetch from GitHub API
        const repoOwner = 'ZetaGo-Aurum';
        const repoName = 'modded-ubuntu';
        const branch = 'main'; // or master
        const response = await fetch(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/README.md`);

        if (!response.ok) {
            throw new Error(`Failed to load README: ${response.status}`);
        }

        const markdown = await response.text();
        
        // Use marked.js to convert Markdown to HTML
        // Note: marked is loaded deferred in index.html
        if (typeof marked !== 'undefined') {
             // Configure marked for safety (optional but recommended)
            // marked.use({ sanitizer: ... }); // Simple usage for now
            
            // Limit content length for preview
            const previewLength = 1000;
            const truncatedMarkdown = markdown.substring(0, previewLength) + '...';
            
            readmeBody.innerHTML = marked.parse(truncatedMarkdown);
        } else {
            // Fallback if marked fails to load
             readmeBody.textContent = "Preview unavailable. Click below to view on GitHub.";
        }

    } catch (error) {
        console.error('Error fetching GitHub README:', error);
        readmeBody.innerHTML = '<p class="text-red-400">Failed to load latest updates from GitHub.</p>';
    }
}

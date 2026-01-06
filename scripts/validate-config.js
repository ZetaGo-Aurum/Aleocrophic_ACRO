const fs = require('fs');
const path = require('path');

function validateVercelConfig() {
    console.log('--- Validating Vercel Configuration ---');
    const projectRoot = path.join(__dirname, '..');
    const vercelConfigPath = path.join(projectRoot, 'vercel.json');
    
    if (!fs.existsSync(vercelConfigPath)) {
        console.error('❌ vercel.json not found!');
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    let errors = 0;

    // Validate Functions
    if (config.functions) {
        for (const pattern in config.functions) {
            console.log(`Checking function pattern: "${pattern}"`);
            
            // Extract the directory part of the pattern (e.g., "api/ACRO PREMIUM/")
            const patternParts = pattern.split('/');
            const wildcardIndex = patternParts.findIndex(part => part.includes('*'));
            
            if (wildcardIndex !== -1) {
                const dirPath = patternParts.slice(0, wildcardIndex).join('/');
                const fullDirPath = path.join(projectRoot, dirPath);
                const extension = patternParts[wildcardIndex].replace('*', '');

                if (!fs.existsSync(fullDirPath)) {
                    console.error(`❌ Directory not found for pattern: ${dirPath}`);
                    errors++;
                } else {
                    // Check if there are any files with the extension in that directory
                    const files = fs.readdirSync(fullDirPath);
                    const matchingFiles = files.filter(f => f.endsWith(extension));
                    
                    if (matchingFiles.length === 0) {
                        console.error(`❌ No files matching "${extension}" found in "${dirPath}"`);
                        errors++;
                    } else {
                        console.log(`✅ Found ${matchingFiles.length} matching file(s) in "${dirPath}"`);
                    }
                }
            } else {
                // Direct file path check
                const fullPath = path.join(projectRoot, pattern);
                if (!fs.existsSync(fullPath)) {
                    console.error(`❌ Function file not found: ${pattern}`);
                    errors++;
                } else {
                    console.log(`✅ Function file exists: ${pattern}`);
                }
            }
        }
    }

    // Validate Routes
    if (config.routes) {
        config.routes.forEach((route, index) => {
            if (route.dest && route.dest.startsWith('/') && !route.dest.includes('$')) {
                const filePath = path.join(projectRoot, route.dest.substring(1));
                if (!fs.existsSync(filePath)) {
                    console.error(`❌ Route ${index} destination "${route.dest}" does not exist.`);
                    errors++;
                } else {
                    console.log(`✅ Route destination "${route.dest}" exists.`);
                }
            }
        });
    }

    if (errors > 0) {
        console.error(`\nFound ${errors} error(s) in vercel.json configuration.`);
        process.exit(1);
    } else {
        console.log('\n✨ Configuration is valid!');
    }
}

validateVercelConfig();

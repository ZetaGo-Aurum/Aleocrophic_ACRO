const fs = require('fs');
const path = require('path');

function validateVercelConfig() {
    console.log('--- Validating Vercel Configuration ---');
    const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
    
    if (!fs.existsSync(vercelConfigPath)) {
        console.error('❌ vercel.json not found!');
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    let errors = 0;

    // Validate Functions
    if (config.functions) {
        for (const pattern in config.functions) {
            const dir = pattern.split('/')[0];
            const fullDir = path.join(__dirname, '..', dir);
            if (!fs.existsSync(fullDir)) {
                console.error(`❌ Function pattern "${pattern}" references non-existent directory: ${dir}`);
                errors++;
            } else {
                console.log(`✅ Function directory "${dir}" exists.`);
            }
        }
    }

    // Validate Routes
    if (config.routes) {
        config.routes.forEach((route, index) => {
            if (route.dest && route.dest.startsWith('/') && !route.dest.includes('$')) {
                const filePath = path.join(__dirname, '..', route.dest.substring(1));
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

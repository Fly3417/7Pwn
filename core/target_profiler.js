const { httpRequest } = require('./engine');
const chalk = require('chalk');

async function profileTarget(url) {
    console.log(chalk.cyan(`\n[*] Menganalisis Target: ${url}`));
    
    const res = await httpRequest(url);
    if (res.status === 'ERROR') return console.log(chalk.red(`[X] Target tidak merespons.`));

    const headers = JSON.stringify(res.headers).toLowerCase();
    const body = res.data.toLowerCase();
    
    let cms = 'Unknown / Custom';
    let server = 'Unknown';
    let backend = 'Unknown';

    // 1. Deteksi Web Server
    if (headers.includes('apache')) server = 'Apache';
    else if (headers.includes('nginx')) server = 'Nginx';
    else if (headers.includes('microsoft-iis')) server = 'IIS';
    else if (headers.includes('litespeed')) server = 'LiteSpeed';

    // 2. Deteksi Backend
    if (headers.includes('x-powered-by: php') || body.includes('php')) backend = 'PHP';
    else if (headers.includes('x-powered-by: express')) backend = 'Node.js (Express)';
    else if (headers.includes('x-powered-by: asp.net')) backend = 'ASP.NET';

    // 3. Deteksi CMS (Context-Aware)
    if (body.includes('wp-content') || body.includes('wp-includes')) {
        cms = 'WordPress';
        backend = 'PHP';
    } else if (body.includes('sites/default/files') || body.includes('drupal')) {
        cms = 'Drupal';
        backend = 'PHP';
    } else if (body.includes('joomla') || body.includes('/media/system/js/')) {
        cms = 'Joomla';
        backend = 'PHP';
    }

    // Tampilkan Hasil
    console.log(chalk.green(`\n[V] HASIL PROFILING:`));
    console.log(chalk.white(`    [+] Web Server : ${chalk.cyan(server)}`));
    console.log(chalk.white(`    [+] CMS        : ${chalk.cyan(cms)}`));
    console.log(chalk.white(`    [+] Backend    : ${chalk.cyan(backend)}`));

    // Rekomendasi Aksi (Sesuai saran kontakmu)
    console.log(chalk.yellow(`\n[*] REKOMENDASI STRATEGI:`));
    if (cms === 'WordPress') {
        console.log(chalk.white(`    - Coba scan direktori wp-content/ dan wp-config.php.`));
        console.log(chalk.white(`    - Cari plugin rentan (gunakan wpscan jika tersedia).`));
        console.log(chalk.white(`    - Fokus pada XSS di halaman komentar.`));
    } else if (cms === 'Drupal') {
        console.log(chalk.white(`    - Coba eksploitasi Drupalgeddon (CVE-2018-7600).`));
        console.log(chalk.white(`    - Scan file CHANGELOG.txt untuk melihat versi Drupal.`));
    } else {
        console.log(chalk.white(`    - Lakukan Mass Dorking parameter '?id=' atau '?page='.`));
        console.log(chalk.white(`    - Uji SQLi pada form login (jika ada).`));
    }
}
module.exports = { profileTarget };
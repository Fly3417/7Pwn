const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const config = require('../config.json');
const { checkVulnerability } = require('./scanner');
const { sleep, logToFile } = require('../core/utils');
const inquirer = require('inquirer');

// Fungsi untuk memuat URL yang sudah ada agar tidak duplikat
function loadExistingTargets() {
    if (!fs.existsSync('targets/list.txt')) return new Set();
    const content = fs.readFileSync('targets/list.txt', 'utf-8');
    const urls = new Set();
    content.split('\n').forEach(line => {
        if (line.trim() !== '') {
            // Ambil URL sebelum tanda '|'
            urls.add(line.split('|')[0]);
        }
    });
    return urls;
}

async function scrapeAndValidate(dork, pages = 1) {
    const urls = new Set();
    const existingTargets = loadExistingTargets();
    const vulnerableUrls = [];
    
    console.log(`\n[*] Memulai Dorking + Auto-Validasi...`);
    console.log(`[*] Dork: "${dork}"`);
    console.log(`[*] Mengambil ${pages} halaman...\n`);
    
    // FASE 1: SCRAPING
    for (let i = 1; i <= pages; i++) {
        try {
            process.stdout.write(`    [+] Mengambil halaman ${i}... `);
            // Rotasi Dork: Menambahkan kata kunci acak agar hasil selalu baru
            const randomKeywords = ['shop', 'berita', 'toko', 'sekolah', 'layanan', 'product', 'news'];
            const randomWord = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
            const finalDork = `${dork} ${randomWord}`;

            const response = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(finalDork)}&first=${(i - 1) * 10 + 1}`, {
                headers: { 'User-Agent': config.user_agent, 'Accept-Language': 'en-US,en;q=0.9' },
                timeout: config.timeout
            });
            
            const $ = cheerio.load(response.data);
            let foundInPage = 0;

            $('a').each((index, element) => {
                const href = $(element).attr('href');
                if (href && href.startsWith('http') && !href.includes('bing.com') && !href.includes('microsoft.com') && href.includes('=')) {
                    // Cek duplikat: Jika belum ada di list.txt dan belum ada di antrean halaman ini
                    if (!existingTargets.has(href) && !urls.has(href)) {
                        urls.add(href);
                        foundInPage++;
                    }
                }
            });

            console.log(`[Dapat ${foundInPage} URL baru]`);
            await sleep(config.dorking.delay_between_pages_ms); 
        } catch (error) {
            console.log(`[X] Error scraping: ${error.message}`);
        }
    }
    
    if (urls.size === 0) {
        console.log(`\n[X] Tidak ada URL baru yang ditemukan (mungkin semua sudah ada di list.txt).`);
        return [];
    }

    // FASE 2: VALIDASI
    console.log(`\n[*] Menguji ${urls.size} URL untuk berbagai kerentanan...`);
    let count = 0;
    
    for (const url of urls) {
        count++;
        process.stdout.write(`    [${count}/${urls.size}] Menguji: ${url.substring(0, 50)}... `);
        
        const result = await checkVulnerability(url);
        
        if (result.isVulnerable) {
            console.log(`[VULNERABLE: ${result.type}]`);
            vulnerableUrls.push({ url: url, type: result.type });
            fs.appendFileSync('targets/list.txt', `${url}|${result.type}\n`);
            logToFile('http_requests.log', `[VULN] ${result.type} found at ${url}`);
        } else {
            console.log(`[Aman]`);
        }
        await sleep(config.dorking.delay_between_tests_ms);
    }

    // FASE 3: RINGKASAN & AUTO-EXPLOIT PROMPT
    if (vulnerableUrls.length > 0) {
        console.log(`\n[V] SUKSES! ${vulnerableUrls.length} target rentan ditemukan.`);
        
        // FITUR BARU: Prompt Auto-Exploit
        const { autoExploit } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'autoExploit',
                message: 'Langsung lakukan Auto-Exploit ke target yang baru ditemukan ini?',
                default: false
            }
        ]);

        if (autoExploit) {
            // Kita panggil modul exploit (akan kita buat di fase selanjutnya)
            console.log(`\n[*] Menyiapkan Auto-Exploit...`);
            // return vulnerableUrls; // Modul index.js akan menangkap ini
            return vulnerableUrls; 
        }
    } else {
        console.log(`\n[X] Tidak ada target rentan yang ditemukan dari dork ini.`);
    }

    return vulnerableUrls;
}

module.exports = { scrapeAndValidate };
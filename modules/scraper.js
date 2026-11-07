const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const config = require('../config.json');
const { checkVulnerability } = require('./scanner');
const { sleep, logToFile } = require('../core/utils');
const inquirer = require('inquirer');

function loadExistingTargets() {
    if (!fs.existsSync('targets/list.txt')) return new Set();
    const content = fs.readFileSync('targets/list.txt', 'utf-8');
    const urls = new Set();
    content.split('\n').forEach(line => {
        if (line.trim() !== '') {
            urls.add(line.split('|')[0]);
        }
    });
    return urls;
}

async function scrapeAndValidate(dork, pages = 1) {
    const urls = new Set();
    const existingTargets = loadExistingTargets();
    const vulnerableUrls = [];
    
    // Bersihkan dork dari tanda kutip ganda yang merusak query Bing
    const cleanDork = dork.replace(/"/g, '');
    
    console.log(`\n[*] Memulai Dorking + Auto-Validasi...`);
    console.log(`[*] Dork (Clean): "${cleanDork}"`);
    console.log(`[*] Mengambil ${pages} halaman...\n`);
    
    for (let i = 1; i <= pages; i++) {
        try {
            process.stdout.write(`    [+] Mengambil halaman ${i}... `);
            
            // Rotasi kata kunci agar hasil selalu dinamis
            const randomKeywords = ['shop', 'berita', 'toko', 'sekolah', 'layanan', 'product', 'news', 'portal', 'data'];
            const randomWord = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
            const finalDork = `${cleanDork} ${randomWord}`;

            const response = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(finalDork)}&first=${(i - 1) * 10 + 1}`, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 15000
            });
            
            const $ = cheerio.load(response.data);
            let foundInPage = 0;

            // Selector CSS yang lebih akurat untuk Bing: mencari link di dalam heading (h2)
            $('li.b_algo h2 a').each((index, element) => {
                let href = $(element).attr('href');
                
                if (href && href.startsWith('http') && !href.includes('bing.com') && !href.includes('microsoft.com')) {
                    // Filter hanya URL yang punya parameter '='
                    if (href.includes('=')) {
                        if (!existingTargets.has(href) && !urls.has(href)) {
                            urls.add(href);
                            foundInPage++;
                        }
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
        console.log(`\n[X] Tidak ada URL baru yang ditemukan.`);
        console.log(`    [!] Tips: Coba Dork lain tanpa tanda kutip, contoh: inurl:php?id= atau inurl:news.php?id=`);
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

    if (vulnerableUrls.length > 0) {
        console.log(`\n[V] SUKSES! ${vulnerableUrls.length} target rentan disimpan di targets/list.txt`);
    } else {
        console.log(`\n[X] Tidak ada target rentan yang ditemukan dari dork ini.`);
    }

    return vulnerableUrls;
}

module.exports = { scrapeAndValidate };
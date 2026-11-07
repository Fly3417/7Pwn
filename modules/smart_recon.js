const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const config = require('../config.json');
const { checkVulnerability } = require('./scanner');
const { sleep } = require('../core/utils');
const chalk = require('chalk');

async function smartReconWorkflow(dork, pages = 1) {
    console.log(chalk.cyan(`\n[*] Memulai Smart Workflow: Recon -> Filter -> Scan -> Save`));
    console.log(chalk.white(`    [Target Dork] : ${dork}`));
    
    const cleanDork = dork.replace(/"/g, '');
    const urls = new Set();
    
    // FASE 1: RECON (Dorking)
    console.log(chalk.yellow(`\n[1] Mencari Target (Recon)...`));
    for (let i = 1; i <= pages; i++) {
        try {
            process.stdout.write(`    [+] Halaman ${i}... `);
            const finalDork = `${cleanDork} shop OR news OR portal`; // Rotasi keyword
            const response = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(finalDork)}&first=${(i - 1) * 10 + 1}`, {
                headers: { 'User-Agent': config.user_agent },
                timeout: 15000
            });
            
            const $ = cheerio.load(response.data);
            let found = 0;
            $('li.b_algo h2 a').each((_, el) => {
                let href = $(el).attr('href');
                if (href && href.startsWith('http') && href.includes('=') && !href.includes('bing.com')) {
                    urls.add(href);
                    found++;
                }
            });
            console.log(`[Dapat ${found} URL]`);
            await sleep(1500);
        } catch (e) {
            console.log(`[X] Gagal di halaman ${i}`);
        }
    }

    if (urls.size === 0) {
        return console.log(chalk.red(`\n[X] Tidak ada URL ditemukan.`));
    }

    // FASE 2 & 3: PRE-CONDITION & SCAN
    console.log(chalk.yellow(`\n[2] Filtering & Scanning (Pre-condition -> Vuln check)...`));
    console.log(chalk.white(`    [Total] : ${urls.size} URL akan diuji`));
    
    let vulnCount = 0;
    const vulnFile = 'results/vulnerable.txt';

    for (const url of urls) {
        process.stdout.write(`    [*] Menguji: ${url.substring(0, 40)}... `);
        
        // PRE-CONDITION: Cek dulu apakah web hidup (200 OK)
        try {
            const checkAlive = await axios.get(url, { timeout: 5000, validateStatus: false });
            
            // Jika mati (500/404), skip. Jika hidup, lanjut Scan.
            if (checkAlive.status >= 200 && checkAlive.status < 400) {
                process.stdout.write(chalk.gray(`(Hidup) -> `));
                
                // SCAN: Cek SQLi/LFI
                const result = await checkVulnerability(url);
                
                if (result.isVulnerable) {
                    console.log(chalk.green(`[RENTAN: ${result.type}]`));
                    fs.appendFileSync(vulnFile, `${url}|${result.type}\n`);
                    vulnCount++;
                } else {
                    console.log(chalk.red(`[Aman]`));
                }
            } else {
                console.log(chalk.gray(`[Mati/Skip]`));
            }
        } catch (error) {
            console.log(chalk.gray(`[Timeout/Skip]`));
        }
        await sleep(config.dorking.delay_between_tests_ms);
    }

    // FASE 4: WRITE REAL-TIME (Report)
    console.log(chalk.cyan(`\n[3] Kesimpulan:`));
    console.log(chalk.white(`    [+] Total Target : ${urls.size}`));
    console.log(chalk.white(`    [+] Rentan      : ${chalk.green(vulnCount)}`));
    console.log(chalk.white(`    [+] File Log    : ${chalk.yellow(vulnFile)}`));
    
    if (vulnCount > 0) {
        console.log(chalk.green(`\n[V] Target rentan berhasil disimpan ke ${vulnFile}.`));
    } else {
        console.log(chalk.red(`\n[X] Tidak ada target rentan dari batch ini.`));
    }
}

module.exports = { smartReconWorkflow };
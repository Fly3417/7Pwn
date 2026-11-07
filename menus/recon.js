const inquirer = require('inquirer');
const fs = require('fs');
const chalk = require('chalk');
const config = require('../config.json');
const { showBanner } = require('../core/ui');
const { scrapeAndValidate } = require('../modules/scraper');
const { detectWAF } = require('../modules/waf_detector');
const { fetchRawFromRepo } = require('../modules/github_payloads');

async function handleRecon() {
    let backToMain = false;
    while (!backToMain) {
        process.stdout.write('\x1B[3J\x1B[2J\x1B[0f');
        showBanner();
        
        console.log(chalk.cyan.bold('╔════════════ RECONNAISSANCE ═══════════╗'));
        console.log(chalk.white('  [1] 📡 Mass Dorking + Auto-Validate'));
        console.log(chalk.white('  [2] ✍️  Input Target Manual'));
        console.log(chalk.white('  [3] 🔄 Scan Ulang targets/list.txt'));
        console.log(chalk.white('  [4] 🛡️  Cek WAF pada Target'));
        console.log(chalk.white('  [5] 🐙 GitHub Payload Manager'));
        console.log(chalk.red('  [0] ⬅️  Kembali ke Main Menu'));
        console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝'));

        const { reconChoice } = await inquirer.prompt([{ type: 'input', name: 'reconChoice', message: chalk.cyan('➜ Pilih menu [0-5]:') }]);

        switch (reconChoice) {
            case '1':
                showBanner();
                const { dork, pages } = await inquirer.prompt([
                    { type: 'input', name: 'dork', message: '➜ Masukkan Dork Universal:', default: 'inurl:".php?id="' },
                    { type: 'number', name: 'pages', message: '➜ Berapa halaman?', default: 2 }
                ]);
                await scrapeAndValidate(dork, pages);
                await pause(); break;
            case '2':
                showBanner();
                const { manualUrl } = await inquirer.prompt([{ type: 'input', name: 'manualUrl', message: '➜ Masukkan URL Target:' }]);
                fs.appendFileSync('targets/list.txt', manualUrl + '\n');
                console.log(chalk.green(`\n[V] URL ditambahkan.`));
                await pause(); break;
            case '3':
                showBanner(); console.log(chalk.yellow('\n[!] Fitur Scan Ulang (Backlog).')); await pause(); break;
            case '4':
                showBanner();
                const { wafUrl } = await inquirer.prompt([{ type: 'input', name: 'wafUrl', message: '➜ Masukkan URL cek WAF:' }]);
                const wafResult = await detectWAF(wafUrl);
                console.log(chalk.cyan(`\n[HASIL] WAF: ${wafResult}`));
                await pause(); break;
            case '5':
                await handleGithubMenu(); // Panggil Sub-menu GitHub
                break;
            case '0': backToMain = true; break;
            default: console.log(chalk.red('\n[X] Pilihan tidak valid.')); await pause();
        }
    }
}

// Sub-menu Khusus GitHub
async function handleGithubMenu() {
    let back = false;
    while (!back) {
        process.stdout.write('\x1B[3J\x1B[2J\x1B[0f');
        showBanner();
        
        // Cek status token saat ini
        const currentToken = config.github_token || '';
        const tokenStatus = currentToken ? chalk.green('Tersimpan (Aktif)') : chalk.red('Kosong (Rate limit 60/jam)');

        console.log(chalk.cyan.bold('╔════════════ GITHUB MANAGER ═══════════╗'));
        console.log(chalk.white('  [1] 🔑 Atur GitHub Token'));
        console.log(chalk.white('  [2] 📥 Download Payload dari Repo URL'));
        console.log(chalk.red('  [0] ⬅️  Kembali'));
        console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝'));
        console.log(chalk.gray(`  Status Token: ${tokenStatus}`));

        const { ghChoice } = await inquirer.prompt([{ type: 'input', name: 'ghChoice', message: chalk.cyan('\n➜ Pilih menu [0-2]:') }]);

        switch (ghChoice) {
            case '1':
                showBanner();
                console.log(chalk.cyan('--- ATUR GITHUB TOKEN ---'));
                const { newToken } = await inquirer.prompt([
                    { type: 'input', name: 'newToken', message: '➜ Masukkan GitHub Token Baru (biarkan kosong untuk hapus):', default: currentToken }
                ]);
                
                // Update config.json
                config.github_token = newToken.trim();
                fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
                console.log(chalk.green('\n[V] Token berhasil diperbarui dan disimpan ke config.json!'));
                await pause();
                break;
            case '2':
                showBanner();
                console.log(chalk.cyan('--- DOWNLOAD PAYLOAD DARI GITHUB REPO ---'));
                const ghAns = await inquirer.prompt([
                    { 
                        type: 'input', 
                        name: 'repoUrl', 
                        message: '➜ Masukkan URL Repo GitHub:', 
                        default: 'https://github.com/payload-box/sql-injection-payload-list' 
                    },
                    {
                        type: 'list',
                        name: 'type',
                        message: '➜ Pilih Tipe Kerentanan:',
                        choices: ['sqli', 'lfi', 'rce']
                    }
                ]);

                const savePath = ghAns.type === 'sqli' ? 'wordlists/sqli_payloads.txt' : 
                                 ghAns.type === 'lfi' ? 'wordlists/lfi_payloads.txt' : 
                                 'wordlists/rce_payloads.txt';

                // Gunakan token dari config
                await fetchRawFromRepo(ghAns.repoUrl, ghAns.type, config.github_token || '', savePath);
                await pause();
                break;
            case '0': back = true; break;
            default: console.log(chalk.red('\n[X] Pilihan tidak valid.')); await pause();
        }
    }
}

async function pause() { await inquirer.prompt([{ type: 'input', name: 'pause', message: chalk.gray('Tekan Enter...') }]); }
module.exports = { handleRecon };
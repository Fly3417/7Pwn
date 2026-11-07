const inquirer = require('inquirer');
const fs = require('fs');
const chalk = require('chalk');

const { showBanner, showMainMenu } = require('./core/ui');

// Import Submenus
const { handleRecon } = require('./menus/recon');
const { handleExploit } = require('./menus/exploit');
const { handlePost } = require('./menus/post');
const { handleLoot } = require('./menus/loot_manager');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const dirs = ['targets', 'results', 'logs', 'loot', 'core', 'modules', 'menus', 'payloads', 'wordlists'];
    dirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

    let isRunning = true;

    while (isRunning) {
        showBanner();
        showMainMenu();

        const { mainChoice } = await inquirer.prompt([
            { type: 'input', name: 'mainChoice', message: chalk.green('➜ Pilih menu [0-5]:') }
        ]);

        switch (mainChoice) {
            case '1': await handleRecon(); break;
            case '2': await handleExploit(); break;
            case '3': await handlePost(); break;
            case '4': await handleLoot(); break;
            case '5':
                showBanner();
                console.log(chalk.yellow('\n[!] Modul Pengaturan (Config & Payloads) sedang dalam pengembangan.'));
                await pause();
                break;
            case '0':
                await cinematicExit();
                isRunning = false;
                break;
            default:
                console.log(chalk.red('\n[X] Pilihan tidak valid.'));
                await pause();
        }
    }
}

async function pause() {
    await inquirer.prompt([{ type: 'input', name: 'pause', message: chalk.gray('Tekan Enter untuk melanjutkan...') }]);
}

async function cinematicExit() {
    // Bersihkan layar dan scrollback
    process.stdout.write('\x1B[3J\x1B[2J\x1B[0f');
    await sleep(500);

    // Animasi Cleanup
    console.log(chalk.gray('\n\n  [*] Menutup koneksi ke target...'));
    await sleep(600);
    console.log(chalk.gray('  [*] Menghapus cache session lokal...'));
    await sleep(600);
    console.log(chalk.gray('  [*] Mengenkripsi log aktivitas...'));
    await sleep(600);
    console.log(chalk.gray('  [*] Memutuskan koneksi proxy...\n'));
    await sleep(800);

    process.stdout.write('\x1B[3J\x1B[2J\x1B[0f'); // Bersihkan lagi sebelum kotak
    console.log('\n\n');

    // Desain Kotak yang Rapi dan Simetris (Persis seperti permintaan)
    console.log(chalk.red.bold('╔═══════════════════════════════════════════════════╗'));
    console.log(chalk.red.bold('║') + chalk.white.bold('             S E S S I O N   E N D E D             ') + chalk.red.bold('║'));
    console.log(chalk.red.bold('╠═══════════════════════════════════════════════════╣'));
    console.log(chalk.red.bold('║') + chalk.gray('  Status   : ') + chalk.green.bold('SUCCESS') + chalk.gray('                               ') + chalk.red.bold('║'));
    console.log(chalk.red.bold('║') + chalk.gray('  Target   : ') + chalk.white('Multiple / Auto-Scan') + chalk.gray('                     ') + chalk.red.bold('║'));
    console.log(chalk.red.bold('║') + chalk.gray('  Log File : ') + chalk.cyan('logs/http_requests.log') + chalk.gray('                  ') + chalk.red.bold('║'));
    console.log(chalk.red.bold('║') + chalk.gray('  Operator : ') + chalk.magenta.bold('SevenByte') + chalk.gray('                             ') + chalk.red.bold('║'));
    console.log(chalk.red.bold('╚═══════════════════════════════════════════════════╝'));
    
    console.log(chalk.gray.italic('\n          Terima kasih telah menggunakan 7Pwn.'));
    console.log(chalk.gray.italic('       "Pwning Website Authorize - Build to Understand"\n\n'));

    // Countdown Penutupan
    let countdown = 3;
    while (countdown > 0) {
        process.stdout.write(chalk.yellow(`\r             Terminal akan tertutup dalam ${countdown} detik... `));
        await sleep(1000);
        countdown--;
    }
    
    process.stdout.write(chalk.green(`\r             [V] Sesi berakhir. Selamat tinggal!          \n\n`));
    await sleep(800);
    process.exit(0);
}

main();
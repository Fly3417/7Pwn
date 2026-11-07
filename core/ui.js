const chalk = require('chalk');
const config = require('../config.json');

function showBanner() {
    // \x1B[3J = Hapus scrollback buffer (riwayat ke atas)
    // \x1B[2J = Hapus layar yang terlihat
    // \x1B[0f = Pindahkan kursor ke pojok kiri atas
    process.stdout.write('\x1B[3J\x1B[2J\x1B[0f');
    
    // Banner ASCII pilihanmu
    console.log(chalk.cyan(`
██████╗░░██╗░░░░░░░██╗███╗░░██╗██╗███╗░░██╗░██████╗░
██╔══██╗░██║░░██╗░░██║████╗░██║██║████╗░██║██╔════╝░
██████╔╝░╚██╗████╗██╔╝██╔██╗██║██║██╔██╗██║██║░░██╗░
██╔═══╝░░░████╔═████║░██║╚████║██║██║╚████║██║░░╚██╗
██║░░░░░░░╚██╔╝░╚██╔╝░██║░╚███║██║██║░╚███║╚██████╔╝
╚═╝░░░░░░░░╚═╝░░░╚═╝░░╚═╝░░╚══╝╚═╝╚═╝░░╚══╝░╚═════╝░
    `));
    
    // Desain teks bawah banner
    console.log(chalk.bgCyan.black.bold('        Pwning Website Authorize        '));
    console.log(chalk.gray.italic('             By SevenByte\n'));
    console.log(chalk.yellow(`    [ 7Pwn Universal Framework v${config.version} ]\n`));
}

function showMainMenu() {
    console.log(chalk.yellow.bold('╔══════════════ MAIN MENU ══════════════╗'));
    console.log(chalk.white('  [1] 🕵️  Reconnaissance (Scan & Dorking)'));
    console.log(chalk.white('  [2] 💥 Exploitation (Auto-Pwn & Shell)'));
    console.log(chalk.white('  [3] 👑 Post-Exploitation (Deface/RCE)'));
    console.log(chalk.white('  [4] 💰 Loot Manager (Hasil Curian)'));
    console.log(chalk.white('  [5] ⚙️  Pengaturan (Config & Payloads)'));
    console.log(chalk.red('  [0] 🚪 Keluar'));
    console.log(chalk.yellow.bold('╚═══════════════════════════════════════╝'));
}

module.exports = { showBanner, showMainMenu };
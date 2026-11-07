const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function viewLoot() {
    const lootDir = 'loot';
    const logDir = 'logs';

    console.log(chalk.cyan('\n=== LOOT MANAGER ==='));

    // 1. Cek Folder Loot (Database, dll)
    if (fs.existsSync(lootDir)) {
        const lootFiles = fs.readdirSync(lootDir).filter(f => f !== '.gitkeep');
        if (lootFiles.length > 0) {
            console.log(chalk.green('\n[+] Hasil Curian (Loot):'));
            lootFiles.forEach(f => {
                const stats = fs.statSync(path.join(lootDir, f));
                console.log(chalk.white(`  - ${f} (${(stats.size / 1024).toFixed(2)} KB)`));
            });
        } else {
            console.log(chalk.gray('\n[-] Folder loot masih kosong.'));
        }
    }

    // 2. Cek File Log SQLmap
    if (fs.existsSync(logDir)) {
        const logFiles = fs.readdirSync(logDir).filter(f => f.startsWith('sqlmap_'));
        if (logFiles.length > 0) {
            console.log(chalk.green('\n[+] Log SQLmap Tersimpan:'));
            logFiles.forEach(f => {
                console.log(chalk.white(`  - ${f}`));
            });
        } else {
            console.log(chalk.gray('\n[-] Belum ada log exploit.'));
        }
    }
}

module.exports = { viewLoot };
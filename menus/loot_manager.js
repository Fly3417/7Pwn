const inquirer = require('inquirer');
const chalk = require('chalk');
const { showBanner } = require('../core/ui');
const { viewLoot } = require('../modules/loot_manager');

async function handleLoot() {
    let backToMain = false;
    while (!backToMain) {
        process.stdout.write('\x1B[3J\x1B[2J\x1B[0f');
        showBanner();
        
        viewLoot();
        
        console.log(chalk.gray('\n-----------------------------------------'));
        const { lootChoice } = await inquirer.prompt([{ type: 'input', name: 'lootChoice', message: chalk.cyan('➜ Tekan [0] untuk kembali:') }]);

        if (lootChoice === '0') {
            backToMain = true;
        }
    }
}
module.exports = { handleLoot };
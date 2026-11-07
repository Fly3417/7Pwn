const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config.json');

// 1. Membaca file payload dari wordlists
function loadPayloads(type) {
    let filePath = '';
    
    // Cek tipe payload berdasarkan config
    if (type === 'sqli') filePath = config.paths.wordlists.sqli;
    else if (type === 'lfi') filePath = config.paths.wordlists.lfi;
    else if (type === 'rce') filePath = config.paths.wordlists.rce;
    else if (type === 'xss') filePath = config.paths.wordlists.xss;
    else if (type === 'shell_paths') filePath = config.paths.wordlists.shell_paths;
    
    if (!filePath || !fs.existsSync(filePath)) {
        console.log(`[X] File wordlist tidak ditemukan: ${filePath}`);
        return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    // Pisahkan per baris, buang baris kosong dan komentar (#)
    return content.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '' && !line.startsWith('#'));
}

// 2. Membaca file fisik (seperti Webshell) untuk di-deploy
function readPayloadFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`[X] File payload tidak ditemukan: ${filePath}`);
        return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
}

// 3. Generate Hash (untuk nama file log unik)
function generateHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

// 4. Logger ke file
function logToFile(filename, text) {
    const logDir = config.paths.logs;
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(logDir, filename), `[${timestamp}] ${text}\n`);
}

// 5. Fungsi Jeda (Delay)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { loadPayloads, readPayloadFile, generateHash, logToFile, sleep };
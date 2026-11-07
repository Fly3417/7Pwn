const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk');
const { URL } = require('url');

// Fungsi untuk mengekstrak baris yang terlihat seperti payload
function extractPayloads(content, type) {
    const lines = content.split('\n');
    return lines.filter(line => {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed.startsWith('#') || trimmed.startsWith('//')) return false;

        // Filter kasar berdasarkan tipe kerentanan
        if (type === 'sqli') {
            return trimmed.includes("'") || trimmed.includes('"') || 
                   trimmed.toUpperCase().includes('SELECT') || 
                   trimmed.toUpperCase().includes('UNION') || 
                   trimmed.toUpperCase().includes('SLEEP') || 
                   trimmed.includes('--') || trimmed.includes('/*');
        } else if (type === 'lfi') {
            return trimmed.includes('../') || trimmed.includes('/etc/') || trimmed.includes('php://');
        } else if (type === 'rce') {
            return trimmed.includes(';') || trimmed.includes('|') || 
                   trimmed.includes('$(') || trimmed.includes('`') || trimmed.includes('&&');
        }
        return false;
    });
}

async function fetchRawFromRepo(repoUrl, type, token, saveToFile) {
    console.log(chalk.cyan(`\n[*] Memproses URL Repositori: ${repoUrl}`));
    
    try {
        // 1. Parsing URL GitHub
        const urlObj = new URL(repoUrl);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length < 2) throw new Error("URL GitHub tidak valid.");
        
        const owner = pathParts[0];
        const repo = pathParts[1];

        const headers = { 'User-Agent': '7Pwn-Framework' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // 2. Dapatkan default branch
        const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const repoRes = await axios.get(repoApiUrl, { headers });
        const defaultBranch = repoRes.data.default_branch || 'main';
        console.log(chalk.gray(`    [*] Owner: ${owner} | Repo: ${repo} | Branch: ${defaultBranch}`));

        // 3. Ambil struktur folder utama (root)
        const treeApiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
        const treeRes = await axios.get(treeApiUrl, { headers });
        
        // 4. Cari file yang relevan (berdasarkan ekstensi txt/md dan nama file)
        const keyword = type === 'sqli' ? 'sql' : type === 'lfi' ? 'lfi' : 'rce';
        const filesToFetch = treeRes.data.tree.filter(item => {
            if (item.type !== 'blob') return false;
            const name = item.path.toLowerCase();
            return (name.endsWith('.txt') || name.endsWith('.md')) && 
                   (name.includes(keyword) || name.includes('payload') || name.includes('list'));
        });

        if (filesToFetch.length === 0) {
            console.log(chalk.yellow(`    [!] Tidak ada file yang cocok (${type}) di repositori ini.`));
            return false;
        }

        console.log(chalk.gray(`    [*] Menemukan ${filesToFetch.length} file yang relevan. Mulai mengunduh Raw...`));

        let allPayloads = [];

        // 5. Unduh versi Raw dan ekstrak payload
        for (const file of filesToFetch) {
            process.stdout.write(chalk.gray(`        - Downloading: ${file.path}... `));
            
            // Gunakan raw.githubusercontent.com
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`;
            try {
                const rawRes = await axios.get(rawUrl);
                const extracted = extractPayloads(rawRes.data, type);
                
                if (extracted.length > 0) {
                    allPayloads = allPayloads.concat(extracted);
                    console.log(chalk.green(`[${extracted.length} payload]`));
                } else {
                    console.log(chalk.gray(`[0 payload]`));
                }
            } catch (e) {
                console.log(chalk.red(`[Gagal]`));
            }
        }

        // 6. Simpan hasil
        if (allPayloads.length > 0) {
            // Hilangkan duplikat
            const uniquePayloads = [...new Set(allPayloads)];
            fs.writeFileSync(saveToFile, uniquePayloads.join('\n'), 'utf-8');
            console.log(chalk.green(`\n[V] SUKSES! ${uniquePayloads.length} payload unik disimpan ke ${saveToFile}`));
            return true;
        } else {
            console.log(chalk.yellow('\n[!] Tidak ada payload yang berhasil diekstrak.'));
            return false;
        }

    } catch (error) {
        console.log(chalk.red(`\n[X] Error: ${error.message}`));
        return false;
    }
}

module.exports = { fetchRawFromRepo };
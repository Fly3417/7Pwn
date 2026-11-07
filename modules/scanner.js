const { httpRequest } = require('../core/engine');
const { loadPayloads } = require('../core/utils');

async function checkVulnerability(url) {
    if (!url.includes('=')) return { isVulnerable: false, type: "No Parameters" };

    // Parsing URL dengan API bawaan Node.js
    let urlObj;
    try {
        urlObj = new URL(url);
    } catch (e) {
        return { isVulnerable: false, type: "Invalid URL" };
    }

    // Ambil parameter pertama yang ditemukan untuk diuji
    const firstParam = urlObj.searchParams.keys().next().value;
    if (!firstParam) return { isVulnerable: false, type: "No Parameters" };

    // Simpan nilai asli, kita akan menggantinya dengan payload
    const originalValue = urlObj.searchParams.get(firstParam);

    // Helper untuk mengganti parameter
    const buildTestUrl = (payload) => {
        const newUrlObj = new URL(url);
        newUrlObj.searchParams.set(firstParam, payload);
        return newUrlObj.toString();
    };

    // 1. Uji SQL Injection
    const sqliPayloads = loadPayloads('sqli');
    for (const payload of sqliPayloads) {
        const testUrl = buildTestUrl(originalValue + payload); // Tambahkan ' ke nilai asli
        const res = await httpRequest(testUrl);
        
        const sqliRegex = /SQL syntax|mysql_fetch|Warning: mysqli|Unclosed quotation|PostgreSQL.*ERROR|ORA-[0-9]{5}/i;
        if (sqliRegex.test(res.data)) {
            return { isVulnerable: true, type: "SQL Injection (Error)", payload: payload };
        }
    }

    // 2. Uji LFI (Mengganti nilai asli sepenuhnya)
    const lfiPayloads = loadPayloads('lfi');
    for (const payload of lfiPayloads) {
        const testUrl = buildTestUrl(payload);
        const res = await httpRequest(testUrl);
        if (res.data.includes('root:x:0:0') || res.data.includes('[extensions]')) {
            return { isVulnerable: true, type: "Local File Inclusion (LFI)", payload: payload };
        }
    }

    // 3. Uji RCE (Mengganti nilai asli sepenuhnya)
    const rcePayloads = loadPayloads('rce');
    for (const payload of rcePayloads) {
        const testUrl = buildTestUrl(payload);
        const res = await httpRequest(testUrl);
        if (res.data.includes('uid=') && res.data.includes('gid=')) {
            return { isVulnerable: true, type: "Command Injection (RCE)", payload: payload };
        }
    }

    // 4. Uji XSS (Mengganti nilai asli sepenuhnya)
    const xssPayloads = loadPayloads('xss');
    for (const payload of xssPayloads) {
        const testUrl = buildTestUrl(payload);
        const res = await httpRequest(testUrl);
        // Cek apakah payload muncul mentah
        if (res.data.includes(payload)) {
            return { isVulnerable: true, type: "Reflected XSS", payload: payload };
        }
    }

    return { isVulnerable: false, type: "Secure/Blocked" };
}

module.exports = { checkVulnerability };
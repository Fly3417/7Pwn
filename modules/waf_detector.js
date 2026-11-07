const axios = require('axios');
const config = require('../config.json');

async function detectWAF(url) {
    console.log(`\n[*] Mendeteksi WAF pada: ${url}`);
    try {
        const payload = `<script>alert(1)</script>`;
        const testUrl = `${url}?test=${encodeURIComponent(payload)}`;
        
        const response = await axios.get(testUrl, {
            headers: { 'User-Agent': config.user_agent },
            validateStatus: false,
            timeout: config.timeout
        });

        const headers = JSON.stringify(response.headers).toLowerCase();
        const data = typeof response.data === 'string' ? response.data.toLowerCase() : '';

        if (headers.includes('cf-ray') || data.includes('cloudflare')) return "Cloudflare";
        if (headers.includes('incap_ses') || data.includes('incapsula')) return "Imperva Incapsula";
        if (response.status === 403 || response.status === 406) return "Unknown WAF (HTTP 403/406)";

        return "Tidak terdeteksi WAF / Bypassable";
    } catch (error) {
        return "Error / Timeout";
    }
}
module.exports = { detectWAF };

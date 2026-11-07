const config = require('../config.json');

// Fungsi untuk menghasilkan header spoofing WAF
function getEvasionHeaders() {
    const headers = {};
    
    if (config.waf && config.waf.bypass_headers) {
        // Trik umum untuk bypass WAF berbasis IP (seolah-olah request dari internal)
        headers['X-Forwarded-For'] = '127.0.0.1';
        headers['X-Originating-IP'] = '127.0.0.1';
        headers['X-Remote-IP'] = '127.0.0.1';
        headers['X-Remote-Addr'] = '127.0.0.1';
        headers['X-Client-IP'] = '127.0.0.1';
        headers['X-Host'] = '127.0.0.1';
    }

    return headers;
}

module.exports = { getEvasionHeaders };
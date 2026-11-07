const config = require('../config.json');

// Fungsi untuk merotasi tamper script jika WAF memblokir
function getBypassTamper() {
    if (!config.waf || !config.waf.tamper_list || config.waf.tamper_list.length === 0) {
        return '';
    }
    // Gabungkan tamper script dengan koma (format yang diminta sqlmap)
    return config.waf.tamper_list.join(',');
}

// Fungsi untuk memanipulasi header (jika diperlukan di masa depan)
function getBypassHeaders() {
    if (config.waf && config.waf.bypass_headers) {
        return {
            'X-Forwarded-For': '127.0.0.1',
            'X-Originating-IP': '127.0.0.1'
        };
    }
    return {};
}

module.exports = { getBypassTamper, getBypassHeaders };
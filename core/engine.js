const { spawn } = require('child_process');
const axios = require('axios');
const config = require('../config.json');

// 1. Eksekusi command line (real-time output)
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, options);
        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            if (options.showOutput) {
                process.stdout.write(`    ${text}`);
            }
        });

        child.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            if (options.showOutput) {
                process.stderr.write(`    [ERR] ${text}`);
            }
        });

        child.on('close', (code) => {
            resolve({ code, output, errorOutput });
        });
        
        child.on('error', (err) => {
            reject(err);
        });
    });
}

// 2. HTTP Request Universal (dengan bypass WAF header jika diaktifkan)
async function httpRequest(url, method = 'GET', data = null, customHeaders = {}) {
    const headers = {
        'User-Agent': config.user_agent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        ...customHeaders
    };

    // Fitur Bypass WAF Sederhana (Header Spoofing)
    if (config.waf && config.waf.bypass_headers) {
        headers['X-Forwarded-For'] = '127.0.0.1';
        headers['X-Originating-IP'] = '127.0.0.1';
        headers['X-Remote-IP'] = '127.0.0.1';
        headers['X-Remote-Addr'] = '127.0.0.1';
    }

    try {
        const response = await axios({
            method,
            url,
            data,
            headers,
            validateStatus: false, // Biarkan ambil status apapun (200, 403, 500)
            timeout: config.timeout,
            maxRedirects: 5
        });
        
        return {
            status: response.status,
            headers: response.headers,
            data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        };
    } catch (error) {
        return {
            status: 'ERROR',
            headers: {},
            data: error.message
        };
    }
}

module.exports = { runCommand, httpRequest };
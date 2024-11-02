const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');

class DuckChainFaucet {
    constructor() {
        this.headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Origin": "https://testnet-faucet.duckchain.io",
            "Referer": "https://testnet-faucet.duckchain.io/",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?1",
            "Sec-Ch-Ua-Platform": '"Android"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36"
        };
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [✓] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [✗] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [!] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [ℹ] ${msg}`.blue);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            const timestamp = new Date().toLocaleTimeString();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${timestamp}] [*] Chờ ${i} giây để tiếp tục...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    async claimFaucet(authorization, address) {
        try {
            const response = await axios.get(`https://testnet-faucet-api.duckchain.io/api/duckchain/claim_faucet?address=${address}`, {
                headers: {
                    ...this.headers,
                    'Authorization': authorization
                }
            });

            if (response.data.describe === "Token Claim successfully.") {
                this.log('Claim token thành công', 'success');
                return { success: true };
            } else if (response.data.describe === "You have already claimed token today.") {
                this.log('Hôm nay bạn đã claim token rồi, quay lại vào ngày mai', 'warning');
                return { success: false, needWait: true, ttl: response.data.ttl };
            } else {
                return { success: false, error: response.data.describe };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async main() {
        const dataFile = path.join(__dirname, 'auth.txt');
        const walletFile = path.join(__dirname, 'wallet.txt');

        const authorizations = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        const wallets = fs.readFileSync(walletFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);


        while (true) {
            for (let i = 0; i < authorizations.length; i++) {
                const authorization = authorizations[i];
                const wallet = wallets[i];

                console.log(`========== Tài khoản ${i + 1} ==========`);
                this.log(`Đang claim token cho ví: ${wallet}`, 'info');

                const result = await this.claimFaucet(authorization, wallet);
                
                if (!result.success && result.needWait) {
                    await this.countdown(result.ttl);
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            await this.countdown(86400);
        }
    }
}

const client = new DuckChainFaucet();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});
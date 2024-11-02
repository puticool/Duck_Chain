const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const printLogo = require('./src/logo');

class DuckChainAPIClient {
    constructor() {
        this.headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Origin": "https://tgdapp.duckchain.io",
            "Referer": "https://tgdapp.duckchain.io/",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        };
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [*] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [*] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [*] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [*] ${msg}`.blue);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            const timestamp = new Date().toLocaleTimeString();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${timestamp}] [*] Waiting ${i} seconds to continue...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    async getUserInfo(authorization) {
        try {
            const response = await axios.get('https://preapi.duckchain.io/user/info', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });

            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async setDuckName(authorization, duckName) {
        try {
            const encodedDuckName = encodeURIComponent(duckName);
            const response = await axios.get(`https://preapi.duckchain.io/user/set_duck_name?duckName=${encodedDuckName}`, {
                headers: {
                    ...this.headers,
                    'Authorization': authorization
                }
            });

            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTaskList(authorization) {
        try {
            const response = await axios.get('https://preapi.duckchain.io/task/task_list', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getTaskInfo(authorization) {
        try {
            const response = await axios.get('https://preapi.duckchain.io/task/task_info', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async performDailyCheckIn(authorization) {
        try {
            const response = await axios.get('https://preapi.duckchain.io/task/sign_in', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                this.log('Daily check-in successful', 'success');
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async completeTask(authorization, task) {
        try {
            const response = await axios.get(`https://preapi.duckchain.io/task/onetime?taskId=${task.taskId}`, {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                this.log(`Task ${task.content} completed successfully | Reward: ${task.integral} DUCK`, 'success');
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async processAllTasks(authorization) {
        try {
            const taskInfo = await this.getTaskInfo(authorization);
            if (!taskInfo.success) {
                this.log(`Unable to get task information: ${taskInfo.error}`, 'error');
                return;
            }
    
            const { daily: completedDaily, oneTime: completedOneTime, partner: completedPartner } = taskInfo.data;
    
            const taskList = await this.getTaskList(authorization);
            if (!taskList.success) {
                this.log(`Unable to get task list: ${taskList.error}`, 'error');
                return;
            }
    
            const { daily, oneTime, partner, social_media } = taskList.data;
    
            if (daily && Array.isArray(daily)) {
                for (const task of daily) {
                    if (task.taskId === 8 && !completedDaily.includes(8)) {
                        this.log('Performing daily check-in...', 'info');
                        await this.performDailyCheckIn(authorization);
                    }
                }
            }
    
            if (oneTime && Array.isArray(oneTime)) {
                for (const task of oneTime) {
                    if (!completedOneTime.includes(task.taskId)) {
                        this.log(`Executing task: ${task.content}...`, 'info');
                        await this.completeTask(authorization, task);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
    
            if (partner && Array.isArray(partner)) {
                for (const task of partner) {
                    if (!completedPartner.includes(task.taskId)) {
                        this.log(`Executing partner task: ${task.content}...`, 'info');
                        await this.completeTask(authorization, task);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
    
            this.log('All tasks completed', 'success');
        } catch (error) {
            this.log(`Error processing tasks: ${error.message}`, 'error');
        }
    }

    async executeQuack(authorization) {
        try {
            const response = await axios.get('https://preapi.duckchain.io/quack/execute', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });

            if (response.data.code === 200) {
                const { quackRecords, quackTimes, decibel } = response.data.data;
                const totalNegative = quackRecords.reduce((sum, num) => {
                    const value = parseInt(num);
                    return sum + (value < 0 ? value : 0);
                }, 0);

                this.log(`Quack ${quackTimes} | Total negative: ${totalNegative} | Remaining decibel: ${decibel}`, 'custom');
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processQuacks(authorization, decibels, maxQuackTimes = 0) {
        this.log(`Starting quack with ${decibels} decibels...`, 'info');
        let quackCount = 0;
        
        while (decibels > 0 && (maxQuackTimes === 0 || quackCount < maxQuackTimes)) {
            const result = await this.executeQuack(authorization);
            if (!result.success) {
                this.log(`Error during quack: ${result.error}`, 'error');
                break;
            }
            decibels = parseInt(result.data.decibel);
            quackCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.log('Quack completed!', 'success');
    }

    askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }))
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
    
        printLogo();
        
        const quacktime = await this.askQuestion('Do you want to Quack Times? (y/n)..Quack Times may consume all DUCK: ');
        const hoiquacktime = quacktime.toLowerCase() === 'y';
        let maxQuackTimes = 0;
        
        if (hoiquacktime) {
            const quackTimesInput = await this.askQuestion('How many times do you want to Quack? (Press Enter to quack until empty): ');
            maxQuackTimes = quackTimesInput ? parseInt(quackTimesInput) : 0;
        }
    
        while (true) {
            for (let i = 0; i < data.length; i++) {
                const authorization = data[i];
                const userData = JSON.parse(decodeURIComponent(authorization.split('user=')[1].split('&')[0]));
                const firstName = userData.first_name;
                const lastName = userData.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
    
                console.log(`========== Account ${i + 1} | ${fullName.green} ==========`);
                
                this.log(`Checking account information...`, 'info');
                const userInfo = await this.getUserInfo(authorization);
                
                if (userInfo.success) {
                    this.log(`Information retrieved successfully!`, 'success');
                    
                    if (userInfo.data.duckName === null) {
                        this.log(`Setting up duck name...`, 'info');
                        const setNameResult = await this.setDuckName(authorization, fullName);
                        
                        if (setNameResult.success) {
                            this.log(`Duck name set successfully: ${setNameResult.data.duckName}`, 'success');
                            this.log(`Decibels: ${setNameResult.data.decibels}`, 'custom');
                            if (hoiquacktime && setNameResult.data.decibels > 0) {
                                await this.processQuacks(authorization, setNameResult.data.decibels, maxQuackTimes);
                            }
                            
                        } else {
                            this.log(`Unable to set duck name: ${setNameResult.error}`, 'error');
                        }
                    } else {
                        this.log(`Duck name already set: ${userInfo.data.duckName}`, 'info');
                        if (userInfo.data.decibels) {
                            this.log(`Decibels: ${userInfo.data.decibels}`, 'custom');
    
                            if (hoiquacktime && userInfo.data.decibels > 0) {
                                await this.processQuacks(authorization, userInfo.data.decibels, maxQuackTimes);
                            }
                        }
                    }
                } else {
                    this.log(`Unable to get account information: ${userInfo.error}`, 'error');
                }
    
                this.log('Processing tasks...', 'info');
                await this.processAllTasks(authorization);
    
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
    
            await this.countdown(86400);
        }
    }
}

const client = new DuckChainAPIClient();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});
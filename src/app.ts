import * as fs from 'fs';
import chalk from 'chalk';
import { exec } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

interface PR {
    number: string;
    title: string;
    author: string;
    created_at: string;
    updated_at: string;
    url: string;
}

interface GithubPR {
    number: string;
    user: {
        login: string;
    };
    title: string;
    url: string;
    created_at: string;
    updated_at: string;
}

            // const PRs = result.map(prRAW => ({number: prRAW.number, author: prRAW.user.login, title: prRAW.title, url: prRAW.url, created_at: prRAW.created_at, updated_at: prRAW.updated_at, labels: []}));

type PRs = PR[];

TimeAgo.addLocale(en);

const timeAgo = new TimeAgo('en-US');
const configurationFileLocation = path.resolve(__dirname, '..', '.configuration');

function displayPRs(PRs: PRs, longestPRNumber: number) {
    const displayNumber = (number: string) => {
        const string = ''+number;

        if (string.length === longestPRNumber) {
            return number;
        } else {
            // Has to be less than
            const spacing = longestPRNumber - string.length;
            return `${number}${Array(spacing).fill(1).map(_ => ' ').join()}`;
        }
    }

    PRs.forEach(({number, title, author, created_at, updated_at}) => {
        const time = `${timeAgo.format(new Date(created_at))} (${timeAgo.format(new Date(updated_at))})`
        console.log(`${chalk.green('#'+displayNumber(number))}  ${title.trim()}  ${chalk.yellow(author)}  ${chalk.blue(time)}`);
    });
}

function getUserName(token: string) {
    return new Promise((resolve, reject) => {
        const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/user`;

            exec(cmd, (error, stdout) => {
            if (error) {
                console.error(`Unable to get Github Username: ${error}`);
                reject();
            }

            const body = JSON.parse(stdout);

            (body.login)
                ? resolve(body.login)
                : reject();
        });
    });
}

async function getPRs(token: string, login: string): Promise<GithubPR[]> {
    return new Promise(resolve => {
        const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/search/issues?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc+review-requested%3A${login}`;

            exec(cmd, (error, stdout) => {
            if (error) {
                console.error(`Unable to get PRs: ${error}`);
                return;
            }

            const body = JSON.parse(stdout);
            resolve(body.items);
        });
    });
}

async function createTokenConfig() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.info('Visit https://github.com/settings/tokens and create a Personal access tokens');

    rl.question('Token: ', async token => {
        try {
            const login = await getUserName(token);

            fs.writeFileSync(configurationFileLocation, JSON.stringify({
                token, login
            }), 'utf8');

            process.exit();
        } catch {
            throw new Error('Unable to get Username');
        }
    });
}

(async () => {
    try {
        if (fs.existsSync(configurationFileLocation)) {
            const { login, token } = JSON.parse(fs.readFileSync(configurationFileLocation, 'utf8'));

            const result = await getPRs(token, login);
            const PRs = result.map(prRAW => ({number: prRAW.number, author: prRAW.user.login, title: prRAW.title, url: prRAW.url, created_at: prRAW.created_at, updated_at: prRAW.updated_at, labels: []}));

            const longestPRNumber = result.reduce((longest, pr) => {
                const string = ''+pr.number;
                return (string.length > longest)
                    ? string.length
                    : longest;
            }, 0);

            displayPRs(PRs, longestPRNumber);
        } else {
            await createTokenConfig();
        }
    } catch(err) {
        console.error(err)
    }
})();
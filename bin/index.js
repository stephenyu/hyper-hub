#!/usr/bin/env node
const fs = require('fs');
const chalk = require('chalk');
const { exec } = require('child_process');

function displayPRs(PRs, longestPRNumber) {
    const displayNumber = (number) => {
        const string = ''+number;

        if (string.length === longestPRNumber) {
            return number;
        } else {
            // Has to be less than
            const spacing = longestPRNumber - string.length;
            return `${number}${Array(spacing).fill(1).map(_ => ' ').join()}`;
        }
    }

    PRs.forEach(({number, title, author}) => {
        console.log(`${chalk.green('#'+displayNumber(number))} - ${title.trim()} - ${chalk.yellow(author)}`);
    });
}

function getUserName(token) {
    return new Promise((resolve, reject) => {
        const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/user`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Unable to get Github Username: ${error}`);
                return;
            }

            const body = JSON.parse(stdout);
            return resolve(body.login);
        });
    });
}

async function getPRs(token, login) {
    return new Promise((resolve, reject) => {
        const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/search/issues?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc+review-requested%3A${login}`;

        exec(cmd, (error, stdout, stderr) => {
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
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.info('Visit https://github.com/settings/tokens and create a Personal access tokens');

    readline.question('Token: ', async token => {
        const login = await getUserName(token);

        fs.writeFileSync('./.configuration', JSON.stringify({
            token, login
        }), 'utf8');

        process.exit();
    });
}

(async () => {
    try {
        if (fs.existsSync('./.configuration')) {
            const { login, token } = JSON.parse(fs.readFileSync('./.configuration', 'utf8'));

            const result = await getPRs(token, login);
            const PRs = result.map(prRAW => ({number: prRAW.number, author: prRAW.user.login, title: prRAW.title, labels: []}));

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



// const TOKEN = 'e679f4140ce3c9fea176d0dc02034384713306b6';

// exec(cmd, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`exec error: ${error}`);
//     return;
//   }
//   console.log(`stdout: ${stdout}`);
// });

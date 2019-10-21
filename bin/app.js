"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const chalk_1 = require("chalk");
const child_process_1 = require("child_process");
const readline = require("readline");
const path = require("path");
const timeago_js_1 = require("timeago.js");
const configurationFileLocation = path.resolve(__dirname, '..', '.configuration');
function displayPRs(PRs, longestPRNumber) {
    const displayNumber = (number) => {
        const string = '' + number;
        if (string.length === longestPRNumber) {
            return number;
        }
        else {
            // Has to be less than
            const spacing = longestPRNumber - string.length;
            return `${number}${Array(spacing).fill(1).map(_ => ' ').join()}`;
        }
    };
    PRs.forEach(({ number, title, author, created_at, updated_at }) => {
        const time = `${timeago_js_1.format(new Date(created_at), 'en_US')} (${timeago_js_1.format(new Date(updated_at), 'en_US')})`;
        console.log(`${chalk_1.default.green('#' + displayNumber(number))}  ${title.trim()}  ${chalk_1.default.yellow(author)}  ${chalk_1.default.blue(time)}`);
    });
}
function getUserName(token) {
    return new Promise((resolve, reject) => {
        const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/user`;
        child_process_1.exec(cmd, (error, stdout) => {
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
function getPRs(token, login) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/search/issues?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc+review-requested%3A${login}`;
            child_process_1.exec(cmd, (error, stdout) => {
                if (error) {
                    console.error(`Unable to get PRs: ${error}`);
                    return;
                }
                const body = JSON.parse(stdout);
                resolve(body.items);
            });
        });
    });
}
function createTokenConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        console.info('Visit https://github.com/settings/tokens and create a Personal access tokens');
        rl.question('Token: ', (token) => __awaiter(this, void 0, void 0, function* () {
            try {
                const login = yield getUserName(token);
                fs.writeFileSync(configurationFileLocation, JSON.stringify({
                    token, login
                }), 'utf8');
                process.exit();
            }
            catch (_a) {
                throw new Error('Unable to get Username');
            }
        }));
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (fs.existsSync(configurationFileLocation)) {
            const { login, token } = JSON.parse(fs.readFileSync(configurationFileLocation, 'utf8'));
            const result = yield getPRs(token, login);
            const PRs = result.map(prRAW => ({ number: prRAW.number, author: prRAW.user.login, title: prRAW.title, url: prRAW.url, created_at: prRAW.created_at, updated_at: prRAW.updated_at, labels: [] }));
            const longestPRNumber = result.reduce((longest, pr) => {
                const string = '' + pr.number;
                return (string.length > longest)
                    ? string.length
                    : longest;
            }, 0);
            displayPRs(PRs, longestPRNumber);
        }
        else {
            yield createTokenConfig();
        }
    }
    catch (err) {
        console.error(err);
    }
}))();

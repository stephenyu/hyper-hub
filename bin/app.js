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
const util = require("util");
const readline = require("readline");
const path = require("path");
const child_process_1 = require("child_process");
const timeago_js_1 = require("timeago.js");
const chalk_1 = require("chalk");
const Configuration_1 = require("./Configuration");
const promiseExec = util.promisify(child_process_1.exec);
class Application {
    constructor(configurationFileLocation) {
        this.config = new Configuration_1.Configuration(configurationFileLocation);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.githubLogin === undefined ||
                this.config.githubToken === undefined) {
                yield this.createTokenConfig();
            }
            yield this.displayPRs();
            process.exit();
        });
    }
    displayPRs() {
        return __awaiter(this, void 0, void 0, function* () {
            const pullRequests = yield this.getPullRequests();
            const longestPRNumber = pullRequests.reduce((longest, pr) => {
                const string = "" + pr.number;
                return string.length > longest ? string.length : longest;
            }, 0);
            const displayNumber = (number) => {
                const string = "" + number;
                if (string.length === longestPRNumber) {
                    return number;
                }
                else {
                    // Has to be less than
                    const spacing = longestPRNumber - string.length;
                    return `${number}${" ".repeat(spacing)}`;
                }
            };
            if (pullRequests.length === 0) {
                console.log(chalk_1.default.green("Empty! No PRs Assigned"));
            }
            else {
                pullRequests.forEach(({ number, title, author, created_at, updated_at }) => {
                    const time = `${timeago_js_1.format(new Date(created_at), "en_US")} (${timeago_js_1.format(new Date(updated_at), "en_US")})`;
                    console.log(`${chalk_1.default.green("#" + displayNumber(number))}  ${title.trim()}  ${chalk_1.default.yellow(author)}  ${chalk_1.default.blue(time)}`);
                });
            }
        });
    }
    getPullRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = `curl -H "Authorization: token ${this.config.githubToken}" https://api.github.com/search/issues?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc+review-requested%3A${this.config.githubLogin}`;
            const { stdout } = yield promiseExec(cmd);
            const body = JSON.parse(stdout);
            const pullRequests = body.items.map(prRAW => ({
                number: prRAW.number,
                author: prRAW.user.login,
                title: prRAW.title,
                url: prRAW.url,
                created_at: prRAW.created_at,
                updated_at: prRAW.updated_at,
                labels: []
            }));
            return pullRequests;
        });
    }
    getUserName(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/user`;
            const promiseExec = util.promisify(child_process_1.exec);
            try {
                const { stdout } = yield promiseExec(cmd);
                const body = JSON.parse(stdout);
                return body.login;
            }
            catch (error) {
                return "";
            }
        });
    }
    createTokenConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                console.info("Visit https://github.com/settings/tokens and create a Personal access tokens");
                rl.question("Token: ", (token) => __awaiter(this, void 0, void 0, function* () {
                    const login = yield this.getUserName(token);
                    this.config.writeConfigurationFile({ login, token });
                    resolve({ login, token });
                }));
            });
        });
    }
}
const app = new Application(path.resolve(__dirname, "..", ".configuration"));
app.start();

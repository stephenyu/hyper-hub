import * as util from "util";
import * as readline from "readline";
import * as path from "path";
import { exec } from "child_process";

import { format } from "timeago.js";
import chalk from "chalk";

import { Configuration } from "./Configuration";

const promiseExec = util.promisify(exec);

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

class Application {
  private config: Configuration;

  constructor(configurationFileLocation: string) {
    this.config = new Configuration(configurationFileLocation);
  }

  async start() {
    if (
      this.config.githubLogin === undefined ||
      this.config.githubToken === undefined
    ) {
      await this.createTokenConfig();
    }
    await this.displayPRs();
    process.exit();
  }

  async displayPRs() {
    const pullRequests = await this.getPullRequests();

    const longestPRNumber = pullRequests.reduce((longest, pr) => {
      const string = "" + pr.number;
      return string.length > longest ? string.length : longest;
    }, 0);

    const displayNumber = (number: string) => {
      const string = "" + number;

      if (string.length === longestPRNumber) {
        return number;
      } else {
        // Has to be less than
        const spacing = longestPRNumber - string.length;
        return `${number}${" ".repeat(spacing)}`;
      }
    };

    if (pullRequests.length === 0) {
      console.log(chalk.green("Empty! No PRs Assigned"));
    } else {
      pullRequests.forEach(
        ({ number, title, author, created_at, updated_at }) => {
          const time = `${format(new Date(created_at), "en_US")} (${format(
            new Date(updated_at),
            "en_US"
          )})`;

          console.log(
            `${chalk.green(
              "#" + displayNumber(number)
            )}  ${title.trim()}  ${chalk.yellow(author)}  ${chalk.blue(time)}`
          );
        }
      );
    }
  }

  private async getPullRequests(): Promise<PR[]> {
    const cmd = `curl -H "Authorization: token ${this.config.githubToken}" https://api.github.com/search/issues?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc+review-requested%3A${this.config.githubLogin}`;
    const { stdout } = await promiseExec(cmd);

    const body = JSON.parse(stdout) as { items: GithubPR[] };

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
  }

  private async getUserName(token: string) {
    const cmd = `curl -H "Authorization: token ${token}" https://api.github.com/user`;
    const promiseExec = util.promisify(exec);

    try {
      const { stdout } = await promiseExec(cmd);
      const body = JSON.parse(stdout);
      return body.login;
    } catch (error) {
      return "";
    }
  }

  private async createTokenConfig() {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.info(
        "Visit https://github.com/settings/tokens and create a Personal access tokens"
      );

      rl.question("Token: ", async token => {
        const login = await this.getUserName(token);
        this.config.writeConfigurationFile({ login, token });
        resolve({ login, token });
      });
    });
  }
}

const app = new Application(path.resolve(__dirname, "..", ".configuration"));
app.start();

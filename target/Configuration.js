"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class Configuration {
    constructor(configurationFileLocation) {
        this.configurationFileLocation = configurationFileLocation;
        if (this.configurationExists()) {
            const { login, token } = JSON.parse(fs.readFileSync(this.configurationFileLocation, "utf8"));
            this.githubLogin = login;
            this.githubToken = token;
        }
    }
    configurationExists() {
        return fs.existsSync(this.configurationFileLocation);
    }
    writeConfigurationFile({ login, token }) {
        fs.writeFileSync(this.configurationFileLocation, JSON.stringify({
            token,
            login
        }), "utf8");
        this.githubToken = token;
        this.githubLogin = login;
    }
}
exports.Configuration = Configuration;

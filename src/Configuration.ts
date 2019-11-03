import * as fs from "fs";

interface ConfigurationFile {
  login: string;
  token: string;
}

export class Configuration {
  public githubLogin: string;
  public githubToken: string;

  constructor(private configurationFileLocation: string) {
    if (this.configurationExists()) {
      const { login, token } = JSON.parse(
        fs.readFileSync(this.configurationFileLocation, "utf8")
      );

      this.githubLogin = login;
      this.githubToken = token;
    }
  }

  configurationExists() {
    return fs.existsSync(this.configurationFileLocation);
  }

  writeConfigurationFile({ login, token }: ConfigurationFile) {
    fs.writeFileSync(
      this.configurationFileLocation,
      JSON.stringify({
        token,
        login
      }),
      "utf8"
    );

    this.githubToken = token;
    this.githubLogin = login;
  }
}

import { Configuration } from "../Configuration";
import * as fs from "fs";

jest.mock("fs");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("Configuration Test", () => {
  it("If the configuration file exists, set corresponding configuration values", () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readFileSync.mockReturnValueOnce(
      '{"login":"loginValue","token":"tokenValue"}'
    );

    const config = new Configuration("./foobar.config");

    expect(config.githubLogin).toEqual("loginValue");
    expect(config.githubToken).toEqual("tokenValue");
  });

  it("If the configuration file doesn't exist, corresponding configuration values should be undefined", () => {
    mockedFs.existsSync.mockReturnValueOnce(false);

    const config = new Configuration("./foobar.config");

    expect(config.githubLogin).toBeUndefined();
    expect(config.githubToken).toBeUndefined();
  });

  it("Write Configuration File correctly", () => {
    const config = new Configuration("./foobar.config");

    mockedFs.writeFileSync.mockImplementation((fileLocation, fileContents) => {
      expect(fileLocation).toEqual("./foobar.config");
      expect(JSON.parse(fileContents)).toMatchObject({
        login: "loginValue",
        token: "tokenValue"
      });
    });

    config.writeConfigurationFile({
      login: "loginValue",
      token: "tokenValue"
    });
  });
});

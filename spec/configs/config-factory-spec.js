"use babel";

/* global waitsForPromise */

import ConfigFactory from "../../lib/configs/ConfigFactory";

describe("ConfigFactory", () => {
  const toBeRejected = {shouldReject: true};

  let factory;

  beforeEach(() => {
    factory = new ConfigFactory();
  });

  it("creates an SFTP config", () => {
    const config = factory.createSftpConfig();

    expect(config.port).toEqual(22);
  });

  it("creates an FTP config", () => {
    const config = factory.createFtpConfig();

    expect(config.port).toEqual(21);
  });

  it("parses a config file content", () => {
    const content = `
      {
        "port": 1234
      }
    `;

    waitsForPromise(() => factory.parseConfigFile(content).then((connection) => {
      expect(connection.port).toEqual(1234);
    }));
  });

  it("rejects invalid config files", () => {
    const invalidContent = "invalid-json";

    waitsForPromise(toBeRejected, () => factory.parseConfigFile(invalidContent)
      .catch((error) => {
        expect(error.message).toContain("Invalid configuration file")
        throw error;
      }));
  });

  it("rejects when no config file could be found", () => {
    waitsForPromise(toBeRejected, () => factory.loadConfig("non-existant-file")
      .catch((error) => {
        expect(error.message).toContain("doesn't exist");
        throw error;
      }));
  });
});

"use babel";

/* global waitsForPromise */

import ConfigFactory from "../../lib/configs/ConfigFactory";
import ConfigurationFileSyntaxErrorException from "../../lib/exceptions/ConfigurationFileSyntaxErrorException";

describe("ConfigFactory", () => {
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

    factory.parseConfigFile(invalidContent)
      .then(() => {
        throw new Error("should have been rejected");
      })
      .catch((error) => {
        expect(error instanceof ConfigurationFileSyntaxErrorException).toBeTruthy();
      });
  });

  it("rejects when no config file could be found", () => {
    const errorThatShouldNotHappen = new Error("should have been rejected");

    factory.loadConfig("non-existant-file")
      .then(() => {
        throw errorThatShouldNotHappen;
      })
      .catch((e) => {
        expect(e).not.toBe(errorThatShouldNotHappen);
      });
  });
});


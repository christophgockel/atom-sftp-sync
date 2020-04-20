"use babel";

import * as fs from "fs";
import Config from "./Config";
import NoConfigurationFileFoundException from "./../exceptions/NoConfigurationFileFoundException";
import ConfigurationFileNotReadableException from "./../exceptions/ConfigurationFileNotReadableException";
import ConfigurationFileSyntaxErrorException from "./../exceptions/ConfigurationFileSyntaxErrorException";

export default class ConfigFactory {
  parseConfigFile(content) {
    return new Promise((resolve, reject) => {
      try {
        const configData = JSON.parse(content);

        resolve(configData);
      } catch (e) {
        if (e.name === "SyntaxError") {
          reject(new ConfigurationFileSyntaxErrorException(e.message));
        } else {
          reject(e);
        }
      }
    });
  }

  createConfig(configData) {
    return new Promise((resolve, reject) => {
      try {
        const config = new Config();

        for (const [key, value] of Object.entries(configData)) {
          if (value) {
            config[key] = value;
          }
        }

        resolve(config);
      } catch (e) {
        reject(e);
      }
    });
  }

  loadConfig(configPath) {
    return new Promise((resolve, reject) => {
      fs.readFile(configPath, "utf8", (err, content) => {
        if (err) {
          console.debug("No configuration file for Atom-SFTP-sync found.");
        } else {
          resolve(content);
        }
      });
    })
      .then((content) => this.parseConfigFile(content))
      .then((configData) => this.createConfig(configData));
  }

  createSftpConfig() {
    const config = new Config();

    config.port = 22;

    return config;
  }

  createFtpConfig() {
    const config = new Config();

    config.port = 21;

    return config;
  }
}

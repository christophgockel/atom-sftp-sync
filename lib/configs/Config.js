"use babel";

import * as fs from "fs";

export default class Config {
  constructor() {
    this.host = "";
    this.username = "";
    this.password = "";
    this.port = -1;
    this.remotePath = "";
    this.sshKeyFile = null;
    this.passphrase = null;
    this.uploadOnSave = false;
    this.uploadConfigFile = false;
  }

  save(path) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, JSON.stringify(this, replacer, 4), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

function replacer(key, value) {
  return value !== null ? value : undefined; // eslint-disable-line no-undefined
}


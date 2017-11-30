"use babel";

import * as process from "child_process";
import Queue from "./../queue/Queue";
import ConnectionErrorException from "./../exceptions/ConnectionErrorException";
import DirectoryCreationErrorException from "./../exceptions/DirectoryCreationErrorException";
import RemoteDirectoryNotReadableException from "./../exceptions/RemoteDirectoryNotReadableException";

const {exec} = process;

export default class Connection {
  constructor(config = null) {
    this.config = config;
    this.connection = null;
    this.queue = new Queue(3);
  }

  getConnectionInformations() {
    throw "Method not implemented";
  }

  createRemoteDirectory() {
    throw "Method not implemented";
  }

  createDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
      try {
        exec(
          "mkdir -p " + directoryPath,
          (err) => {
            if (err) {
              reject(new DirectoryCreationErrorException(directoryPath));

              return;
            }

            resolve(directoryPath);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  uploadFile() {
    throw "Method non implemented";
  }

  downloadFile() {
    throw "Method non implemented";
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.connection.on("ready", () => {
        resolve(this);
      });

      this.connection.on("error", (err) => {
        reject(new ConnectionErrorException(err.message));
      });

      try {
        this.connection.connect(this.getConnectionInformations());
      } catch (e) {
        reject(new ConnectionErrorException(e.message));
      }
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      try {
        this.connection.end();
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  }

  upload(files) {
    files.forEach((file) => {
      this.queue.addAction(() => this.uploadFile(file));
    });

    return this.queue.execute().then(() => this);
  }

  download(files) {
    files.forEach((file) => {
      this.queue.addAction(() => this.downloadFile(file));
    });

    return this.queue.execute().then(() => this);
  }

  extractDistantFiles() {
    //
  }

  getTargetFiles(nodes) {
    const files = [];
    const calls = nodes.map((node) => this.extractDistantFiles(node, files));

    return Promise.all(calls).then(() => files);
  }
}


"use babel";

import * as path from "path";
import * as fs from "fs";
import FTPConnection from "ftp";
import Promise from "bluebird";
import Connection from "./Connection";
import Directory from "./../filesystem/Directory";
import File from "./../filesystem/File";
import UploadErrorException from "./../exceptions/UploadErrorException";
import DownloadErrorException from "./../exceptions/DownloadErrorException";
import RemoteDirectoryCreationErrorException from "./../exceptions/RemoteDirectoryCreationErrorException";
import TransfertErrorException from "./../exceptions/TransfertErrorException";
import RemoteDirectoryNotReadableException from "./../exceptions/RemoteDirectoryNotReadableException";

export default class FtpConnection extends Connection {
  constructor(config) {
    super(config)
    this.connection = new FTPConnection();
  }

  getConnectionInformations() {
    return {
      host: this.config.host,
      port: this.config.port ? this.config.port : 21,
      user: this.config.username,
      password: this.config.password
    };
  }


  createRemoteDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
      try {
        this.connection.mkdir(
          directoryPath,
          true,
          (err) => {
            if (err) {
              reject(new RemoteDirectoryCreationErrorException(directoryPath));

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

  put(sourceFile, destinationFile) {
    return new Promise((resolve, reject) => {
      try {
        this.connection.put(sourceFile, destinationFile, (err) => {
          if (err) {
            if (err.code === 550) {
              reject(new UploadErrorException(sourceFile, "Permission denied"));
            } else {
              reject(err);
            }

            return;
          }

          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  get(sourceFile, destinationFile) {
    return new Promise((resolve, reject) => {
      try {
        this.connection.get(sourceFile, (err, stream) => {
          if (err) {
            if (err.code === 550) {
              reject(new DownloadErrorException(destinationFile, "Permission denied"));
            } else if (err.code === 425) {
              reject(new TransfertErrorException(sourceFile, err.message));
            } else {
              reject(err);
            }

            return;
          }

          const outFileStream = fs.createWriteStream(destinationFile);

          outFileStream.once("error", () => {
            reject(new DownloadErrorException(destinationFile, "Permission denied"));
          });
          stream.once("close", () => {
            resolve();
          });
          stream.pipe(outFileStream);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  uploadFile(file) {
    return new Promise((resolve, reject) => {
      const destinationFile = path.join(
        this.config.getRemotePath(),
        file.getRelativePath()
      ).replace(/\\/g, "/");

      try {
        this.createRemoteDirectory(path.dirname(destinationFile))
          .then(() => this.put(file.getPath(), destinationFile))
          .then(() => {
            resolve(file);
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  downloadFile(file) {
    return new Promise((resolve, reject) => {
      const sourceFile = path.join(
        this.config.getRemotePath(),
        file.getRelativePath()
      ).replace(/\\/g, "/");

      try {
        this.createDirectory(file.getDirectory())
          .then(() => self.get(sourceFile, file.getPath()))
          .then(() => {
            resolve(file);
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  extractDistantFiles(node, files) {
    return new Promise((resolve, reject) => {
      try {
        if (node instanceof Directory) {
          const remotePath = path.join(
            this.config.getRemotePath(),
            node.getRelativePath()
          ).replace(/\\/g, "/");

          this.connection.list(remotePath, (err, nodes) => {
            if (err) {
              reject(new RemoteDirectoryNotReadableException(remotePath));

              return;
            }

            const calls = [];

            for (const i in nodes) {
              if (nodes[i].type === "d") {
                const directory = new Directory(path.join(node.getRelativePath(), nodes[i].name), true);

                calls.push(self.extractDistantFiles(directory, files));
              } else {
                const file = new File(path.join(node.getRelativePath(), nodes[i].name), true);

                calls.push(self.extractDistantFiles(file, files));
              }
            }

            Promise.all(calls);
          })
        } else {
          files.push(node);
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });
  }
}


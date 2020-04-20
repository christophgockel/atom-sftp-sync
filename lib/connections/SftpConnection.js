"use babel";

import * as path from "path";
import SshConnection from "ssh2";
import Connection from "./Connection";
import Directory from "./../filesystem/Directory";
import File from "./../filesystem/File";
import UploadErrorException from "./../exceptions/UploadErrorException";
import DownloadErrorException from "./../exceptions/DownloadErrorException";
import RemoteDirectoryCreationErrorException from "./../exceptions/RemoteDirectoryCreationErrorException";
import RemoteDirectoryNotReadableException from "./../exceptions/RemoteDirectoryNotReadableException";
import NoConfigurationFileFoundException from "./../exceptions/NoConfigurationFileFoundException";

export default class SftpConnection extends Connection {
  constructor(config) {
    super(config);
    this.connection = new SshConnection();
  }

  getConnectionInformations() {
    const informations = {
      host: this.config.host,
      port: this.config.port ? this.config.port : 22,
      username: this.config.username
    }

    if (this.config.password) {
      informations.password = this.config.password;
    } else {
      informations.privateKey = this.config.sshKeyFile;
      informations.passphrase = this.config.passphrase;
    }

    return informations;
  }

  createRemoteDirectory(sftp, directoryPath) {
    return new Promise((resolve, reject) => {
      const segments = directoryPath.split(path.sep);
      let remotePath = "";

      function mkdirp() {
        if (!segments.length) {
          resolve(sftp);
        } else {
          let segment = segments.shift();

          segment += path.sep;

          remotePath = path.join(remotePath, segment);

          sftp.mkdir(remotePath, (err) => {
            if (err && err.code !== 4) {
              reject(new RemoteDirectoryCreationErrorException(directoryPath));
            } else {
              mkdirp();
            }
          });
        }
      }

      sftp.lstat(directoryPath, (err) => {
        if (err) {
          mkdirp();
        } else {
          resolve(sftp);
        }
      })
    });
  }

  openSftp() {
    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) {
          reject(err);

          return;
        }

        resolve(sftp);
      });
    });
  }

  fastPut(sftp, sourceFile, destinationFile) {
    return new Promise((resolve, reject) => {
      sftp.fastPut(sourceFile, destinationFile, (err) => {
        if (err) {
          reject(new UploadErrorException(sourceFile, err.message));

          return;
        }

        resolve(sftp);
      })
    });
  }

  fastGet(sftp, sourceFile, destinationFile) {
    return new Promise((resolve, reject) => {
      try {
        sftp.fastGet(sourceFile, destinationFile, (err) => {
          if (err) {
            if (err.code === "EACCES") {
              reject(new DownloadErrorException(destinationFile, "Permission denied"));
            } else {
              reject(err);
            }

            return;
          }

          resolve(sftp);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  uploadFile(file) {
    const destinationFile = path.join(
      path.normalize(this.config.remotePath),
      file.getRelativePath()
    );

    return this.openSftp()
      .then((sftp) => this.createRemoteDirectory(sftp, path.dirname(destinationFile)))
      .then((sftp) => this.fastPut(sftp, file.getPath(), destinationFile))
      .then((sftp) => {
        sftp.end();

        return file;
      });
  }

  downloadFile(file) {
    const sourceFile = path.join(
      path.normalize(this.config.remotePath),
      file.getRelativePath()
    );

    return this.createDirectory(file.getDirectory())
      .then(() => this.openSftp())
      .then((sftp) => this.fastGet(sftp, sourceFile, file.getPath()))
      .then((sftp) => sftp.end())
      .then(() => file);
  }

  getListDir(sftp, node, files) {
    return new Promise((resolve, reject) => {
      try {
        if (node instanceof Directory) {
          const remotePath = path.join(
            path.normalize(this.config.remotePath),
            node.getRelativePath()
          );

          sftp.readdir(remotePath, (err, nodes) => {
            if (err) {
              reject(new RemoteDirectoryNotReadableException(remotePath));

              return;
            }

            const calls = [];

            for (const i in nodes) {
              if (nodes[i].attrs.isDirectory()) {
                const directory = new Directory(path.join(node.getRelativePath(), nodes[i].filename), true);

                calls.push(this.getListDir(sftp, directory, files));
              } else {
                const file = new File(path.join(node.getRelativePath(), nodes[i].filename), true);

                calls.push(this.getListDir(sftp, file, files));
              }
            }

            Promise.all(calls);
          });
        } else {
          files.push(node);
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  extractDistantFiles(node, files) {
    return new Promise((resolve) => {
      let sftp = null;

      if (node instanceof Directory) {
        this.openSftp()
          .then((_sftp) => {
            sftp = _sftp;

            return this.getListDir(_sftp, node, files);
          })
          .then((nodes) => {
            sftp.end();
            const calls = nodes.map((n) => calls.push(this.extractDistantFiles(n, files)));

            return Promise.all(calls)
          });
      } else {
        files.push(node);
        resolve();
      }
    });
  }
}

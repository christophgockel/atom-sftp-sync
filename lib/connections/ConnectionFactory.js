"use babel";

import SftpConnection from "./SftpConnection";
import FtpConnection from "./FtpConnection";

export default class ConnectionFactory {
  createConnection(config) {
    return new Promise((resolve, reject) => {
      try {
        const {port} = config;
        let connection;

        if (port === 22) {
          connection = this.createSftpConnection(config);
        } else {
          connection = this.createFtpConnection(config);
        }

        resolve(connection);
      } catch (e) {
        reject(e);
      }
    });
  }

  openConnection(config) {
    return this.createConnection(config)
      .then((connection) => connection.connect());
  }

  createSftpConnection(config) {
    return new SftpConnection(config);
  }

  createFtpConnection(config) {
    return new FtpConnection(config);
  }
}


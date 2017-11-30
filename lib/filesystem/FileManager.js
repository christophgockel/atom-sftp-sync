"use babel";

/* global atom */

import * as fs from "fs";
import * as path from "path";

import File from "./File";

export default class FileManager {
  static getCurrentFile() {
    return new Promise((resolve, reject) => {
      try {
        resolve(new File(atom.workspace.getCenter().paneContainer.activePane.activeItem.buffer.file.path));
      } catch (e) {
        reject(e);
      }
    });
  }

  static getOpenFiles() {
    return new Promise((resolve, reject) => {
      try {
        const items = atom.workspace.getActivePane().getItems();
        const files = items.map((item) => new File(item.buffer.file.path));

        resolve(files);
      } catch (e) {
        reject(e);
      }
    });
  }

  static getSelection() {
    return new Promise((resolve, reject) => {
      try {
        const selectedPaths = atom.workspace.getActivePaneItem().selectedPaths();
        const files = [];

        selectedPaths.forEach((p) => {
          treatPath(p, files);
        });

        resolve(files);
      } catch (e) {
        reject(e);
      }
    });
  }
}

function treatPath(_path, results) {
  const stats = fs.statSync(_path); // eslint-disable-line no-sync

  if (stats.isDirectory()) {
    const files = fs.readdirSync(_path); // eslint-disable-line no-sync

    files.forEach((file) => {
      treatPath(path.join(_path, file), results);
    });
  } else if (results.indexOf(_path) < 0) {
    results.push(new File(_path));
  }
}


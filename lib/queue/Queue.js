"use babel";

import PromisePool from "es6-promise-pool";

export default class Queue {
  constructor() {
    this.actions = [];
  }

  addAction(action) {
    this.actions.push(action);
  }

  execute() {
    const pool = new PromisePool(() => this.next(), 5);

    return pool.start();
  }

  next() {
    const next = this.actions.shift();

    if (next) {
      return next();
    }

    return null;
  }
}


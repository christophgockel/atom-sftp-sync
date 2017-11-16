"use babel";

export default class Queue {
  constructor() {
    this.actions = [];
  }

  addAction(action) {
    this.actions.push(action);
  }

  execute() {
    return Promise.all(this.actions.map((action) => action()));
  }
}


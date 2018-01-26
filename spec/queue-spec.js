"use babel";

/* global waitsForPromise */

import Queue from "../lib/queue/Queue";

describe("Queue", () => {
  const toBeRejected = {shouldReject: true};
  let queue;

  beforeEach(() => {
    queue = new Queue();
  });


  it("takes a function and executes it", () => {
    let actionCalled = false;

    const func = () => {
      actionCalled = true;

      return Promise.resolve();
    };

    queue.addAction(func);

    waitsForPromise(() => queue.execute().then(() => {
      expect(actionCalled).toBeTruthy();
    }));
  });

  it("rejects when the action fails", () => {
    const action = () => Promise.reject("the error");

    queue.addAction(action);

    waitsForPromise(toBeRejected, () => queue.execute().catch((error) => {
      expect(error).toEqual("the error");
      throw error;
    }));
  });
});


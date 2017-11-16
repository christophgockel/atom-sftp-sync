"use babel";

import Queue from "../lib/queue/Queue";

describe("Queue", () => {
  let queue;

  beforeEach(() => {
    queue = new Queue();
  });


  it("takes a function and executes it", (done) => {
    let actionCalled = false;

    const func = () => {
      actionCalled = true;

      return Promise.resolve();
    };

    queue.addAction(func);

    queue.execute().then(() => {
      expect(actionCalled).toBeTruthy();
    })
      .then(done, done);
  });

  it("rejects when the action fails", (done) => {
    const action = () => Promise.reject("the error");

    queue.addAction(action);
    queue.execute().then(() => {
      fail("promise should have been rejected");
    })
      .catch((e) => {
        expect(e).toEqual("the error");
      })
      .then(done, done);
  });
});


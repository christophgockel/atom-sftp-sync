"use babel";

import DeploymentManager from "../lib/DeploymentManager";
import MessageObserver from "../lib/observers/MessageObserver";

describe("DeploymentManager", () => {
  it("notifies about errors", () => {
    const exception = new Error();
    const deploymentManager = new DeploymentManager();
    const observer = new MessageObserver();

    deploymentManager.registerObserver(observer);
    spyOn(observer, "notifyError");

    deploymentManager.dispatchException(exception)

    expect(observer.notifyError).toHaveBeenCalledWith(exception);
  });
});

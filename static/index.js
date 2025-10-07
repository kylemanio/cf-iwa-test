const color = document.getElementById("color");

let controlledframe // initial
// let controlledframe;
const captures = document.getElementById("captures");

const blockCFRequests = (details) => {
  try {
    console.log(
      "Controlled Frame Request: request blocked",
      JSON.stringify(details)
    );
    return { cancel: true };
  } catch (err) {
    console.error(
      "Controlled Frame Request: blockControlledFrameRequests err",
      err
    );
  }
};

const uninitializeControlledFrame = () => {
  if (controlledframe) {
    controlledframe.remove();
  }
  // Enabling initialize button
  document.getElementById("init-cf").disabled = false;
  document.getElementById("uninit-cf").disabled = true;

  document.getElementById("capture").disabled = true;
  document.getElementById("execute").disabled = true;
  document.getElementById("load_example_bar").disabled = true;
  document.getElementById("load_home").disabled = true;
  document.getElementById("reload-cf").disabled = true;
  document.getElementById("back").disabled = true;
  document.getElementById("forward").disabled = true;
  document.getElementById("block-requests").disabled = true;
  document.getElementById("modify-request-headers").disabled = true;
  captures.innerHTML = "";
  // webviewAuthRequiredBtn.disabled = true
};

const modifyControlledFrameRequestHeaders = (details) => {
  try {
    if (details.method === "OPTIONS") return;

    // Delete Authorization Header
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === "Authorization") {
        details.requestHeaders.splice(i, 1);
        break;
      }
    }
    details.requestHeaders.push({
      name: "Content-Type",
      value: "application/x-www-form-urlencoded",
    });
    console.log(
      "ControlledFrame Request: headers modified!",
      JSON.stringify(details)
    );
    return { requestHeaders: details.requestHeaders };
  } catch (err) {
    console.error(
      "ControlledFrame Request: modifyControlledFrameRequestHeaders err",
      err
    );
  }
};

const clearControlledFrameListeners = () => {
  controlledframe.request.onBeforeSendHeaders.removeListener(
    modifyControlledFrameRequestHeaders,
    { urls: ["*://*/*"] },
    ["requestHeaders", "extraHeaders"]
  );

  controlledframe.request.onBeforeRequest.removeListener(
    blockCFRequests,
    { urls: ["*://*/*"] },
    ["blocking"]
  );
};

let blockingRequests = false;
let modifyingRequests = false;

function addHandlers() {
  // controlledframe.navigate("https://example.com");

  try {
    controlledframe.addEventListener("loadstart", (e) => {
      console.log("Controlled Frame API: Load start: ", JSON.stringify(e));
    });

    controlledframe.addEventListener("loadabort", (e) => {
      console.log("Controlled Frame API: Load aborted: ", JSON.stringify(e));
    });

    controlledframe.addEventListener("loadcommit", (e) => {
      console.log("Controlled Frame API: Load commit: ", JSON.stringify(e));
    });

    controlledframe.addEventListener("loadredirect", (e) => {
      console.log("Controlled Frame API: Load Redirect: ", JSON.stringify(e));
    });

    controlledframe.addEventListener("consolemessage", function (e) {
      console.log(
        "Controlled Frame API: Guest page logged a message: ",
        e.message
      );
    });

    controlledframe.addEventListener("permissionrequest", function (e) {
      if (e.permission === "media") {
        e.request.allow();
      }
    });

    controlledframe.addEventListener("close", function () {
      console.log("Controlled Frame API: Controlled Frame closed");
      uninitializeControlledFrame();
    });

    controlledframe.addEventListener("exit", function () {
      console.log("Controlled Frame API: Goodbye, world!");
    });

    document
      .getElementById("block-requests")
      .addEventListener("click", (ev) => {
        document.getElementById("modify-request-headers").disabled = false;
        document.getElementById("block-requests").disabled = true;
        controlledframe.request.onBeforeRequest.addListener(
          blockCFRequests,
          { urls: ["*://*/*"] },
          ["blocking"]
        );
      });

    document
      .getElementById("modify-request-headers")
      .addEventListener("click", (ev) => {
        document.getElementById("modify-request-headers").disabled = true;
        document.getElementById("block-requests").disabled = false;
        controlledframe.request.onBeforeSendHeaders.addListener(
          modifyControlledFrameRequestHeaders,
          { urls: ["*://*/*"] },
          ["blocking"]
        );
      });


    // Reload CF.
    document.getElementById("reload-cf").addEventListener("click", (ev) => {
      console.log("Controlled Frame API: Reloading...");
      controlledframe.reload();
    });

    // Navigate back.
    document.getElementById("back").addEventListener("click", async (ev) => {
      await controlledframe.back();
    });

    // Navigate forward.
    document.getElementById("forward").addEventListener("click", async (ev) => {
      await controlledframe.forward();
    });

    document.getElementById("capture").addEventListener("click", async (ev) => {
      const result = await controlledframe.captureVisibleRegion({
        format: "jpeg",
        quality: 100,
      });

      if (result) {
        const capturedImgElement = document.createElement("img");
        capturedImgElement.src = result;
        capturedImgElement.className = "captured-image";
        captures.appendChild(capturedImgElement);
      }
    });
    document.getElementById("execute").addEventListener("click", async (ev) => {
      console.log(controlledframe.webRequest);
      // Execute JavaScript within the Controlled Frame to remove all links from
      // <a> elements and add 'inject_script.js' to the Controlled Frame's script sources:
      controlledframe.executeScript({
        code: `
            console.log("I AM ADDING SCRIPTS!")
            const anchorTags = document.getElementsByTagName('a');
            const h1Tags = document.getElementsByTagName("h1");
            for (const tag of anchorTags){
                tag.href = 'https://www.google.com';
                tag.innerHTML = "Clicking me will redirect you to google"
            }
            for (const tag of h1Tags){
                tag.innerHTML = "Executed a script!"
            }
            `,
      });

    });

  } catch (err) {
    console.error("addHandlers err", err);
  }
}


const initTabSwitcher = () => {
    const tabContainer = document.querySelector('.tab-container');
    const contentContainer = document.querySelector('.content-container');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const splitViewBtn = document.getElementById('splitview-btn');

    let isSplitView = false;

    controlledframe = document.getElementById('cf1');

    function updateView() {
        tabContents.forEach(content => content.style.display = 'none');

        const activeLink = document.querySelector('.tab-link.active');
        if (!activeLink) return;

        if (isSplitView) {
            
            contentContainer.classList.add('split-view');

            const firstContent = document.getElementById(activeLink.dataset.tab);
            if (firstContent) {
                firstContent.style.display = 'block';
                console.log(`Controlled Frame: ${activeLink.innerHTML} is now active as the second content`)
            }

            let nextLink = activeLink.nextElementSibling;
            if (!nextLink) {
                nextLink = tabLinks[0];
            }
            const secondContent = document.getElementById(nextLink.dataset.tab);
            console.log(`Controlled Frame: ${nextLink.innerHTML} is now active as the second content`)
            if (secondContent) secondContent.style.display = 'block';

        } else {
            contentContainer.classList.remove('split-view');
            const activeContent = document.getElementById(activeLink.dataset.tab);
            if (activeContent) {
                controlledframe = activeContent;
                console.log(`Controlled Frame: ${activeLink.innerHTML} is now active`)
                activeContent.style.display = 'block';
            }
        }
    }


    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            tabLinks.forEach(btn => btn.classList.remove('active'));
            controlledframe = document.getElementById(event.currentTarget.dataset.tab);
            console.log(`Controlled Frame: ${event.currentTarget.innerHTML} is now active`)
            event.currentTarget.classList.add('active');
            updateView();
        });
    });

    splitViewBtn.addEventListener('click', () => {
        isSplitView = !isSplitView;
        splitViewBtn.textContent = isSplitView ? 'Exit Split View' : 'Toggle Split View';
        updateView();
    });

    fullscreenBtn.addEventListener('click', () => {
        const isFullscreen = tabContainer.classList.toggle('fullscreen');
        fullscreenBtn.textContent = isFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen';
    });

    if (tabLinks.length > 0) {
        tabLinks[0].classList.add('active');
        updateView();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTabSwitcher()

    addHandlers();

    document.getElementById("capture").disabled = false;
    document.getElementById("execute").disabled = false;
    document.getElementById("reload-cf").disabled = false;
    document.getElementById("back").disabled = false;
    document.getElementById("forward").disabled = false;
    document.getElementById("block-requests").disabled = false;
    document.getElementById("modify-request-headers").disabled = false;
});

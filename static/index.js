const color = document.getElementById("color");

let controlledframe // initial
// let controlledframe;
const captures = document.getElementById("captures");

let interceptor;
let blockingRequests = false;
let modifyingRequests = false;

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



const cfLoadStart = (e) => {
  console.log("Controlled Frame API: Load start: ", JSON.stringify(e));
};

const cfLoadAbort = (e) => {
  console.log("Controlled Frame API: Load aborted: ", JSON.stringify(e));
};

const cfLoadCommit = (e) => {
  console.log("Controlled Frame API: Load commit: ", JSON.stringify(e));
};

const cfLoadRedirect = (e) => {
  console.log("Controlled Frame API: Load Redirect: ", JSON.stringify(e));
};

const cfConsoleMessage = (e) => {
  console.log(
    "Controlled Frame API: Guest page logged a message: ",
    e.message
  );
};

const cfPermissionRequest = (e) => {
  if (e.permission === "media") {
    e.request.allow();
  }
};

const cfClose = () => {
  console.log("Controlled Frame API: Controlled Frame closed");
  uninitializeControlledFrame();
};

const cfExit = () => {
  console.log("Controlled Frame API: Goodbye, world!");
};

const cfBlockRequests = (e) => {
  console.log('Blocking request to:', e.request.url);
  e.preventDefault();
}

const cfModifyRequestHeaders = (e) => {
  console.log('Modifying request headers for:', e.request.url);
  const newHeaders = new Headers(e.request.headers);
  newHeaders.append('X-Custom-Header', 'Test');
  e.setRequestHeaders(newHeaders);
}

const cfReload = () => {
  console.log("Controlled Frame API: Reloading...");
  controlledframe.reload();
}

const cfGoBack = async () => {
  await controlledframe.back();
}

const cfGoForward = async () => {
  await controlledframe.forward();
}

const cfExecuteScript = async () => {
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
}

const cfCapture = async () => {
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
}


const clearControlledFrameListeners = () => {
  // controlledframe.request.onBeforeSendHeaders.removeListener(
  //   modifyControlledFrameRequestHeaders,
  //   { urls: ["*://*/*"] },
  //   ["requestHeaders", "extraHeaders"]
  // );

  // controlledframe.request.onBeforeRequest.removeListener(
  //   blockCFRequests,
  //   { urls: ["*://*/*"] },
  //   ["blocking"]
  // );


  controlledframe.removeEventListener("loadstart", cfLoadStart);
  controlledframe.removeEventListener("loadabort", cfLoadAbort);
  controlledframe.removeEventListener("loadcommit", cfLoadCommit);
  controlledframe.removeEventListener("loadredirect", cfLoadRedirect);
  controlledframe.removeEventListener("consolemessage", cfConsoleMessage);
  controlledframe.removeEventListener("permissionrequest", cfPermissionRequest);
  controlledframe.removeEventListener("close", cfClose);
  controlledframe.removeEventListener("exit", cfExit);

  if (interceptor) {
    interceptor.removeEventListener("beforerequest", cfBlockRequests);
    interceptor.removeEventListener("beforesendheaders", cfModifyRequestHeaders);
    interceptor = null;
  }

  document.getElementById("reload-cf").removeEventListener("click", cfReload);
  document.getElementById("back").removeEventListener("click", cfGoBack);
  document.getElementById("forward").removeEventListener("click", cfGoForward);
  document.getElementById("capture").removeEventListener("click", cfCapture);
  document.getElementById("execute").removeEventListener("click", cfExecuteScript);
  
};


function addHandlers() {
  try {
    controlledframe.addEventListener("loadstart", cfLoadStart);
    controlledframe.addEventListener("loadabort", cfLoadAbort);
    controlledframe.addEventListener("loadcommit", cfLoadCommit);
    controlledframe.addEventListener("loadredirect", cfLoadRedirect);
    controlledframe.addEventListener("consolemessage", cfConsoleMessage);
    controlledframe.addEventListener("permissionrequest", cfPermissionRequest);
    controlledframe.addEventListener("close", cfClose);
    controlledframe.addEventListener("exit", cfExit);

    
    document
      .getElementById("block-requests")
      .addEventListener("click", (ev) => {

        document.getElementById("modify-request-headers").disabled = false;
        document.getElementById("block-requests").disabled = true;

        interceptor = controlledframe.request.createWebRequestInterceptor({
          urlPatterns: ["*://*/*"],
          blocking: true,
          includeHeaders: "all",
        });
        interceptor.addEventListener("beforerequest", cfBlockRequests);

      });

    document
      .getElementById("modify-request-headers")
      .addEventListener("click", (ev) => {

        document.getElementById("modify-request-headers").disabled = true;
        document.getElementById("block-requests").disabled = false;

        interceptor = controlledframe.request.createWebRequestInterceptor({
          urlPatterns: ["*://*/*"],
          blocking: false,
          includeHeaders: "all",
        });
        interceptor.addEventListener("beforesendheaders", cfModifyRequestHeaders);

      });


    // Reload CF.
    document.getElementById("reload-cf").addEventListener("click", cfReload);

    // Navigate back.
    document.getElementById("back").addEventListener("click", cfGoBack);

    // Navigate forward.
    document.getElementById("forward").addEventListener("click", cfGoForward);

    document.getElementById("capture").addEventListener("click", cfCapture);
    document.getElementById("execute").addEventListener("click", cfExecuteScript);

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
              clearControlledFrameListeners();
              controlledframe = activeContent;
              addHandlers()
              console.log(`Controlled Frame: ${activeLink.innerHTML} is now active`)
              activeContent.style.display = 'block';
            }
        }
    }


    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            tabLinks.forEach(btn => btn.classList.remove('active'));
            clearControlledFrameListeners();
            controlledframe = document.getElementById(event.currentTarget.dataset.tab);
            addHandlers()
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

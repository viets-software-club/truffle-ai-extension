const githubUrl = "https://github.com/";
const CLEAR_TEXT = "";
const ADDED_TEXT = "Y";
chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log(activeInfo, activeInfo.tabId);
  if (chrome.tab.url.startsWith(githubUrl)) {
    // check if repo already added
    fetch("http://truffle.tools/api/graphql", {
      method: "POST",
      mode: "no-cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: `query {

    }`,
    }).then(function (response) {
      const isAdded = false;
      // if added change icon
      if (isAdded) {
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: ADDED_TEXT,
        });
      } else {
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: CLEAR_TEXT,
        });
      }
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(githubUrl)) {
    const urlParts = tab.url.substring(githubUrl.length);
    const [org, repo] = urlParts.split("/");
    const badgeText = await chrome.action.getBadgeText({ tabId: tab.id });
    const isAdded = badgeText.details.text === ADDED_TEXT;
    if (!isAdded) {
      // add it
      fetch("http://truffle.tools/api/graphql", {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: `query {

        }`,
      }).then(function (response) {});

      // Set the action badge to the next state
      await chrome.action.setBadgeText({
        tabId: tab.id,
        text: CLEAR_TEXT,
      });
    } else {
      // remove
      fetch("http://truffle.tools/api/graphql", {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: `query {

        }`,
      }).then(async function (response) {
        await chrome.action.setBadgeText({
          tabId: tab.id,
          text: CLEAR_TEXT,
        });
      });
    }
  }
});

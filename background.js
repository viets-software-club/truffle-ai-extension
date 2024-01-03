const githubUrl = "https://github.com/";
const CLEAR_TEXT = "NO";
const ADDED_TEXT = "YES";
const ADDING_TEXT = "WAIT";
const INIT_TEXT = "LOAD";
const REMOVING_TEXT = "WAIT";
const ERROR_TEXT = "ERR";
const GRAPHQL_ENDPOINT = "https://2887df8.commit.truffle.tools/api/graphql"
async function isBookmarked(repoName) {
  const keys = await chrome.storage.sync.get(['apiKey', 'userApiKey'])

  if(!keys.apiKey || keys.apiKey.length < 36) {
    throw new Error("No api key");
  }

  if(!keys.userApiKey || keys.userApiKey.length != 36) {
    throw new Error("No user api key");
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      "apiKey": keys.apiKey,
      "userapikey": keys.userApiKey
    },
    body: JSON.stringify({
      query: `query {
        fIsGthbRepoBookmarked(githubreponame: "${repoName}")
      }
`}),
  });

  const result = await response.json()
 
  return !!result?.data?.fIsGthbRepoBookmarked;


}

async function init(tab) {
  if (tab.url.startsWith(githubUrl) && tab.url.substring(githubUrl.length).length > 0 && tab.url.substring(githubUrl.length).includes('/')) {    
    const urlPartsString = tab.url.substring(githubUrl.length);
    const urlParts = urlPartsString.split("/");
    if (urlParts.length > 2)
      return;
    const [org, repo] = urlParts
    if (org.length === 0 || repo.length === 0)
      return;
    try {
      await chrome.action.setBadgeBackgroundColor({ color: [210, 210, 210, 255] });
      await chrome.action.setBadgeText({
        tabId: tab.id,
        text: INIT_TEXT,
      });
      const hasBookmark = await isBookmarked(repo, tab.id)
      // if added change icon
      if (hasBookmark) {
        chrome.action.setBadgeBackgroundColor({ color: [0, 255, 0, 255] });
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: ADDED_TEXT,
        });
      } else {
        chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        chrome.action.setBadgeText({
          tabId: tab.id,
          text: CLEAR_TEXT,
        });
      }
    } catch(error) {

      if(error.message === "No api key" || error.message === "No user api key") {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: function() {
            alert('truffle-ai-extension needs two api keys. Add it on the options page.');
          }
        });
        await chrome.action.setBadgeText({
          tabId: tab.id,
          text: ERROR_TEXT,
        });
      } else {
        // fail silently, maybe url was not a repo
        await chrome.action.setBadgeText({
            tabId: tab.id,
            text: "",
          });
      }
    }
  }
}
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, async function (tab) {
    init(tab)
  })
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  const badgeText =  await chrome.action.getBadgeText({ tabId: tab.id });

  if(badgeText == "") {

    init(tab)
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(githubUrl) && tab.url.length > githubUrl.length && tab.url.substring(githubUrl.length).indexOf('/') !== -1) {
    const apikey = await chrome.storage.sync.get('apikey')
    const urlPartsString = tab.url.substring(githubUrl.length);
    const urlParts = urlPartsString.split("/");
    if(urlParts.length > 2)
      return;
    const badgeText =  await chrome.action.getBadgeText({ tabId: tab.id });

    const [org, repo] = urlParts
    if(org.length === 0 || repo.length === 0)
      return;

    const hasBookmark = await isBookmarked(repo);


    if (!hasBookmark) {
      try {
        await chrome.action.setBadgeBackgroundColor({ color: [255, 199, 0, 255] });
        await chrome.action.setBadgeText({
          tabId: tab.id,
          text: ADDING_TEXT,
        });

      // add it
      
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json",
            "userapikey": apikey.apikey

          },
          body: JSON.stringify({
            query: `mutation {
              createBookmark(repo: {owner: "${org}", name: "${repo}"}, categories: ["chrome-ext"])
            }`
          }),
        })
     

        const result = await response.json()
        if(result?.data?.createBookmark === true) {
          await chrome.action.setBadgeBackgroundColor({ color: [0, 255, 0, 255] });
          await chrome.action.setBadgeText({
            tabId: tab.id,
            text: ADDED_TEXT,
          });
          return;
        } else {
          throw new Error("Failed to add repo")
        }
      } catch  {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: function() {
            alert('truffle-ai-extension was unable to add the repo. Check if you added your user api key in the options page of the extension.');
          }
        });
        await chrome.action.setBadgeText({
          tabId: tab.id,
          text: ERROR_TEXT,
        });
      }
    
    } else {
      try {
        await chrome.action.setBadgeBackgroundColor({ color: [255, 199, 0, 255] });
        await chrome.action.setBadgeText({
          tabId: tab.id,
          text: REMOVING_TEXT,
        });
      
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json",
            "userapikey": apikey.apikey

          },
          body: JSON.stringify({
            query: `
              mutation {
                fDeleteProjBookmarkByGthbRepoName(githubreponame: "${repo}")
              }
            `
          }),
        })

        const result = await response.json()
        if (!!result?.data?.fDeleteProjBookmarkByGthbRepoName) {
          await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
          await chrome.action.setBadgeText({
            tabId: tab.id,
            text: CLEAR_TEXT,
          });
          return;
        } else {
          throw new Error("Failed to remove repo")
        }
      } catch {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: function() {
            alert('truffle-ai-extension was unable to remove the repo. Check if you added your user api key in the options page of the extension.');
          }
        });
      
        await chrome.action.setBadgeText({
          tabId: tab.id,
          text: ERROR_TEXT,
        });
      }
    
    }
  }
});

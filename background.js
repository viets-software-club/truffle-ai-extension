const githubUrl = "https://github.com/";
const CLEAR_TEXT = "NO";
const ADDED_TEXT = "YES";
const ADDING_TEXT = "WAIT";
const REMOVING_TEXT = "WAIT";

const GRAPHQL_ENDPOINT = "https://truffle.tools/api/graphql"
async function getProjRepoId(repoName) {
  const apikey = await chrome.storage.sync.get('apikey')

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      "userapikey": apikey.apikey
    },
    body: JSON.stringify({
      query: `{
          gthbRepoCollection(filter: {gthbRepoName: {eq: "${repoName}"}}) {
            edges {
              node {
                gthbRepo {
                  projRepoId
                }
              }
            }
          }
        }`}),
  });

  const result = await response.json()
 
  if(result?.data?.gthbRepoCollection?.edges?.length > 0) {
    return parseInt(result?.data?.gthbRepoCollection?.edges?.[0]?.node?.gthbRepo?.projRepoId);
  }
  return 0;

}
  chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    if (tab.url.startsWith(githubUrl) && tab.url.substring(githubUrl.length).length > 0 && tab.url.substring(githubUrl.length).includes('/')) {
  
    const urlPartsString = tab.url.substring(githubUrl.length);
    const urlParts = urlPartsString.split("/");
      if (urlParts.length > 2)
      return;
    const [org, repo] = urlParts
    if (org.length === 0 || repo.length === 0)
      return;

  

    const repoId = await getProjRepoId(repo)
    // if added change icon
      if (repoId) {

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

    const repoId = await getProjRepoId(repo);


    if (!repoId) {

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
      } else {
        alert('was unable to add repo')
      }
    
    } else {

      await chrome.action.setBadgeBackgroundColor({ color: [255, 199, 0, 255] });
      await chrome.action.setBadgeText({
        tabId: tab.id,
        text: REMOVING_TEXT,
      });
      // remove
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
              fDeleteProjBookmarkByProjRepoId(projrepoid: ${repoId})
            }
          `
        }),
      })

      const result = await response.json()
      if (result.data.fDeleteProjBookmarkByProjRepoId > 0) {
        await chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        await chrome.action.setBadgeText({
          tabId: tab.id,
          text: CLEAR_TEXT,
        });
      } else {
        alert('was unable to delete repo')
      }
    
    }
  }
});

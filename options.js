const saveOptions = () => {
  const userApiKey = document.getElementById('userapikey').value;
  const apiKey = document.getElementById('apikey').value;

  chrome.storage.sync.set(
    { userApiKey, apiKey },
    () => {
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

const restoreOptions = () => {
  chrome.storage.sync.get(
    ['apiKey', 'userApiKey'],
    (items) => {
      document.getElementById('apikey').value = items.apiKey || "";
      document.getElementById('userapikey').value = items.userApiKey || "";
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
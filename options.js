const saveOptions = () => {
  const key = document.getElementById('apikey').value;

  chrome.storage.sync.set(
    { apikey: key},
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
    'apikey',
    (items) => {
      document.getElementById('apikey').value = items.apikey;
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
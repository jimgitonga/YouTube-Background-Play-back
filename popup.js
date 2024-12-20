document.addEventListener('DOMContentLoaded', () => {
    const settings = {
      enableBackgroundPlay: true,
      forcePictureInPicture: false,
      maintainQuality: true,
      rememberPlaybackSpeed: true
    };
  
    chrome.storage.sync.get(settings, (stored) => {
      Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
          element.checked = stored[key];
          element.addEventListener('change', () => {
            const update = { [key]: element.checked };
            chrome.storage.sync.set(update);
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'updateSettings',
                settings: update
              });
            });
          });
        }
      });
    });
  });
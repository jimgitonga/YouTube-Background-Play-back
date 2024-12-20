chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
      enableBackgroundPlay: true,
      forcePictureInPicture: false,
      maintainQuality: true,
      rememberPlaybackSpeed: true,
      preventAds: false,
      lastPlaybackSpeed: 1
    });
  });
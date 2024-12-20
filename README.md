# YouTube Background Play Extension

## Quick Setup
```bash
mkdir youtube-background-play && cd youtube-background-play && touch manifest.json content.js background.js popup.html popup.js styles.css icon48.png icon128.png
```

## File Contents

### manifest.json
```json
{
  "manifest_version": 2,
  "name": "Enhanced YouTube Background Play",
  "version": "1.0",
  "description": "Advanced YouTube background playback with additional features",
  "permissions": [
    "tabs",
    "storage",
    "*://*.youtube.com/*"
  ],
  "icons": {
    "48": "icon48.png",
    "128": "icon128.png"
  },
  "browser_action": {
    "default_popup": "popup.html",
    "default_icon": "icon48.png"
  },
  "content_scripts": [
    {
      "matches": ["*://*.youtube.com/*"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ],
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  }
}
```

### content.js
```javascript
(function() {
  let settings = {
    enableBackgroundPlay: true,
    forcePictureInPicture: false,
    maintainQuality: true,
    rememberPlaybackSpeed: true,
    preventAds: false,
    lastPlaybackSpeed: 1
  };

  // Load settings from storage
  chrome.storage.sync.get(settings, (stored) => {
    settings = { ...settings, ...stored };
  });

  class YouTubeEnhancer {
    constructor() {
      this.video = null;
      this.initializeMutationObserver();
      this.setupMessageListener();
    }

    initializeMutationObserver() {
      const observer = new MutationObserver(() => {
        const video = document.querySelector('video');
        if (video && video !== this.video) {
          this.setupVideoElement(video);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    setupVideoElement(video) {
      this.video = video;
      this.attachVideoListeners();
      this.applyStoredSettings();
    }

    attachVideoListeners() {
      if (!this.video) return;

      // Prevent pausing when tab is not visible
      document.addEventListener('visibilitychange', () => {
        if (settings.enableBackgroundPlay && document.hidden && this.video.paused) {
          this.video.play();
        }
      });

      // Handle playback speed persistence
      this.video.addEventListener('ratechange', () => {
        if (settings.rememberPlaybackSpeed) {
          settings.lastPlaybackSpeed = this.video.playbackRate;
          chrome.storage.sync.set({ lastPlaybackSpeed: this.video.playbackRate });
        }
      });

      // Picture-in-Picture support
      if (settings.forcePictureInPicture && document.pictureInPictureEnabled) {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden && !document.pictureInPictureElement) {
            this.video.requestPictureInPicture();
          }
        });
      }

      // Quality maintenance
      if (settings.maintainQuality) {
        const qualityObserver = new MutationObserver(() => {
          const qualityMenu = document.querySelector('.ytp-settings-menu');
          if (qualityMenu && qualityMenu.style.display !== 'none') {
            const highestQuality = document.querySelector('.ytp-quality-menu .ytp-menuitem:first-child');
            if (highestQuality) {
              highestQuality.click();
            }
          }
        });

        qualityObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }

    applyStoredSettings() {
      if (settings.rememberPlaybackSpeed && this.video) {
        this.video.playbackRate = settings.lastPlaybackSpeed;
      }
    }

    setupMessageListener() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'updateSettings') {
          settings = { ...settings, ...request.settings };
          this.applyStoredSettings();
          sendResponse({ success: true });
        }
      });
    }
  }

  // Initialize the enhancer
  new YouTubeEnhancer();
})();
```

### background.js
```javascript
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
```

### popup.html
```html
<!DOCTYPE html>
<html>
<head>
  <title>YouTube Enhancer Settings</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="settings-container">
    <h2>YouTube Enhancer Settings</h2>
    <div class="setting-item">
      <label>
        <input type="checkbox" id="enableBackgroundPlay">
        Enable Background Play
      </label>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" id="forcePictureInPicture">
        Auto Picture-in-Picture
      </label>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" id="maintainQuality">
        Maintain Highest Quality
      </label>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" id="rememberPlaybackSpeed">
        Remember Playback Speed
      </label>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

### styles.css
```css
.settings-container {
  width: 300px;
  padding: 15px;
  font-family: Arial, sans-serif;
}

.setting-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.setting-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.setting-item input[type="checkbox"] {
  margin-right: 10px;
}
```

### popup.js
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const settings = {
    enableBackgroundPlay: true,
    forcePictureInPicture: false,
    maintainQuality: true,
    rememberPlaybackSpeed: true
  };

  // Load saved settings
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
```

### Icons
Download these icons and save them in your extension directory:
- icon48.png: https://cdn.icon-icons.com/icons2/2248/PNG/48/youtube_play_icon_138780.png
- icon128.png: https://cdn.icon-icons.com/icons2/2248/PNG/128/youtube_play_icon_138780.png

## Installation
1. Create all files with the contents above
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select your extension folder

## Usage
1. Click the extension icon to access settings
2. Configure your preferred options
3. Visit YouTube and enjoy uninterrupted playback
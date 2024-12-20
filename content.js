(function() {
    let settings = {
      enableBackgroundPlay: true,
      forcePictureInPicture: false,
      maintainQuality: true,
      rememberPlaybackSpeed: true,
      preventAds: false,
      lastPlaybackSpeed: 1
    };
  
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
        document.addEventListener('visibilitychange', () => {
          if (settings.enableBackgroundPlay && document.hidden && this.video.paused) {
            this.video.play();
          }
        });
        this.video.addEventListener('ratechange', () => {
          if (settings.rememberPlaybackSpeed) {
            settings.lastPlaybackSpeed = this.video.playbackRate;
            chrome.storage.sync.set({ lastPlaybackSpeed: this.video.playbackRate });
          }
        });
        if (settings.forcePictureInPicture && document.pictureInPictureEnabled) {
          document.addEventListener('visibilitychange', () => {
            if (document.hidden && !document.pictureInPictureElement) {
              this.video.requestPictureInPicture();
            }
          });
        }
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
  
    new YouTubeEnhancer();
  })();
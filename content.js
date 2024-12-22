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
  
        // Prevent pausing when tab is not visible and handle "Continue watching" dialog
        document.addEventListener('visibilitychange', () => {
          if (settings.enableBackgroundPlay && document.hidden && this.video.paused) {
            this.video.play();
            
            // Handle "Continue watching?" dialog
            setInterval(() => {
              const confirmButton = document.querySelector('.ytp-confirm-dialog-button');
              if (confirmButton) {
                confirmButton.click();
              }
            }, 1000);
            
            // Remove any video pause overlay
            const pauseOverlay = document.querySelector('.ytp-pause-overlay');
            if (pauseOverlay) {
              pauseOverlay.style.display = 'none';
            }
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
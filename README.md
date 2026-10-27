# X Smart Unmute

**Autoplay with sound. Your volume, your choice.**

A lightweight [Tampermonkey](https://www.tampermonkey.net/) userscript for X (Twitter) that automatically unmutes playing videos, remembers your preferred volume, and still lets you mute individual videos.

## Features

- **Automatic unmute:** Videos that X starts playing are unmuted automatically.
- **17% initial volume:** The default is comfortable rather than the usual 100%.
- **Remembered volume:** Change the volume on one video and use that level for subsequent videos, even after a page refresh or browser restart.
- **Manual mute works:** Mute a specific video or turn its volume down without the script immediately overriding you.
- **Native autoplay stays in control:** The script does not call `video.play()` or force videos to start.
- **No external requests:** No analytics, accounts, or data transmission. Only your volume preference is saved locally in the site's `localStorage`.

## Install

1. Install **Tampermonkey** in your browser.
2. **[Install X Smart Unmute](https://raw.githubusercontent.com/VicDavis/x-smart-unmute/main/x-smart-unmute.user.js)** (open the link in a browser with Tampermonkey enabled, then approve the installation).
3. Open or refresh [x.com](https://x.com).

**Yandex Browser:** In the Tampermonkey extension settings, enable **Allow user scripts** (`Разрешить пользовательские скрипты`).

If you already use another Twitter/X auto-unmute extension or script, disable it to avoid conflicting volume controls.

## How it works

The script watches X video elements, unmutes them when playback starts, and remembers manual volume changes. It keeps track of manual mute separately for each video. The last positive volume is saved under `x-auto-unmute-volume-v4-1` in the site's `localStorage`, so it survives reloads.

It runs only on `x.com` and `twitter.com` and needs no special Tampermonkey API permissions (`@grant none`).

## Compatibility

Tested with **Yandex Browser (Chromium)** and **Tampermonkey 5.6.6239**. Other Chromium-based browsers may work, but have not been verified here. Browser autoplay restrictions and future changes to X's video player can affect behavior. Volume preferences are local to each site origin and browser profile.

## License

[MIT](LICENSE). Not affiliated with X, Twitter, or Tampermonkey.

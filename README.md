# Smart Unmute for X (Twitter)

Automatically enables sound on videos in X (Twitter) and remembers your preferred volume.

## Features

- **Auto Unmute:** Videos play with sound automatically.
- **17% default volume:** No unexpected full-volume playback.
- **Remember Volume:** Your chosen volume applies to subsequent videos and is saved across page reloads and browser restarts.
- **Privacy:** No tracking or external requests. Your volume preference is stored locally.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/changelog.php?version=5.6.6242&ext=mfdh#v5.6.6239) from its official website.
2. Allow user scripts in your browser, if this permission is not already enabled. In Chromium-based browsers:
   - Open the extensions page: enter `chrome://extensions/` (Chrome) or `browser://extensions/` (Yandex Browser) in the address bar.
   - Select **Tampermonkey → Details**.
   - Find **Allow user scripts** and turn it on. If it is already on, leave it as is.
   - This is a **browser extension permission**, not a setting inside the Tampermonkey dashboard. Names and availability may vary by browser.
3. [Install Smart Unmute](https://raw.githubusercontent.com/VicDavis/x-smart-unmute/main/x-smart-unmute.user.js) and confirm installation in Tampermonkey.
4. Open [X (Twitter)](https://x.com) or refresh an existing tab.

Videos will now play with sound at your preferred volume.

## License

[MIT License](LICENSE). Free and open source.

// ==UserScript==
// @name         X Auto Unmute + Remember Volume
// @namespace    local.x-auto-unmute
// @version      4.1.0
// @description  Автоматически включает звук у видео X, запоминает громкость и позволяет вручную отключать звук у конкретного видео.
// @match        https://x.com/*
// @match        https://twitter.com/*
// @match        https://www.twitter.com/*
// @run-at       document-start
// @grant        none
// @sandbox      raw
// @noframes
// ==/UserScript==

(() => {
    'use strict';

    const STORAGE_KEY = 'x-auto-unmute-volume-v4-1';
    const DEFAULT_VOLUME = 0.17;
    const CHECK_INTERVAL = 250;
    const USER_WINDOW = 1500;

    const states = new WeakMap();
    let savedVolume = loadVolume();
    let activeUserVideo = null;

    function clampVolume(value) {
        value = Number(value);

        if (!Number.isFinite(value)) {
            return DEFAULT_VOLUME;
        }

        return Math.min(1, Math.max(0.01, value));
    }

    function loadVolume() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);

            return value === null
                ? DEFAULT_VOLUME
                : clampVolume(value);
        } catch {
            return DEFAULT_VOLUME;
        }
    }

    function saveVolume(value) {
        if (!(value > 0)) {
            return;
        }

        savedVolume = clampVolume(value);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                String(savedVolume)
            );
        } catch {}
    }

    function findPropertyDescriptor(object, property) {
        let current = object;

        while (current) {
            const descriptor =
                Object.getOwnPropertyDescriptor(
                    current,
                    property
                );

            if (
                descriptor &&
                typeof descriptor.get === 'function' &&
                typeof descriptor.set === 'function'
            ) {
                return descriptor;
            }

            current = Object.getPrototypeOf(current);
        }

        return null;
    }

    function prepareVideo(video) {
        let state = states.get(video);

        if (state) {
            return state;
        }

        const mutedDescriptor =
            findPropertyDescriptor(
                Object.getPrototypeOf(video),
                'muted'
            );

        state = {
            mutedDescriptor,
            bound: false,
            forceUnmuted: false,
            userMuted: false,
            internalVolume: false,
            userUntil: 0,
            allowMuteUntil: 0,
            source: ''
        };

        states.set(video, state);

        if (mutedDescriptor) {
            try {
                Object.defineProperty(
                    video,
                    'muted',
                    {
                        configurable: true,
                        enumerable:
                            mutedDescriptor.enumerable ?? true,

                        get() {
                            return mutedDescriptor.get.call(this);
                        },

                        set(value) {
                            const s = states.get(this);
                            const now = performance.now();

                            if (
                                value === true &&
                                s &&
                                s.forceUnmuted &&
                                !s.userMuted &&
                                now > s.allowMuteUntil
                            ) {
                                return;
                            }

                            mutedDescriptor.set.call(
                                this,
                                value
                            );
                        }
                    }
                );
            } catch {}
        }

        return state;
    }

    function syncSource(video) {
        const state = prepareVideo(video);

        const source =
            video.currentSrc ||
            video.src ||
            '';

        if (
            source &&
            source !== state.source
        ) {
            state.source = source;
            state.forceUnmuted = false;
            state.userMuted = false;
            state.userUntil = 0;
            state.allowMuteUntil = 0;
        }

        return state;
    }

    function setMutedDirectly(video, value) {
        const state = prepareVideo(video);

        try {
            if (state.mutedDescriptor) {
                state.mutedDescriptor.set.call(
                    video,
                    value
                );
            } else {
                video.muted = value;
            }
        } catch {}
    }

    function setVolumeDirectly(video, value) {
        const state = prepareVideo(video);

        state.internalVolume = true;

        try {
            video.volume = clampVolume(value);
        } catch {}

        setTimeout(() => {
            state.internalVolume = false;
        }, 80);
    }

    function isPlaying(video) {
        return (
            !video.paused &&
            !video.ended &&
            video.readyState >= 2
        );
    }

    function enableSound(video) {
        if (
            !(video instanceof HTMLVideoElement)
        ) {
            return;
        }

        const state = syncSource(video);

        if (!isPlaying(video)) {
            return;
        }

        if (state.userMuted) {
            return;
        }

        if (
            performance.now() <
            state.userUntil
        ) {
            return;
        }

        state.forceUnmuted = true;

        if (
            Math.abs(
                video.volume - savedVolume
            ) > 0.005
        ) {
            setVolumeDirectly(
                video,
                savedVolume
            );
        }

        if (video.muted) {
            setMutedDirectly(
                video,
                false
            );
        }

        try {
            video.defaultMuted = false;
        } catch {}

        if (
            video.hasAttribute('muted')
        ) {
            video.removeAttribute('muted');
        }
    }

    function updateFromUser(video) {
        if (
            !(video instanceof HTMLVideoElement)
        ) {
            return;
        }

        const state = syncSource(video);

        if (
            video.muted ||
            video.volume <= 0.001
        ) {
            state.userMuted = true;
            state.forceUnmuted = false;
            return;
        }

        state.userMuted = false;
        state.forceUnmuted = true;

        saveVolume(video.volume);
    }

    function bindVideo(video) {
        if (
            !(video instanceof HTMLVideoElement)
        ) {
            return;
        }

        const state = prepareVideo(video);

        if (state.bound) {
            return;
        }

        state.bound = true;

        const startedPlaying = () => {
            syncSource(video);

            enableSound(video);

            requestAnimationFrame(() => {
                enableSound(video);
            });

            setTimeout(
                () => enableSound(video),
                60
            );

            setTimeout(
                () => enableSound(video),
                180
            );
        };

        video.addEventListener(
            'play',
            startedPlaying,
            true
        );

        video.addEventListener(
            'playing',
            startedPlaying,
            true
        );

        video.addEventListener(
            'volumechange',
            () => {
                const s =
                    states.get(video);

                if (
                    !s ||
                    s.internalVolume
                ) {
                    return;
                }

                if (
                    activeUserVideo === video ||
                    performance.now() <
                        s.userUntil
                ) {
                    updateFromUser(video);
                }
            },
            true
        );

        if (isPlaying(video)) {
            startedPlaying();
        }
    }

    function findVideoFromControl(target) {
        if (
            !(target instanceof Element)
        ) {
            return null;
        }

        const player =
            target.closest(
                '[data-testid="videoPlayer"]'
            );

        if (player) {
            const video =
                player.querySelector('video');

            if (video) {
                return video;
            }
        }

        const article =
            target.closest('article');

        if (article) {
            const videos =
                [...article.querySelectorAll('video')];

            return (
                videos.find(isPlaying) ||
                videos[0] ||
                null
            );
        }

        return null;
    }

    function beginUserAction(event) {
        if (!event.isTrusted) {
            return;
        }

        const video =
            findVideoFromControl(
                event.target
            );

        if (!video) {
            return;
        }

        const state =
            syncSource(video);

        activeUserVideo = video;

        state.userUntil =
            performance.now() +
            USER_WINDOW;

        state.allowMuteUntil =
            performance.now() +
            USER_WINDOW;

        state.forceUnmuted = false;
    }

    function endUserAction(event) {
        if (!event.isTrusted) {
            return;
        }

        const video =
            activeUserVideo ||
            findVideoFromControl(
                event.target
            );

        if (!video) {
            return;
        }

        const state =
            syncSource(video);

        state.userUntil =
            performance.now() + 250;

        state.allowMuteUntil =
            performance.now() + 250;

        setTimeout(() => {
            updateFromUser(video);

            if (
                !state.userMuted &&
                isPlaying(video)
            ) {
                enableSound(video);
            }

            if (
                activeUserVideo === video
            ) {
                activeUserVideo = null;
            }
        }, 120);
    }

    function scan(root) {
        if (!root) {
            return;
        }

        if (
            root instanceof
            HTMLVideoElement
        ) {
            bindVideo(root);
        }

        if (root.querySelectorAll) {
            root
                .querySelectorAll('video')
                .forEach(bindVideo);
        }
    }

    function checkPlayingVideos() {
        document
            .querySelectorAll('video')
            .forEach(video => {
                bindVideo(video);

                if (isPlaying(video)) {
                    enableSound(video);
                }
            });
    }

    function start() {
        document.addEventListener(
            'pointerdown',
            beginUserAction,
            true
        );

        document.addEventListener(
            'pointerup',
            endUserAction,
            true
        );

        document.addEventListener(
            'keydown',
            beginUserAction,
            true
        );

        document.addEventListener(
            'keyup',
            endUserAction,
            true
        );

        scan(document);

        const observer =
            new MutationObserver(
                mutations => {
                    for (
                        const mutation
                        of mutations
                    ) {
                        for (
                            const node
                            of mutation.addedNodes
                        ) {
                            if (
                                node.nodeType === 1
                            ) {
                                scan(node);
                            }
                        }
                    }
                }
            );

        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );

        setInterval(
            checkPlayingVideos,
            CHECK_INTERVAL
        );

        checkPlayingVideos();

        console.info(
            '[X Auto Unmute] v4.1 loaded. Volume:',
            savedVolume
        );
    }

    if (document.documentElement) {
        start();
    } else {
        const startupObserver =
            new MutationObserver(
                (_, observer) => {
                    if (
                        document.documentElement
                    ) {
                        observer.disconnect();
                        start();
                    }
                }
            );

        startupObserver.observe(
            document,
            {
                childList: true,
                subtree: true
            }
        );
    }
})();

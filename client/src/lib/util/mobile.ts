function isMobile() {
    // If we're on a mobile browser. For now this is just a media query for (max-width: 700px).
    return window.matchMedia && window.matchMedia("(max-width: 700px)").matches;
}
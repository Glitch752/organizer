export let deviceType = $state({
    isMobile: checkMobile()
});

function checkMobile() {
    // If we're on a mobile browser. For now this is just a media query for (max-width: 700px).
    return window.matchMedia("(max-width: 700px)").matches;
}

export function isMobile() {
    return deviceType.isMobile;
}

window.addEventListener("resize", () => {
    deviceType.isMobile = checkMobile();
});
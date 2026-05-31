"use strict";

document.addEventListener("click", (event) => {
    if (!isTargetPage()) return;

    const videoID = getCurrentVideoId();
    if (!videoID) return;

    const targetEle = event.target;

    // if timestamp, handle timestamp
    if (isTimestamp(targetEle)) {
        const linkEle = toOriginal(targetEle);
        if (isOnThisVideo(videoID, linkEle)) {
            const time = getTime(linkEle);
            changeVideoTime(time);
            preventScrolling(event);
            log(time);
            return;
        }
    }

    // chapter
    const endpoint = getEndpoint(videoID, toOriginal(targetEle));
    if (endpoint) {
        const time = getTime(endpoint);
        changeVideoTime(time);
        preventScrolling(event);
        log(time);
        return;
    }
}, { capture: true })

// /watch /liveページのどちらかであるときのみ拡張機能が発動するため
function isTargetPage() {
    return location.pathname === "/watch" || location.pathname.startsWith("/live/");
}

// 現在のページの動画IDを返す。対応ページでなければ null を返す。
function getCurrentVideoId() {
    return getVideoIdFromUrl(location.href);
}

// URL(絶対/相対)から動画IDを返す。/watch?v=ID と /live/ID の両形式に対応。
// 取得できなければ null。
function getVideoIdFromUrl(url) {
    try {
        const u = new URL(url, "https://www.youtube.com/watch");
        if (u.pathname === "/watch") return u.searchParams.get("v");
        if (u.pathname.startsWith("/live/")) return u.pathname.split("/")[2] || null;
        return null;
    } catch (err) {
        if (err instanceof TypeError) return null;
        handleUnexpectedErr(err);
        return null;
    }
}

//
// endpointとはvideoのタイム付きのリンク
// chapterをクリックするとき、endpointの子要素のどれかをクリックすることになる。
// 最大3回まで親要素をたどって、endpointが見つける。
//

// chapterのendpointか判定
function isEndpoint(videoId, ele) {
    return (ele &&
        ele.tagName === "A" &&
        ele.getAttribute("id") === "endpoint" &&
        getVideoIdFromUrl(ele.getAttribute("href")) === videoId &&
        getParam(ele.getAttribute("href"), "t") !== null
    );
}

// chapterのendpointを返す
function getEndpoint(videoId, ele) {
    for (let i = 0; i < 4; i++) {
        if (!ele) break;
        if (isEndpoint(videoId, ele)) {
            return ele;
        }
        ele = ele.parentElement;
    }
    return null;
}


// timestamp format is "(0(0):)0(0):00"
// () is or
function isTimestamp(ele) {
    let str = ele.textContent;

    let ctColon = 0
    let ctNumBtwColon = 0
    for (let i = 0; i < str.length; i++) {
        if (str[i] === ":")
            if (ctNumBtwColon === 1 || ctNumBtwColon === 2) {
                ctNumBtwColon = 0;
                ctColon++;
            }
            else return false

        else if ("0" <= str[i] && str[i] <= "9") ctNumBtwColon++
        else return false;
    }
    if (ctNumBtwColon === 2 && (ctColon === 1 || ctColon === 2)) return true;
    else return false;
}

// 別動画へのタイムスタンプもあるため
// timestamp link's 'href' must point to this video
// (/watch?v=[videoId] または /live/[videoId] 形式)
function isOnThisVideo(videoId, ele) {
    const url = ele.getAttribute("href");
    if (url === null) return false;

    return getVideoIdFromUrl(url) === videoId;
}

// if web translation
function toOriginal(ele) {
    if (ele.tagName === "FONT") return ele.parentElement.parentElement;
    else return ele;
}

function getParam(url, key) {
    try {
        return new URL(url, "https://www.youtube.com/watch").searchParams.get(key);
    } catch (err) {
        if (err === TypeError) return null;
        else handleUnexpectedErr(err);
    }
}

// get time seconds from link url
function getTime(ele) {
    const time = getParam(ele.getAttribute("href"), "t");
    if (time === null) return "0";
    else return time;
}

function changeVideoTime(time) {
    document.querySelector("video").currentTime = parseInt(time);
}

function preventScrolling(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
}

// if successful
function log(time) {
    console.log(`time: ${time}`);
    console.log("prevent scrolling!");
}

function handleUnexpectedErr(err) {
    console.log(err);
}
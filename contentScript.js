"use strict";

//
// chapterをクリックするとき、endpointの子要素のどれかをクリックすることになる。
// 最大3回まで親要素をたどって、endpointが見つける。
//

// chapterのendpointか判定
function is_endpoint(ele, re) {
    return (ele &&
        ele.tagName == "A" &&
        ele.getAttribute("id") == "endpoint" &&
        ele.classList.value == "yt-simple-endpoint style-scope ytd-macro-markers-list-item-renderer" &&
        re.test(ele.getAttribute("href"))
    );
}

// chapterのendpointを返す
function return_endpoint(ele, re) {
    for (let i = 0; i < 4; i++) {
        if (!ele) break;
        if (is_endpoint(ele, re)) {
            return ele;
        }
        ele = ele.parentElement;
    }
    return null;
}

// クリックした時
document.addEventListener("click", (event) => {

    // 動画再生ページかどうか
    if (location.pathname == "/watch") {

        const videoID = location.search.slice(3, 14);

        const re = RegExp(`t=[0-9]+s`);

        let target_ele = event.target;

        // web翻訳している場合のため
        if (target_ele.tagName == "FONT" &&

            target_ele.getAttribute("style") == "vertical-align: inherit;" &&

            target_ele.parentElement &&

            target_ele.parentElement.tagName == "FONT" &&

            target_ele.parentElement.getAttribute("style") == "vertical-align: inherit;" &&

            target_ele.parentElement.parentElement
        ) {
            target_ele = target_ele.parentElement.parentElement;
        }

        // クリックしたリンクがタイムスタンプかどうか
        if (target_ele.tagName == "A" &&

            (target_ele.classList.value == "yt-simple-endpoint style-scope yt-formatted-string" ||
                target_ele.classList.value == "yt-core-attributed-string__link yt-core-attributed-string__link--display-type yt-core-attributed-string__link--call-to-action-color"
            ) &&

            re.test(target_ele.getAttribute("href"))
        ) {
            const time = target_ele.getAttribute("href").match(re)[0].slice(2, -1)

            const videoEle = document.querySelector("video");

            videoEle.currentTime = parseInt(time);

            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();

            // debug用
            console.log(`time: ${time}`);
            console.log("prevent scroll!");
            return;
        }

        // 0秒の時
        if (target_ele.tagName == "A" &&

            target_ele.classList.value == "yt-simple-endpoint style-scope yt-formatted-string" &&

            target_ele.getAttribute("href") == `/watch?v=${videoID}`
        ) {

            const videoEle = document.querySelector("video");

            videoEle.currentTime = 0;

            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();

            // debug用
            console.log("time: 0");
            console.log("prevent scroll!");
            return;
        }

        // chapter
        const endpoint = return_endpoint(target_ele, re);
        if (endpoint) {
            const time = endpoint.getAttribute("href").match(re)[0].slice(2, -1)

            const videoEle = document.querySelector("video");

            videoEle.currentTime = parseInt(time);

            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();

            // debug用
            console.log(`time: ${time}`);
            console.log("prevent scroll!");
            return;
        }
    }

}, { capture: true })

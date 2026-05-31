// @ts-check
const { test, expect } = require("./fixtures/extension");
const {
    dismissConsent,
    openComments,
    findCommentTimestamp,
    expandDescription,
    findDescriptionTimestamp,
    assertNoScrollToTop,
} = require("./helpers");

// 対象動画（環境変数で上書き可能）
const WATCH_VIDEO_ID = process.env.WATCH_VIDEO_ID || "eKC3_9gRrOI";
// ホーム→動画 のSPA遷移用の検索クエリ。動画IDで検索すると当該動画が結果に出る。
const SEARCH_QUERY = process.env.SEARCH_QUERY || WATCH_VIDEO_ID;

// /live ページ（ライブアーカイブ）用の動画ID。対象URLは後で指定するため、
// 既定はプレースホルダ。実行時は LIVE_VIDEO_ID=xxxxxxxxxxx で上書きする。
const LIVE_VIDEO_ID = process.env.LIVE_VIDEO_ID || "1J_9-rpdPzw";

const HOME_URL = "https://www.youtube.com/?hl=en";
const WATCH_URL = `https://www.youtube.com/watch?v=${WATCH_VIDEO_ID}&hl=en`;
const LIVE_URL = `https://www.youtube.com/live/${LIVE_VIDEO_ID}?hl=en`;

// 成功条件は「タイムスタンプをクリックしても先頭へスクロールしないこと」のみ。

test("ケースA: ホーム→検索でSPA遷移→動画→コメントのタイムスタンプ", async ({ context }) => {
    const page = await context.newPage();
    await page.goto(HOME_URL, { waitUntil: "domcontentloaded" });
    await dismissConsent(page);

    // 検索してSPA遷移（フルリロードなし）で対象動画を開く
    const searchBox = page.locator('input#search, input[name="search_query"]').first();
    await searchBox.click();
    await searchBox.fill(SEARCH_QUERY);
    await searchBox.press("Enter");

    const result = page.locator(`a#video-title[href*="watch?v=${WATCH_VIDEO_ID}"]`).first();
    await expect(result).toBeVisible({ timeout: 30_000 });
    await result.click();

    await expect(page).toHaveURL(new RegExp(`watch\\?v=${WATCH_VIDEO_ID}`), { timeout: 30_000 });

    await openComments(page);
    const link = await findCommentTimestamp(page);
    await assertNoScrollToTop(page, link);
});

test("ケースB: 動画を直接開く→コメントのタイムスタンプ", async ({ context }) => {
    const page = await context.newPage();
    await page.goto(WATCH_URL, { waitUntil: "domcontentloaded" });
    await dismissConsent(page);

    await openComments(page);
    const link = await findCommentTimestamp(page);
    await assertNoScrollToTop(page, link);
});

test("ケースC: 動画を直接開く→概要欄(description)のタイムスタンプ", async ({ context }) => {
    const page = await context.newPage();
    await page.goto(WATCH_URL, { waitUntil: "domcontentloaded" });
    await dismissConsent(page);

    await expandDescription(page);
    const link = await findDescriptionTimestamp(page);
    await assertNoScrollToTop(page, link);
});

test("ケースD: /live ページ(ライブアーカイブ)→コメントのタイムスタンプ", async ({ context }) => {
    const page = await context.newPage();
    await page.goto(LIVE_URL, { waitUntil: "domcontentloaded" });
    await dismissConsent(page);

    await openComments(page);
    const link = await findCommentTimestamp(page);
    await assertNoScrollToTop(page, link);
});

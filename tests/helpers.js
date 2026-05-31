// @ts-check
const { expect } = require("@playwright/test");

// "0:00" / "00:00" / "0:00:00" / "00:00:00" 形式
const TIMESTAMP_RE = /^\s*\d{1,2}:\d{2}(:\d{2})?\s*$/;

/**
 * 同意ダイアログ（consent.youtube.com / "Before you continue to YouTube"）が
 * 出ていれば閉じる。出ていなければ何もしない（tolerant）。
 */
async function dismissConsent(page) {
    // ボタンの文言で広めに拾う（英語ロケール固定前提）
    const buttons = [
        'button[aria-label*="Accept"]',
        'button[aria-label*="Reject"]',
        'button:has-text("Accept all")',
        'button:has-text("Reject all")',
        'tp-yt-paper-button:has-text("Accept all")',
        'tp-yt-paper-button:has-text("Reject all")',
    ];
    for (const sel of buttons) {
        const btn = page.locator(sel).first();
        try {
            if (await btn.isVisible({ timeout: 2000 })) {
                await btn.click();
                await page.waitForLoadState("domcontentloaded");
                return;
            }
        } catch {
            // セレクタ不一致は無視して次へ
        }
    }
}

/**
 * コメント欄を読み込ませる。`#comments` までスクロールし、コメントスレッドの
 * 出現を待つ。遅延ロードのため数回スクロールを試みる。
 */
async function openComments(page) {
    for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 1200);
        await page.waitForTimeout(800);
        const count = await page.locator("ytd-comment-thread-renderer").count();
        if (count > 0) break;
    }
    await expect(page.locator("ytd-comment-thread-renderer").first()).toBeVisible({
        timeout: 30_000,
    });
}

/**
 * コメント内のタイムスタンプリンク（同一動画への &t= 付き <a>）を探して返す。
 * 見つからなければさらにスクロールしてリトライする。
 */
async function findCommentTimestamp(page) {
    const candidates = page
        .locator('ytd-comment-thread-renderer #content-text a[href*="t="]')
        .filter({ hasText: TIMESTAMP_RE });

    for (let i = 0; i < 8; i++) {
        if ((await candidates.count()) > 0) {
            const link = candidates.first();
            await link.scrollIntoViewIfNeeded();
            return link;
        }
        await page.mouse.wheel(0, 1500);
        await page.waitForTimeout(800);
    }
    throw new Error("コメント欄にタイムスタンプ付きリンクが見つかりませんでした");
}

/**
 * 概要欄（description）を展開する。すでに展開済み/ボタンが無ければ何もしない。
 */
async function expandDescription(page) {
    const expanders = [
        "ytd-text-inline-expander #expand",
        "tp-yt-paper-button#expand",
        "#description #expand",
    ];
    for (const sel of expanders) {
        const btn = page.locator(sel).first();
        try {
            if (await btn.isVisible({ timeout: 2000 })) {
                await btn.scrollIntoViewIfNeeded();
                await btn.click();
                await page.waitForTimeout(500);
                return;
            }
        } catch {
            // 無ければ次へ
        }
    }
}

/**
 * 概要欄内のタイムスタンプリンクを探して返す。
 */
async function findDescriptionTimestamp(page) {
    const scopes = [
        "#description-inline-expander",
        "ytd-watch-metadata #description",
        "#description",
    ];
    for (const scope of scopes) {
        const candidates = page
            .locator(`${scope} a[href*="t="]`)
            .filter({ hasText: TIMESTAMP_RE });
        if ((await candidates.count()) > 0) {
            const link = candidates.first();
            await link.scrollIntoViewIfNeeded();
            return link;
        }
    }
    throw new Error("概要欄にタイムスタンプ付きリンクが見つかりませんでした");
}

/**
 * 唯一の成功条件: タイムスタンプをクリックしてもページ先頭へスクロールしない。
 *
 * 拡張が効いていない場合、タイムスタンプリンクのクリックは SPA 遷移を起こして
 * ページ先頭(scrollY≈0)へ飛ぶ。これを検出するため、
 *   1. リンクが見える範囲に収まる程度にページを下方へスクロール（scrollY>0 の状態を作る）
 *   2. その状態でクリック
 *   3. クリック後も scrollY が先頭(0付近)へ戻っていないこと
 * を検証する。コメント欄・概要欄のどちらでも成立する。
 */
async function assertNoScrollToTop(page, link) {
    // リンクのページ内絶対Y座標を取得し、リンクがビューポート上部に見える位置まで下げる
    const absTop = await link.evaluate(
        (el) => el.getBoundingClientRect().top + window.scrollY
    );
    const targetScroll = Math.max(Math.round(absTop) - 150, 0);
    await page.evaluate((y) => window.scrollTo(0, y), targetScroll);
    await page.waitForTimeout(500);

    const before = await page.evaluate(() => window.scrollY);
    // 前提: 先頭ではない状態（>0）でクリックできていること
    expect(before, "クリック前にページが先頭でない位置までスクロールできていること").toBeGreaterThan(100);

    await link.click();
    await page.waitForTimeout(1500); // スクロール挙動が起きるなら起きる時間を待つ

    const after = await page.evaluate(() => window.scrollY);
    // 拡張が効いていれば先頭(0)へは戻らない
    expect(after, "タイムスタンプクリック後に先頭へスクロールしていないこと").toBeGreaterThan(100);
}

module.exports = {
    TIMESTAMP_RE,
    dismissConsent,
    openComments,
    findCommentTimestamp,
    expandDescription,
    findDescriptionTimestamp,
    assertNoScrollToTop,
};

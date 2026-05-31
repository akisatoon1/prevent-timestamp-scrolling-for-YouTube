// @ts-check
const { test: base, chromium } = require("@playwright/test");
const path = require("path");

// manifest.json があるリポジトリルート（tests/fixtures から2つ上）
const EXT_PATH = path.join(__dirname, "..", "..");

// Chrome 拡張をロードした persistent context を提供するフィクスチャ。
// このプロジェクトの拡張はコンテンツスクリプトのみなので context だけ用意すればよい。
exports.test = base.extend({
    context: async ({}, use) => {
        const context = await chromium.launchPersistentContext("", {
            headless: false, // 拡張のロード・目視のため headed
            slowMo: 600, // 操作をゆっくり見せる
            viewport: { width: 1280, height: 900 },
            args: [
                `--disable-extensions-except=${EXT_PATH}`,
                `--load-extension=${EXT_PATH}`,
                "--lang=en-US",
            ],
        });
        await use(context);
        await context.close();
    },
});

exports.expect = base.expect;

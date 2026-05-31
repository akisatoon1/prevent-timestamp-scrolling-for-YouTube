// @ts-check
const { defineConfig } = require("@playwright/test");

// 実YouTube を相手にするため、操作を目視しやすいよう headed + slowMo で動かす。
// 過程の可視化のため trace / video は常時記録する。
module.exports = defineConfig({
    testDir: "./tests",
    // 実YouTube + headed + 拡張ロードなので直列実行
    workers: 1,
    fullyParallel: false,
    // ローカル前提でシンプルに。リトライはしない（不安定なら手動で再実行）
    retries: 0,
    // YouTube の読み込み・コメント遅延ロードに余裕を持たせる
    timeout: 120_000,
    expect: { timeout: 30_000 },
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: "https://www.youtube.com",
        // テスト過程を可視化（録画・トレース・スクショ）
        trace: "on",
        video: "on",
        screenshot: "on",
    },
});

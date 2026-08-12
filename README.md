# 平面六連桿辨識系統｜6 人 HTML 分工版

本專案使用純 HTML、CSS、JavaScript 開發。六位組員各自負責一個功能頁面與一個 JavaScript 模組，完成後先合併至 `dev` 測試，最後才由 `dev` 合併至 `main`。

## 專案結構

```text
vibecoding/
├── css/
│   ├── base.css
│   └── module-page.css
├── js/
│   ├── 01-ui-geometry.js
│   ├── 02-nine-type-identification.js
│   ├── 03-numerical-solver.js
│   ├── 04-circuit-branch.js
│   ├── 05-geometry-validation.js
│   ├── 06-results-animation.js
│   └── main.js
├── pages/
│   ├── 01-ui-geometry.html
│   ├── 02-nine-type-identification.html
│   ├── 03-numerical-solver.html
│   ├── 04-circuit-branch.html
│   ├── 05-geometry-validation.html
│   └── 06-results-animation.html
├── index.html
├── TEAM_GUIDE.md
└── README.md
```

## Main

`index.html` 是最後的完整整合主程式入口；`js/main.js` 負責共用資料、狀態、跨模組整合與事件入口。這兩個共用檔案由組長或指定整合者管理，組員不要自行大幅修改。

## 六人分工

| 人員 | 分支 | 負責檔案 | 主要內容 |
|---|---|---|---|
| 1 | `feature/ui-geometry` | `pages/01-ui-geometry.html`、`js/01-ui-geometry.js` | 幾何輸入、座標／桿長輸入、頁面 UI |
| 2 | `feature/nine-type-identification` | `pages/02-nine-type-identification.html`、`js/02-nine-type-identification.js` | 九型機構自動辨識 |
| 3 | `feature/numerical-solver` | `pages/03-numerical-solver.html`、`js/03-numerical-solver.js` | 牛頓法、Jacobian、位置分析核心 |
| 4 | `feature/circuit-branch` | `pages/04-circuit-branch.html`、`js/04-circuit-branch.js` | 迴路辨識、分支辨識、死點追蹤 |
| 5 | `feature/geometry-validation` | `pages/05-geometry-validation.html`、`js/05-geometry-validation.js` | 速度瞬心、傳動角、極限圓與幾何驗證 |
| 6 | `feature/results-animation` | `pages/06-results-animation.html`、`js/06-results-animation.js` | 結果頁、動畫、表格、JSON 匯出 |

## Git 流程

```text
main（正式展示）
└── dev（整合測試）
    ├── feature/ui-geometry
    ├── feature/nine-type-identification
    ├── feature/numerical-solver
    ├── feature/circuit-branch
    ├── feature/geometry-validation
    └── feature/results-animation
```

- 組員從最新版 `dev` 開始開發。
- 原則上只修改自己負責的 `pages/*.html` 與 `js/*.js`。
- 完成後建立以 `dev` 為 base 的 Pull Request。
- 六個模組在 `dev` 整合測試完成後，再由組長建立 `main ← dev` 的 Pull Request。
- 不要直接推送到 `main` 或 `dev`。

詳細操作方式請閱讀 [`TEAM_GUIDE.md`](TEAM_GUIDE.md)。

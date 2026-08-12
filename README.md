# 平面六連桿機構分析與辨識平台

本儲存庫是暑期專題小組的純 HTML、CSS、JavaScript 協作起始專案。`main` 與 `dev` 只提供檔案骨架、分工與 TODO，不包含各組員的完成版程式。

## 開啟方式

直接在瀏覽器開啟 `index.html`，或使用 VS Code Live Server。

## 分支流程

```text
main
└── dev
    ├── feature/ui-geometry
    ├── feature/nine-type-identification
    ├── feature/numerical-solver
    ├── feature/circuit-branch
    ├── feature/geometry-validation
    └── feature/results-animation
```

組員只在自己的 `feature/*` 分支開發，完成後建立 `dev ← feature/*` 的 Pull Request。六個功能在 `dev` 整合測試完成後，再建立 `main ← dev` 的 Pull Request。

## 專案結構

```text
vibecoding/
├── index.html                         # 幾何輸入與主要頁面 UI
├── pages/
│   └── results.html                  # 結果、動畫、表格與匯出頁
├── css/
│   ├── base.css                      # 全站共用樣式（修改前先協調）
│   ├── ui-geometry.css               # 輸入頁樣式
│   └── results-animation.css         # 結果頁樣式
├── js/
│   ├── app.js                        # 全站整合入口（修改前先協調）
│   ├── ui-geometry.js                # 幾何輸入與頁面互動
│   ├── nine-type-identification.js   # 九型機構自動辨識
│   ├── numerical-solver.js           # 牛頓法、Jacobian、位置分析
│   ├── circuit-branch.js              # 迴路、分支、死點追蹤
│   ├── geometry-validation.js         # 速度瞬心、傳動角、極限圓驗證
│   └── results-animation.js           # 結果、動畫、表格與 JSON 匯出
├── assets/                            # 圖片與其他靜態資源
├── TEAM_GUIDE.md                      # 組員實作與 Git 協作指南
└── README.md
```

## 六人分工

| 人員 | 分支 | 主要負責內容 | 對應目前功能 |
|---|---|---|---|
| 1 | `feature/ui-geometry` | 幾何輸入、座標／桿長輸入、頁面 UI | Step 2、Step 3 |
| 2 | `feature/nine-type-identification` | 九型機構自動辨識 | Step 1 |
| 3 | `feature/numerical-solver` | 牛頓法、Jacobian、位置分析核心 | 數值求解核心 |
| 4 | `feature/circuit-branch` | 迴路辨識、分支辨識、死點追蹤 | 論文核心方法 |
| 5 | `feature/geometry-validation` | 速度瞬心、傳動角、極限圓 | V2.5 幾何交叉驗證 |
| 6 | `feature/results-animation` | 結果頁、動畫、表格、JSON 匯出 | Step 6、Step 7 |

詳細的檔案責任、驗收條件與操作方式請閱讀 [`TEAM_GUIDE.md`](TEAM_GUIDE.md)。

## PR 檢查清單

- [ ] 確認目前位於自己的 `feature/*` 分支
- [ ] 只修改自己負責的檔案，或已先和組長協調
- [ ] 頁面與功能可以正常執行，瀏覽器 Console 沒有錯誤
- [ ] 已測試正常值、錯誤值與邊界值
- [ ] PR 的 base 是 `dev`，不是 `main`
- [ ] 沒有提交密碼、Token、API Key、`.env` 或真實個人資料

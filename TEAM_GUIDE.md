# 平面六連桿辨識系統｜組員開發指南

本專案採用「每人一個 HTML 頁面＋一個 JavaScript 模組」的分工方式。所有人都會看到完整專案檔案，但原則上只修改自己負責的兩個檔案。

## 一、分支與整合流程

```text
main（正式展示版本）
└── dev（共同整合與測試版本）
    ├── feature/ui-geometry
    ├── feature/nine-type-identification
    ├── feature/numerical-solver
    ├── feature/circuit-branch
    ├── feature/geometry-validation
    └── feature/results-animation
```

開發規則：

1. 每位組員只在自己的 `feature/*` 分支開發。
2. 原則上只修改自己的 HTML 與 JS。
3. 完成後推送自己的分支，並建立 `dev ← feature/*` Pull Request。
4. 經組員審查後，由組長或整合者合併至 `dev`。
5. 全部功能在 `dev` 測試完成後，再建立 `main ← dev` Pull Request。
6. 組員不要直接推送到 `main` 或 `dev`。

## 二、六人分工

### 人員 1：幾何輸入與 UI

- 分支：`feature/ui-geometry`
- HTML：`pages/01-ui-geometry.html`
- JS：`js/01-ui-geometry.js`
- 內容：幾何輸入、座標／桿長輸入、頁面 UI（Step 2、Step 3）

### 人員 2：九型機構辨識

- 分支：`feature/nine-type-identification`
- HTML：`pages/02-nine-type-identification.html`
- JS：`js/02-nine-type-identification.js`
- 內容：九型機構自動辨識（Step 1）

### 人員 3：數值求解

- 分支：`feature/numerical-solver`
- HTML：`pages/03-numerical-solver.html`
- JS：`js/03-numerical-solver.js`
- 內容：牛頓法、Jacobian、位置分析核心

### 人員 4：迴路與分支

- 分支：`feature/circuit-branch`
- HTML：`pages/04-circuit-branch.html`
- JS：`js/04-circuit-branch.js`
- 內容：迴路辨識、分支辨識、死點追蹤（論文核心方法）

### 人員 5：幾何驗證

- 分支：`feature/geometry-validation`
- HTML：`pages/05-geometry-validation.html`
- JS：`js/05-geometry-validation.js`
- 內容：速度瞬心、傳動角、極限圓與幾何交叉驗證

### 人員 6：結果與動畫

- 分支：`feature/results-animation`
- HTML：`pages/06-results-animation.html`
- JS：`js/06-results-animation.js`
- 內容：結果頁、動畫、表格與 JSON 匯出（Step 6、Step 7）

## 三、共用檔案

以下檔案不屬於任何一位組員單獨所有：

- `index.html`：最終整合入口
- `js/main.js`：共用資料、狀態、跨模組整合與事件入口
- `css/base.css`：全站基本樣式
- `css/module-page.css`：六個功能頁共用樣式
- `README.md`、`TEAM_GUIDE.md`：專案說明

共用檔案由組長或指定整合者管理。若功能必須修改共用檔案，先在群組說明修改原因與範圍，避免多人同時修改造成衝突。

## 四、第一次開始

先接受 GitHub 協作者邀請，再執行：

```bash
git clone https://github.com/cheng921226/vibecoding.git
cd vibecoding
git fetch --prune origin
```

第一次切換分支時，只選自己的那一行：

```bash
git switch --track origin/feature/ui-geometry
git switch --track origin/feature/nine-type-identification
git switch --track origin/feature/numerical-solver
git switch --track origin/feature/circuit-branch
git switch --track origin/feature/geometry-validation
git switch --track origin/feature/results-animation
```

確認目前分支：

```bash
git branch --show-current
```

顯示的名稱必須是自己的 `feature/*`，不能是 `main` 或 `dev`。

## 五、已經下載過專案的人

這次共同骨架更新後，先執行：

```bash
git fetch --prune origin
git switch feature/自己的分支
git pull
```

如果電腦上有尚未提交的修改，先提交後再更新，避免切換或拉取時發生問題。

## 六、開發原則

- HTML 負責該功能的畫面、輸入欄位、按鈕與結果區域。
- JS 負責該功能的資料檢查、計算與互動。
- 不要把自己的完整功能寫入 `js/main.js`。
- 不要自行更改其他組員檔案的名稱。
- 需要共用資料格式時，先與會使用資料的組員確認欄位名稱與單位。
- 錯誤輸入應顯示說明，不應讓頁面直接停止。

## 七、測試與提交

使用 Live Server 開啟自己的 HTML 頁面，至少確認：

- 頁面能正常開啟。
- 瀏覽器 Console 沒有錯誤。
- 正常值、空值、錯誤值與邊界值都有測試。
- 沒有改壞其他組員的頁面。
- 沒有提交密碼、Token、API Key、`.env` 或真實個人資料。

提交前執行：

```bash
git branch --show-current
git status
```

只加入自己負責的檔案，例如：

```bash
git add pages/03-numerical-solver.html js/03-numerical-solver.js
git commit -m "完成數值求解模組"
git push
```

## 八、建立 Pull Request

在 GitHub 建立 Pull Request 時選擇：

```text
base：dev
compare：feature/自己的分支
```

PR 說明至少寫出：

- 完成的功能
- 修改的檔案
- 測試方式與測試資料
- 已知尚未完成的部分

指定至少一位組員審查。確認後由組長或整合者合併到 `dev`，不要自行直接合併到 `main`。

## 九、完成整合

六個功能都合併至 `dev` 後：

1. 從 `index.html` 測試完整操作流程。
2. 檢查六個 HTML 頁面與 JS 模組的連接。
3. 統一資料格式、錯誤訊息與樣式。
4. 修正整合問題。
5. 由組長建立 `main ← dev` Pull Request。

最重要的規則：每人負責自己的 HTML 與 JS，完成後先 PR 到 `dev`，最後才由 `dev` 進入 `main`。

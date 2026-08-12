# 六連桿暑期專題：組員實作與 Git 協作指南

這份指南提供六位組員共同開發「平面六連桿機構分析與辨識平台」時使用。

第一階段使用純 HTML、CSS、JavaScript，不串接資料庫、登入系統或外部 API。每位組員負責一個功能模組與自己的 JavaScript 檔案；共用檔案由指定人員整合。

---

## 一、分支流程

```text
main（最終展示版本）
└── dev（整合測試版本）
    ├── feature/ui-geometry
    ├── feature/nine-type-identification
    ├── feature/numerical-solver
    ├── feature/circuit-branch
    ├── feature/geometry-validation
    └── feature/results-animation
```

工作規則：

1. 組員只在自己的 `feature/*` 分支開發與推送。
2. 完成功能後建立 `dev ← feature/*` Pull Request。
3. 經過審查後，由組長或整合者合併到 `dev`。
4. 六個功能在 `dev` 測試完成後，才建立 `main ← dev` Pull Request。
5. 組員不要直接推送到 `main` 或 `dev`。

---

## 二、六人分工與檔案責任

| 人員 | 工作分支 | 主要檔案 | 主要負責內容 | 對應目前功能 |
|---|---|---|---|---|
| 1 | `feature/ui-geometry` | `index.html`、`js/ui-geometry.js`、`css/ui-geometry.css` | 幾何輸入、座標／桿長輸入、頁面 UI | Step 2、Step 3 |
| 2 | `feature/nine-type-identification` | `js/nine-type-identification.js` | 九型機構自動辨識 | Step 1 |
| 3 | `feature/numerical-solver` | `js/numerical-solver.js` | 牛頓法、Jacobian、位置分析核心 | 數值求解核心 |
| 4 | `feature/circuit-branch` | `js/circuit-branch.js` | 迴路辨識、分支辨識、死點追蹤 | 論文核心方法 |
| 5 | `feature/geometry-validation` | `js/geometry-validation.js` | 速度瞬心、傳動角、極限圓 | V2.5 幾何交叉驗證 |
| 6 | `feature/results-animation` | `pages/results.html`、`js/results-animation.js`、`css/results-animation.css` | 結果頁、動畫、表格、JSON 匯出 | Step 6、Step 7 |

每個人主要修改自己那一列的檔案。需要修改其他人的檔案或共用檔案時，先在群組告知檔案負責人與組長。

### 共用檔案

以下檔案容易發生合併衝突：

```text
js/app.js
css/base.css
```

- `js/app.js`：由組長或指定整合者管理，用來連接六個模組。
- `css/base.css`：由 UI 負責人或組長管理，放全站共用樣式。
- `README.md`、`TEAM_GUIDE.md`：由組長管理。

其他組員不要把自己的完整功能全部寫進 `js/app.js`。每個功能應留在自己的 JS 檔案，最後再由整合者接入頁面。

---

## 三、第一次下載與切換分支

先接受 `cheng921226/vibecoding` 的 GitHub 協作者邀請，再於 VS Code 終端機執行：

```bash
git clone https://github.com/cheng921226/vibecoding.git
cd vibecoding
git fetch --prune origin
```

第一次切換到自己的分支時，只執行屬於自己的那一行：

```bash
git switch --track origin/feature/ui-geometry
git switch --track origin/feature/nine-type-identification
git switch --track origin/feature/numerical-solver
git switch --track origin/feature/circuit-branch
git switch --track origin/feature/geometry-validation
git switch --track origin/feature/results-animation
```

請勿六行全部執行。切換後確認：

```bash
git branch --show-current
```

如果自己的分支已經建立在電腦中，使用：

```bash
git fetch --prune origin
git switch feature/自己的分支
git merge origin/dev
```

這次 `main`、`dev` 的骨架更新後，每位組員都需要將最新的 `origin/dev` 合併到自己的功能分支，才能取得新檔名與新指南。

---

## 四、各組員實作與驗收

### 人員 1：幾何輸入與頁面 UI

分支：`feature/ui-geometry`

主要檔案：`index.html`、`js/ui-geometry.js`、`css/ui-geometry.css`

應完成：

- Step 2、Step 3 的操作畫面
- 座標與桿長輸入欄位
- 清楚的欄位名稱、單位、必填提示與操作按鈕
- 基本的空白、非數字與負數提示
- 將整理後的輸入資料交給其他計算模組
- 手機與電腦都可閱讀的版面

驗收：使用者能完成輸入、看懂錯誤提示，並可啟動後續分析流程。

### 人員 2：九型機構自動辨識

分支：`feature/nine-type-identification`

主要檔案：`js/nine-type-identification.js`

應完成：

- Step 1 的九型機構辨識規則
- 支援五種 Stephenson 型與四種 Watt 型
- 合法輸入回傳類型、家族與判斷依據
- 無效或資料不足時回傳明確狀態，不硬給答案
- 準備可重複使用的測試案例

需支援的九種類型：

```text
4TSI、5TSII、5BSII、4BSIII、5BSIII
4BWI、4TWI、4BWII、4TWII
```

驗收：九種類型皆有測試案例，合法與不合法輸入能得到正確狀態。

### 人員 3：數值求解核心

分支：`feature/numerical-solver`

主要檔案：`js/numerical-solver.js`

應完成：

- 建立位置分析所需的方程式與資料格式
- 牛頓法迭代流程
- Jacobian 計算
- 收斂誤差與最大迭代次數設定
- 回傳位置解、誤差、迭代次數及收斂狀態
- 處理不收斂、奇異矩陣與錯誤輸入

驗收：至少以正常收斂、不收斂與接近奇異狀態三類資料測試。

### 人員 4：迴路、分支與死點追蹤

分支：`feature/circuit-branch`

主要檔案：`js/circuit-branch.js`

應完成：

- 依論文第三章方法建立迴路辨識
- 建立分支辨識
- 追蹤運動過程中的死點
- 記錄狀態切換與判斷原因
- 資料不足或無法判斷時回傳清楚狀態
- 使用自己的文字與程式整理方法，不整段複製論文

驗收：測試資料能顯示迴路、分支與死點狀態，並保留可供結果頁使用的判斷紀錄。

### 人員 5：幾何交叉驗證

分支：`feature/geometry-validation`

主要檔案：`js/geometry-validation.js`

應完成：

- 速度瞬心相關計算或判斷
- 傳動角計算與合理範圍提示
- 極限圓判斷
- V2.5 幾何交叉驗證流程
- 回傳驗證結果、警告與判斷依據
- 處理退化幾何、無交點及數值誤差

驗收：正常、臨界與無效幾何資料都有測試結果，並能指出驗證通過或失敗的原因。

### 人員 6：結果頁、動畫與匯出

分支：`feature/results-animation`

主要檔案：`pages/results.html`、`js/results-animation.js`、`css/results-animation.css`

應完成：

- Step 6、Step 7 的結果畫面
- 顯示九型辨識、數值求解、迴路／分支及幾何驗證結果
- 機構運動動畫與播放控制
- 結果表格與錯誤／警告訊息
- JSON 匯出
- 沒有結果資料時顯示友善提示

驗收：結果可閱讀、動畫可控制、表格內容正確，並能下載有效的 JSON 檔案。

---

## 五、模組整合約定

共同開發時，每個人負責自己的 JS，但必須先協調輸入與輸出資料格式。

合併前至少確認：

- 輸入物件的欄位名稱與單位一致。
- 每個模組都能回傳成功、警告或失敗狀態。
- 錯誤由模組回傳，不直接讓整個頁面停止。
- 結果頁需要的資料都有明確欄位。
- 函式與全域變數名稱不和其他組員重複。

若資料格式需要變更，先在群組提出並通知所有會使用該資料的組員。

---

## 六、開發與測試

1. 使用 Live Server 開啟 `index.html`。
2. 測試自己的功能與相關頁面。
3. 開啟瀏覽器開發者工具，確認 Console 沒有錯誤。
4. 測試正常值、錯誤值、空值及邊界值。
5. UI 與結果頁需要測試手機寬度。
6. 確認沒有覆蓋其他組員已完成的功能。

不要提交：

- `.env`
- 密碼、Token、API Key
- 個人真實資料
- `node_modules`
- 不屬於專題的檔案

---

## 七、提交與推送

先確認目前分支與變更：

```bash
git branch --show-current
git status
```

只加入自己負責的檔案，例如：

```bash
git add js/numerical-solver.js
git commit -m "完成數值求解核心"
git push
```

不要直接使用 `git add .`，避免把不相關的檔案一起提交。

---

## 八、建立 Pull Request

推送完成後，到 GitHub 建立 Pull Request：

```text
base：dev
compare：feature/自己的分支
```

例如：

```text
dev ← feature/numerical-solver
```

PR 說明至少包含：

```markdown
## 完成內容

- 完成哪些功能
- 修改哪些檔案
- 輸入與輸出資料格式

## 測試方式

1. 使用哪些測試資料
2. 如何操作
3. 預期看到什麼結果
```

指定另一位組員審查；確認功能、資料格式與檔案範圍後，由組長或整合者合併到 `dev`。

---

## 九、同步最新 dev

其他功能合併到 `dev` 後，在自己的分支執行：

```bash
git fetch origin
git switch feature/自己的分支
git merge origin/dev
```

發生衝突時不要直接刪除別人的內容，請找組長與相關檔案負責人一起處理。

---

## 十、最後整合與展示

1. 六個功能 PR 都先合併到 `dev`。
2. 全組從輸入頁開始測試完整流程。
3. 檢查模組資料格式、錯誤訊息、結果頁與動畫。
4. 在 `dev` 修正整合問題。
5. 組長建立 `main ← dev` Pull Request。
6. 審查通過後合併到 `main`。
7. 最後再由 `main` 設定 GitHub Pages。

最重要的規則：每個人負責自己的 JS；功能 PR 一律先進 `dev`；組員不要直接修改或推送 `main`。

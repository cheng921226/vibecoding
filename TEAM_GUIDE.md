# 六連桿暑期專題：組員實作與 Git 協作指南

這份指南提供六位組員共同開發「平面六連桿機構推薦與類型辨識平台」時使用。

本專題第一階段使用純 HTML、CSS、JavaScript，不串接資料庫、登入系統或外部 API。每位組員只在自己的功能分支工作，完成後透過 Pull Request 合併到 `dev`。

---

## 一、開始前先做的事

### 1. 接受 GitHub 邀請

組長已寄出 `cheng921226/vibecoding` 的協作者邀請。請先登入 GitHub 並接受邀請，否則只能下載專案，不能推送程式碼。

### 2. 安裝工具

建議安裝：

- Git
- Visual Studio Code
- VS Code 的 Live Server 擴充功能

### 3. 下載專案

在 VS Code 終端機執行：

```bash
git clone https://github.com/cheng921226/vibecoding.git
cd vibecoding
git fetch origin
```

查看遠端分支：

```bash
git branch -a
```

---

## 二、分支與六人分工

```text
main
└── dev
    ├── feature/home
    ├── feature/recommender
    ├── feature/identifier
    ├── feature/grashof
    ├── feature/mechanisms
    └── feature/theory
```

| 成員 | 工作分支 | 主要檔案 | 任務 |
|---|---|---|---|
| 1 | `feature/home` | `index.html` | 首頁與平台介紹 |
| 2 | `feature/recommender` | `pages/recommender.html`、`js/recommender.js` | 功能推薦器 |
| 3 | `feature/identifier` | `pages/identifier.html`、`js/identifier.js` | 拓樸類型辨識 |
| 4 | `feature/grashof` | `pages/grashof.html`、`js/grashof.js` | 桿長與 Grashof 判斷 |
| 5 | `feature/mechanisms` | `pages/mechanisms.html`、`js/data.js` | 九種機構圖鑑與共用資料 |
| 6 | `feature/theory` | `pages/theory.html` | 理論說明與整合測試 |

### 切換到自己的分支

第一次取得分支時，依照自己的任務執行其中一行：

```bash
git switch --track origin/feature/home
git switch --track origin/feature/recommender
git switch --track origin/feature/identifier
git switch --track origin/feature/grashof
git switch --track origin/feature/mechanisms
git switch --track origin/feature/theory
```

請勿六行全部執行，只執行屬於自己的那一行。

確認目前分支：

```bash
git branch --show-current
```

不要直接在 `main` 或 `dev` 開發。

---

## 三、各組員實作要求

### 成員 1：首頁

工作分支：`feature/home`

主要修改：`index.html`

應完成：

- 專題名稱與研究目的
- 平台功能介紹
- 至少三項特色或使用步驟
- 前往各功能頁面的導覽連結
- 頁首與頁尾
- 手機與電腦皆可閱讀的版面

驗收：首頁可開啟，且所有導覽連結都有正確目標。

### 成員 2：功能推薦器

工作分支：`feature/recommender`

主要修改：

- `pages/recommender.html`
- `js/recommender.js`

應完成：

- 提供路徑生成、函數生成、精密位置、複雜運動等需求選項
- 允許複選需求
- 以簡單規則或加權方式計分
- 顯示三種候選機構
- 說明各候選機構的推薦理由
- 未選需求時顯示友善提示

驗收：選擇不同需求後，推薦結果會合理改變。

注意：結果應稱為「候選機構」，不要宣稱是絕對最佳解。

### 成員 3：類型辨識器

工作分支：`feature/identifier`

主要修改：

- `pages/identifier.html`
- `js/identifier.js`

應完成：

- 選擇 Stephenson 或 Watt 家族
- 選擇輸入桿
- 選擇固定架型式
- 選擇拓樸變體
- 顯示九種類型之一
- 無效組合需顯示錯誤提示

需支援的九種類型：

```text
4TSI、5TSII、5BSII、4BSIII、5BSIII
4BWI、4TWI、4BWII、4TWII
```

驗收：合法組合顯示正確類型；不屬於九型的組合不應硬給答案。

注意：頁面必須提醒使用者，桿長不能單獨決定 Stephenson 或 Watt 類型。

### 成員 4：Grashof 判斷

工作分支：`feature/grashof`

主要修改：

- `pages/grashof.html`
- `js/grashof.js`

應完成：

- 輸入四個桿長
- 排除空白、零、負數及非數字
- 將四個長度由小到大排列為 `s ≤ p ≤ q ≤ l`
- 比較 `s + l` 與 `p + q`
- 顯示計算過程與判斷結果

判斷規則：

```text
s + l < p + q：Grashof
s + l = p + q：臨界 Grashof
s + l > p + q：Non-Grashof
```

驗收：至少測試三組資料，分別得到三種結果。

注意：Grashof 結果不能直接用來判定 Stephenson 或 Watt 類型。

### 成員 5：九型機構圖鑑

工作分支：`feature/mechanisms`

主要修改：

- `pages/mechanisms.html`
- `js/data.js`

應完成：

- 五種 Stephenson 型資料
- 四種 Watt 型資料
- 每種包含名稱、家族、特色與辨識方式
- 使用卡片或表格清楚呈現
- 將共用機構資料集中放在 `js/data.js`

驗收：九種類型全部顯示，名稱沒有遺漏或重複。

### 成員 6：理論說明與整合測試

工作分支：`feature/theory`

主要修改：`pages/theory.html`

應完成：

- 白話解釋迴路 Circuit
- 白話解釋分支 Branch
- 白話解釋死點 Dead center
- 整理論文第三章的辨識流程
- 檢查各頁導覽連結
- 檢查頁面標題、表單標籤與基本可讀性

驗收：至少說明「死點如何切割分支」及「耦桿點曲線如何協助判斷迴路」。

注意：使用自己的文字整理，不要整段複製論文。

---

## 四、共用檔案規則

以下檔案容易產生合併衝突：

```text
css/base.css
js/app.js
js/data.js
```

建議管理方式：

- `css/base.css`：成員 1 或組長管理
- `js/data.js`：成員 5 管理
- `js/app.js`：組長或成員 6 管理

需要自己的樣式時，請建立專用檔案：

```text
css/recommender.css
css/identifier.css
css/grashof.css
css/mechanisms.css
css/theory.css
```

若確實需要修改別人管理的共用檔案，應先在群組中告知組長和檔案負責人。

---

## 五、開發與測試方式

1. 使用 Live Server 開啟 `index.html`。
2. 測試自己的功能頁。
3. 開啟瀏覽器開發者工具，確認 Console 沒有錯誤。
4. 測試手機寬度版面。
5. 測試所有輸入欄位的正常值和錯誤值。
6. 確認從首頁可進入功能頁，功能頁可回到首頁。

不要提交：

- `.env`
- 密碼、Token、API Key
- 個人真實資料
- `node_modules`
- 不屬於專題的檔案

---

## 六、提交程式碼

先確認分支與檔案：

```bash
git branch --show-current
git status
```

只加入自己負責的檔案，例如：

```bash
git add pages/grashof.html js/grashof.js css/grashof.css
```

提交：

```bash
git commit -m "完成 Grashof 桿長判斷"
git push
```

盡量不要直接使用 `git add .`，以免把不相關檔案一起提交。

---

## 七、建立 Pull Request

推送完成後，到 GitHub 建立 Pull Request：

```text
base：dev
compare：feature/自己的分支
```

例如：

```text
dev ← feature/grashof
```

PR 標題範例：

```text
完成 Grashof 桿長判斷頁
```

PR 說明至少包含：

```markdown
## 完成內容

- 完成哪些畫面或功能
- 處理哪些錯誤輸入

## 測試方式

1. 開啟哪一個頁面
2. 輸入什麼資料
3. 預期看到什麼結果
```

指定另一位組員審查，確認功能與檔案範圍後，由組長合併到 `dev`。

---

## 八、同步最新的 dev

其他功能合併進 `dev` 後，在自己的分支執行：

```bash
git fetch origin
git switch feature/自己的分支
git merge origin/dev
```

若發生衝突，不要直接刪除別人的內容，請找組長和相關檔案負責人一起處理。

---

## 九、最後整合與展示

1. 六個功能 Pull Request 都先合併到 `dev`。
2. 全組從首頁開始測試所有頁面與連結。
3. 修正整合問題。
4. 組長建立 `main ← dev` 的 Pull Request。
5. 審查通過後合併到 `main`。
6. 最後再由 `main` 設定 GitHub Pages。

最重要的規則：每個人只在自己的 `feature/*` 分支工作，功能 PR 一律先進 `dev`，不要直接修改或推送 `main`。


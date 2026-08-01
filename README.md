# 平面六連桿機構推薦與類型辨識平台

本儲存庫是暑期專題小組的純 HTML、CSS、JavaScript 協作起始專案。起始檔只保留檔案結構與 TODO，不提供完成版程式。

## 開啟方式

直接在瀏覽器開啟 `index.html`，或使用 VS Code Live Server。

## 分支流程

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

組員由 `dev` 取得自己的功能分支，完成後建立目標為 `dev` 的 Pull Request。全組整合測試完成後，再建立 `main ← dev` 的 Pull Request。

## 六人分工

| 成員 | 分支 | 主要檔案 | 任務 |
|---|---|---|---|
| 1 | `feature/home` | `index.html` | 首頁與平台介紹 |
| 2 | `feature/recommender` | `pages/recommender.html`、`js/recommender.js` | 功能推薦 |
| 3 | `feature/identifier` | `pages/identifier.html`、`js/identifier.js` | 拓樸類型辨識 |
| 4 | `feature/grashof` | `pages/grashof.html`、`js/grashof.js` | 桿長與 Grashof 判斷 |
| 5 | `feature/mechanisms` | `pages/mechanisms.html`、`js/data.js` | 九種機構圖鑑與資料 |
| 6 | `feature/theory` | `pages/theory.html` | 迴路、分支、死點說明與全站測試 |

## PR 檢查清單

- [ ] 只修改自己負責的檔案，或已先和組長協調
- [ ] 網頁可正常開啟，導覽連結沒有失效
- [ ] PR 目標是 `dev`，不是 `main`
- [ ] 沒有提交密碼、Token、API Key 或 `.env`


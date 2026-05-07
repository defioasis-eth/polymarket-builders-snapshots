# Polymarket builders snapshots

每天自动抓取 Polymarket Data API 的 **builders volume（`timePeriod=DAY`）**，并以 **格式化 JSON** 保存到：

```text
data/YYYY-MM-DD.json
```

日期使用 **UTC**。

## 数据源

- `GET` [`https://data-api.polymarket.com/v1/builders/volume?timePeriod=DAY`](https://data-api.polymarket.com/v1/builders/volume?timePeriod=DAY)

## 项目结构

```text
.
├── .github/workflows/fetch.yml   # GitHub Actions（cron + 手动触发）
├── scripts/fetch.js              # Node.js ESM 抓取脚本（fetch API）
├── data/                         # 快照目录（含 .gitkeep）
├── package.json
├── .gitignore
└── README.md
```

## 本地运行

要求：**Node.js 18+**（内置 `fetch`）。

```bash
npm install
npm run fetch
# 或
node scripts/fetch.js
```

脚本行为：

1. 确保 `data/` 目录存在  
2. 若 **`data/YYYY-MM-DD.json`（UTC 当天）已存在** → **跳过抓取**（不覆盖）  
3. 否则请求 API → 校验 HTTP → 解析 JSON → **缩进格式化写入**  

日志为带时间戳的 `INFO` / `ERROR` 行；出错时 **非 0 退出码**。

## GitHub Actions

工作流文件：[`.github/workflows/fetch.yml`](.github/workflows/fetch.yml)

- **Cron**：每天 **UTC 00:10**（`10 0 * * *`）  
- **手动运行**：Actions 页面选择 **Run workflow**  
- 步骤：`npm install` → `node scripts/fetch.js` → 若有变更则 **commit & push**  

### 权限与推送

使用默认 `GITHUB_TOKEN`，并已设置：

```yaml
permissions:
  contents: write
```

推送由 `actions/checkout` 与上述权限完成；若仓库对默认 token 有额外策略，请在仓库 **Settings → Actions → General** 中允许 workflows 读写仓库。

### 跳过逻辑与提交

- 若当日文件已存在，脚本不写文件 → **无 staged 变更** → **不会 commit/push**  
- 若有新文件 → 提交信息形如：`chore(data): builders volume snapshot YYYY-MM-DD`  

## 新建仓库后 checklist

1. 将本仓库推送到 GitHub。  
2. 确认 Actions 已启用。  
3. 可选：用 **Run workflow** 做一次试跑。  
4. 次日 UTC 00:10 后检查 `data/` 是否出现新 JSON。  

## License

MIT

# IPO 动态监控

监控 A 股（沪深京）+ H 股拟发行公司最新审核动态的轻量站点。每日抓取一次官方公开数据，静态部署到 Vercel。

## 功能

- 概览首页：A/H 股总数、本周新增受理、本周通过/生效、最近 7 天动态
- A 股列表：板块（沪主板/科创板/深主板/创业板/北交所）、状态、关键字筛选
- H 股列表：主板/GEM、状态、关键字筛选
- 状态徽章 + 移动端卡片视图

## 数据源

| 板块 | 源 | 状态 |
| --- | --- | --- |
| A 股全市场 | 东方财富 `datacenter-web.eastmoney.com` 注册制 IPO 接口 | ✅ |
| H 股 | 港交所 Application Proofs / PHIP | ⏳ v2（Playwright） |

A 股仅保留"拟发行口径"：所有活跃状态（已受理/已问询/上市委/通过/提交注册/中止），近 12 个月注册生效，近 6 个月终止。

## 本地开发

```bash
npm install
npm run crawl    # 拉取最新数据 → data/*.json
npm run dev      # 启动开发服务器（http://localhost:3000）
npm run build    # 生产构建（全部静态预渲染）
```

## 目录结构

```
ipo-monitor/
├── data/
│   ├── a-shares.json
│   ├── h-shares.json
│   └── _meta.json
├── scripts/crawler/
│   ├── index.ts        # 入口：编排 + 写文件
│   ├── eastmoney.ts    # A 股主源
│   ├── hkex.ts         # H 股占位（v2）
│   └── http.ts         # 通用 fetch 封装
├── src/
│   ├── app/            # Next.js App Router 页面
│   ├── components/     # Header / StatsCards / RecentUpdates / CompanyExplorer / StatusBadge
│   └── lib/            # types / data / utils
└── .github/workflows/crawl.yml
```

## 自动化

`.github/workflows/crawl.yml` 每日 UTC 18:00（北京时间次日 02:00）触发：
- 运行 `npm run crawl`
- 若 `data/` 有变化则提交并 push
- 推送后 Vercel 自动重建并发布

也支持在 GitHub Actions 页面手动触发（`workflow_dispatch`）。

## 降级策略

任一数据源失败时：
- 保留前一次成功的数据，避免 UI 抖动
- 失败信息写入 `data/_meta.json` 的 `sourceErrors`
- 首页顶部显示「部分数据源不可用」提示

## v2 路线

- HKEx 自动抓取（Playwright 解析 Application Proofs / PHIP）
- 公司详情页：状态变更时间轴 + 公告 PDF 列表
- 拟募资金额（解析招股书 PDF）
- 邮件 / Telegram 变动提醒
- 历史快照对比（git diff data 自动生成"今日变动摘要"）

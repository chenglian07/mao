# CatTrace 使用指南

本文档面向使用者和评审教师，提供 CatTrace MVP 的快速使用引导。

各功能的详细说明已拆分至模块文档，本文档仅做索引和概要说明。

---

## 功能等级说明

| 等级 | 含义 |
|------|------|
| P0 | MVP 必须实现，缺少则平台无法运行 |
| P1 | 增强体验，有了更完整但非 MVP 必须 |
| P2 | 技术亮点，可在 MVP 之后迭代 |
| P3 | 远期规划，当前阶段不做实现 |

## 三大核心功能概览

| 功能 | 等级 | 状态 | 详细文档 |
|------|------|------|---------|
| 实时直播与在线巡检 | P0 | 待硬件接入 | [modules/monitoring.md](./modules/monitoring.md) |
| 远程投喂与投喂追溯 | P0 | 软件已实现，待验证 | [modules/feeding.md](./modules/feeding.md) |
| 猫咪档案与个体化救助 | P0 | 软件已实现，待验证 | [modules/cat-profile.md](./modules/cat-profile.md) |

## 快速体验路径

### 1. 首页直播（`/`）

打开平台首页，查看猫屋直播区域（模拟画面）、环境数据和投喂入口。

### 2. 投喂操作

- 在首页或猫咪档案页点击"投喂"按钮
- 游客模式限 1 次，登录用户无限投喂
- 投喂后系统自动更新统计和分析

### 3. 猫咪档案（`/cats`）

- 浏览 4 只示例猫咪的档案卡片
- 使用筛选（全部/可领养/已绝育/需关注）和搜索功能
- 点击卡片查看详情和投喂趋势图表

### 4. 猫咪日记（`/diary`）

- 查看预置的猫咪日记条目
- 给日记点赞和评论

### 5. 领养中心（`/adopt`）

- 浏览可领养的猫咪
- 提交领养申请（系统自动审核资格）

## 辅助功能

| 功能 | 说明 | 详细文档 |
|------|------|---------|
| 用户认证 | 手机号 + 验证码（MVP 验证码：8888） | [modules/community.md](./modules/community.md) |
| 举报与求助 | 提交举报，紧急事件自动通知志愿者 | [modules/community.md](./modules/community.md) |
| 志愿者申请 | 填写申请表，认证后可查看精确位置 | [modules/community.md](./modules/community.md) |
| 预警中心 | 异常投喂/行为检测自动预警 | [modules/community.md](./modules/community.md) |
| 通知系统 | 投喂记录和紧急求助通知 | [modules/community.md](./modules/community.md) |

## 其他文档

| 文档 | 内容 |
|------|------|
| [API 接口文档](./api.md) | 完整 REST API 参考 |
| [自学习模块](./self-learning.md) | 规则引擎与数据分析能力说明 |
| [架构说明](./architecture.md) | 系统架构和数据流 |
| [演示页说明](./demo-guide.md) | demo.html 静态演示页使用 |
| [路线图](./roadmap.md) | 开发计划与远期规划 |


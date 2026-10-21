# CatTrace 系统架构

本文档说明 CatTrace MVP 阶段的系统架构、模块关系和数据流。

---

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│                   用户浏览器                         │
│  index.html  cats.html  diary.html  adopt.html      │
│  + style.css + main.js/diary.js + PWA (sw.js)      │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / REST API
┌───────────────────────▼─────────────────────────────┐
│                  Flask 后端 (app.py)                 │
│  页面路由 │ REST API │ 认证鉴权 │ 摄像头代理        │
│                       │                              │
│         ┌─────────────┼─────────────┐               │
│         ▼             ▼             ▼               │
│   self_learning.py   data.json   raspberry_pi/      │
│   (分析引擎)        (数据持久化)  (边缘节点代码)     │
└─────────────────────────────────────────────────────┘
```

## 模块说明

### 后端核心（app.py）

`app.py` 是 Flask 应用的主入口，承担以下职责：

| 职责 | 说明 |
|------|------|
| 页面路由 | 渲染 HTML 模板（index、cats、diary、adopt） |
| REST API | 提供猫咪、投喂、日记、领养、举报、认证等接口 |
| 认证鉴权 | 手机号 + 验证码登录，Bearer Token 鉴权 |
| 数据读写 | 加载/保存 `data.json`，线程安全（RLock），原子写入 |
| 自学习触发 | 投喂操作后自动调用自学习引擎更新分析 |
| 摄像头代理 | 转发请求至 Raspberry Pi 4 Model B 边缘节点（已配置时） |

### 自学习引擎（self_learning.py）

`SelfLearningEngine` 类提供基于统计和规则的数据分析能力，不使用机器学习模型。

| 能力 | 实现方式 | 数据来源 |
|------|---------|---------|
| 猫咪行为画像 | 统计投喂时段、频率、情绪分布 | 投喂日志 + 日记数据 |
| 用户偏好画像 | 统计用户投喂习惯、活跃时段 | 投喂日志 + 用户行为 |
| 异常检测 | 规则引擎（如单日投喂超均值 2 倍） | 猫咪画像数据 |
| 健康评分 | 加权公式（进食规律 + 情绪 + 活跃度） | 猫咪画像 + 日记数据 |
| 个性化推荐 | 基于用户画像生成建议 | 用户偏好数据 |

详见 [self-learning.md](./self-learning.md)。

### 前端

| 文件 | 说明 |
|------|------|
| `templates/index.html` | 首页 — 实时直播与在线巡检 |
| `templates/cats.html` | 猫咪档案页 — 浏览、筛选、搜索猫咪 |
| `templates/diary.html` | 日记页 — 查看猫咪日记 |
| `templates/adopt.html` | 领养中心页 — 领养申请 |
| `static/css/style.css` | 全局样式 |
| `static/js/main.js` | 主交互逻辑 |
| `static/js/diary.js` | 日记页交互逻辑 |
| `static/manifest.json` | PWA 配置 |
| `static/sw.js` | Service Worker（离线支持） |
| `demo.html` | 独立静态演示页（零依赖） |

### 数据存储（data.json）

MVP 阶段使用 JSON 文件存储，通过原子写入（先写临时文件再 `os.replace`）保证数据安全。

| 字段 | 说明 |
|------|------|
| `cats` | 猫咪档案列表（4 只示例猫咪） |
| `feed_logs` | 投喂记录（上限 500 条） |
| `diaries` | 猫咪日记（预置示例数据） |
| `adoption_applications` | 领养申请记录 |
| `reports` | 举报记录 |
| `volunteers` | 志愿者申请记录 |
| `emergency_alerts` | 紧急求助记录 |
| `users` | 用户账户（含 token、积分） |
| `guest_feeds` | 游客投喂限制记录 |
| `finance` | 财务数据（预置模拟数据） |
| `learning` | 自学习引擎数据（画像、反馈、异常记录） |
| `stats` | 统计摘要（自动计算） |

### 边缘节点（raspberry_pi/）

Raspberry Pi 4 Model B 端代码，负责摄像头推流和传感器采集。**Raspberry Pi 4 Model B 正在烧录操作系统，尚未完成实际部署和硬件验证；摄像头型号、传感器型号、GPIO 接线及通信方案尚待确定。**

| 文件 | 说明 |
|------|------|
| `camera_stream.py` | MJPEG 视频推流服务（支持 picamera2 / OpenCV / 模拟模式，具体使用哪种取决于实际硬件选型） |
| `sensor_reader.py` | 温湿度传感器采集与上报（当前代码引用 DHT22，实际传感器型号待硬件选型后确定） |
| `config.json` | 节点配置 |
| `run.sh` | 启动脚本 |

边缘节点通过 HTTP 接口向 Flask 后端上报数据：
- `POST /api/camera/sensors` — 上报传感器数据
- `GET /api/camera/status` — 查询摄像头状态
- `GET /api/camera/stream-url` — 获取视频流地址

详见 [raspberry_pi/README.md](../raspberry_pi/README.md)。

## 数据流示例：投喂操作

```
用户点击"投喂"
    │
    ▼
POST /api/feed (或 /api/feed-as-guest)
    │
    ▼
app.py: 验证参数 → 检查权限
    │
    ├─ 更新 cats[].feed_count
    ├─ 追加 feed_logs[]
    ├─ 更新 users[].points（登录用户）
    │
    ▼
self_learning.py: on_feed()
    ├─ 更新猫咪画像（投喂时段、日统计）
    ├─ 更新用户偏好（连续天数、偏好猫咪）
    │
    ▼
save_data(): 原子写入 data.json
    │
    ▼
返回 JSON 响应给前端
```

## 当前限制

| 限制 | 说明 |
|------|------|
| 无真实摄像头 | 首页直播为模拟画面，摄像头 API 已就绪但未接入设备；Raspberry Pi 4 Model B 正在烧录系统，尚未部署 |
| 无真实投喂设备 | 投喂操作仅记录软件日志，不控制机械装置 |
| 无 AI 识别模型 | 猫咪身份识别为规划中功能，当前使用人工建档 |
| 规则引擎非 ML | 自学习模块基于统计规则，非机器学习模型 |
| 单文件存储 | JSON 文件不适合高并发场景，需后续迁移至数据库 |
| 财务数据为模拟 | 财务看板数据为预置模拟值，非真实运营数据 |
| 日记为人工撰写 | 猫咪日记内容由人工编写，非 AI 自动生成 |
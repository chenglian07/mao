# CatTrace REST API 接口文档

> 所有接口基于 Flask，返回 JSON 格式。基础地址：`http://localhost:5000`

---

## 页面路由

| 路径 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 首页（实时直播与在线巡检） |
| `/cats` | GET | 猫咪档案页 |
| `/diary` | GET | 猫咪日记页 |
| `/adopt` | GET | 领养中心页 |
| `/dashboard` | GET | 财务看板页（⚠️ 模板缺失，暂不可用） |

## 核心数据接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/cats` | GET | 获取所有猫咪 |
| `/api/cat/<id>` | GET | 单只猫咪详情（默认浏览次数 +1，`?count=0` 不计数） |
| `/api/stats` | GET | 统计数据 |
| `/api/feed` | POST | 投喂猫咪（需登录） |
| `/api/feed-as-guest` | POST | 游客投喂（每人限 1 次） |
| `/api/feed-logs` | GET | 投喂记录（支持 `?cat_id=` 筛选） |
| `/api/stats/feed-history` | GET | 投喂历史（最近 30 条） |
| `/api/export` | GET | 导出全量数据 |

## 猫咪日记接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/diaries` | GET | 日记列表（支持 `?cat_id=` 筛选和分页） |
| `/api/diaries/<cat_id>` | GET | 某只猫的全部日记 |
| `/api/diaries/<id>/like` | POST | 给日记点赞 |
| `/api/diaries/<id>/comment` | POST | 给日记评论 |

## 领养与举报接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/adopt/apply` | POST | 提交领养申请 |
| `/api/report` | POST | 提交举报（含紧急求助） |
| `/api/reports` | GET | 举报列表（支持 `?status=` 和 `?cat_id=` 筛选） |

## 志愿者接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/volunteer/apply` | POST | 申请志愿者 |
| `/api/volunteers` | GET | 志愿者列表（脱敏） |

## 紧急求助接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/emergency/alerts` | GET | 紧急求助列表 |
| `/api/emergency/alert/<id>/resolve` | POST | 解决紧急求助（需管理员 Token） |

## 位置与通知接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/location/<cat_id>` | GET | 猫咪位置（按权限脱敏） |
| `/api/notifications` | GET | 通知列表 |
| `/api/notifications/unread-count` | GET | 未读通知数量 |

## 认证接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录（MVP 验证码：8888） |
| `/api/auth/me` | GET | 当前用户信息 |
| `/api/auth/logout` | POST | 退出登录 |

**注意**：当前无独立注册接口，用户通过登录流程自动创建。

## 财务接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/finance/summary` | GET | 财务概览 |
| `/api/finance/transactions` | GET | 交易记录（支持 `?type=` 和 `?category=` 筛选） |
| `/api/finance/monthly` | GET | 月度趋势 |

**注意**：财务数据为预置模拟数据，非真实运营数据。

## 自学习接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/learning/cat-profile/<id>` | GET | 猫咪学习画像 |
| `/api/learning/user-profile/<user_id>` | GET | 用户偏好画像 |
| `/api/learning/recommendations/<user_id>` | GET | 个性化推荐 |
| `/api/learning/anomalies` | GET | 异常预警列表 |
| `/api/learning/insights` | GET | 全局模式洞察 |
| `/api/learning/health-report/<id>` | GET | 猫咪健康报告 |
| `/api/learning/feedback` | POST | 提交识别纠错反馈 |
| `/api/learning/train` | POST | 触发模型重训练（重新扫描全量数据） |

## 摄像头与传感器接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/camera/status` | GET | 摄像头连接状态 + 传感器数据 |
| `/api/camera/stream-url` | GET | 获取 MJPEG 视频流 URL |
| `/api/camera/sensors` | POST | 边缘节点主动上报传感器数据 |
| `/api/camera/snapshot` | GET | 获取当前快照（代理转发） |

### 摄像头配置

通过环境变量 `CATTRACE_CAMERA_URL` 设置树莓派摄像头地址：

```bash
# 示例：树莓派 IP 为 192.168.1.100
export CATTRACE_CAMERA_URL=http://192.168.1.100:8080
python app.py
```

未配置时，`camera_online` 返回 `false`，前端展示模拟画面。

### `/api/camera/status` 响应示例

```json
{
  "success": true,
  "camera_online": true,
  "camera_url": "http://192.168.1.100:8080",
  "camera": {
    "frames": 1234,
    "uptime_sec": 3600.5,
    "avg_fps": 14.8,
    "resolution": "640x480"
  },
  "sensors": {
    "temperature": 26.3,
    "humidity": 58.2,
    "timestamp": "2026-10-19T14:32:05"
  }
}
```
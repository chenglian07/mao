from flask import Flask, render_template, jsonify, request
import json
import os
import tempfile
import threading
import time
import uuid
import functools
from datetime import datetime, timedelta

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.environ.get('PROJECTCAT_DATA_FILE', os.path.join(BASE_DIR, 'data.json'))
DATA_LOCK = threading.RLock()
MAX_FEED_LOGS = int(os.environ.get('PROJECTCAT_MAX_FEED_LOGS', '500'))
MAX_ADOPTION_APPS = int(os.environ.get('PROJECTCAT_MAX_ADOPTION_APPS', '500'))
MAX_REPORTS = int(os.environ.get('PROJECTCAT_MAX_REPORTS', '1000'))
MAX_USERS = int(os.environ.get('PROJECTCAT_MAX_USERS', '10000'))
MAX_GUEST_FEEDS = 1  # 游客最多投喂次数
ADMIN_TOKEN = os.environ.get('PROJECTCAT_ADMIN_TOKEN')
APP_CACHE_BUST = os.environ.get('PROJECTCAT_CACHE_BUST') or str(int(time.time()))

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True

# ---------- 登录鉴权装饰器 ----------
def login_required(f):
    """要求请求携带有效的 Bearer Token（正式用户）"""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        token = _extract_bearer_token()
        if not token:
            return jsonify({'success': False, 'message': '请先登录', 'need_login': True}), 401
        user = _get_user_by_token(token)
        if not user:
            return jsonify({'success': False, 'message': '登录已过期，请重新登录', 'need_login': True}), 401
        request._current_user = user
        return f(*args, **kwargs)
    return wrapper

def optional_login(f):
    """可选登录：如果带 token 就注入用户，不带也行"""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        token = _extract_bearer_token()
        request._current_user = _get_user_by_token(token) if token else None
        return f(*args, **kwargs)
    return wrapper

def _extract_bearer_token():
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return auth[7:].strip()
    return None

def _get_user_by_token(token):
    if not token:
        return None
    data = load_data()
    for u in data.get('users', []):
        if u.get('token') == token:
            return u
    return None

@app.context_processor
def inject_cache_bust():
    return {'cache_bust': APP_CACHE_BUST}

@app.after_request
def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# 初始化数据文件
def init_data():
    if not os.path.exists(DATA_FILE):
        default_data = {
            "cats": [
                {
                    "id": 1,
                    "name": "咪咪",
                    "nickname": "小区一霸",
                    "gender": "female",
                    "age": "2 岁",
                    "color": "橘白相间",
                    "location": "A 区 - 教学楼后",
                    "status": "free",
                    "description": "性格活泼，喜欢晒太阳，经常在教学楼后的小花园出现。",
                    "image": "cat1.jpg",
                    "feed_count": 156,
                    "views": 1234,
                    "health": "健康",
                    "neutered": True,
                    "adoption_ready": False
                },
                {
                    "id": 2,
                    "name": "小黑",
                    "nickname": "夜行侠",
                    "gender": "male",
                    "age": "1 岁半",
                    "color": "纯黑",
                    "location": "B 区 - 食堂门口",
                    "status": "free",
                    "description": "夜间活跃，白天喜欢躲在车底下，对人比较警惕。",
                    "image": "cat2.jpg",
                    "feed_count": 89,
                    "views": 876,
                    "health": "健康",
                    "neutered": False,
                    "adoption_ready": True
                },
                {
                    "id": 3,
                    "name": "雪球",
                    "nickname": "棉花糖",
                    "gender": "female",
                    "age": "3 岁",
                    "color": "纯白",
                    "location": "C 区 - 图书馆前",
                    "status": "free",
                    "description": "非常亲人，会主动蹭人，是图书馆的常驻猫咪。",
                    "image": "cat3.jpg",
                    "feed_count": 234,
                    "views": 2156,
                    "health": "健康",
                    "neutered": True,
                    "adoption_ready": True
                },
                {
                    "id": 4,
                    "name": "大橘",
                    "nickname": "十斤橘",
                    "gender": "male",
                    "age": "4 岁",
                    "color": "橘色",
                    "location": "D 区 - 操场角落",
                    "status": "free",
                    "description": "体重超标，需要控制饮食，但依然很贪吃。",
                    "image": "cat4.jpg",
                    "feed_count": 312,
                    "views": 1890,
                    "health": "需关注",
                    "neutered": True,
                    "adoption_ready": False
                }
            ],
            "feed_logs": [],
    "adoption_applications": [],
    "reports": [],
    "volunteers": [],
    "emergency_alerts": [],
    "users": [],
    "guest_feeds": {},
    "stats": {
                "total_cats": 4,
                "total_feeds": 791,
                "total_views": 6156,
                "active_users": 42
            }
        }
        os.makedirs(os.path.dirname(DATA_FILE) or '.', exist_ok=True)
        save_data(default_data)

def _next_id(items):
    max_id = 0
    for item in items:
        try:
            max_id = max(max_id, int(item.get('id', 0)))
        except Exception:
            continue
    return max_id + 1

def _to_int(value):
    try:
        return int(value)
    except Exception:
        return None

def _clean_str(value, max_len=64):
    if value is None:
        return ''
    s = str(value).strip()
    if len(s) > max_len:
        s = s[:max_len]
    return s

def _ensure_data_shape(data):
    changed = False
    if not isinstance(data, dict):
        data = {}
        changed = True

    cats = data.get('cats')
    if not isinstance(cats, list):
        cats = []
        changed = True

    feed_logs = data.get('feed_logs')
    if not isinstance(feed_logs, list):
        feed_logs = []
        changed = True

    adoption_applications = data.get('adoption_applications')
    if not isinstance(adoption_applications, list):
        adoption_applications = []
        changed = True

    reports = data.get('reports')
    if not isinstance(reports, list):
        reports = []
        changed = True

    volunteers = data.get('volunteers')
    if not isinstance(volunteers, list):
        volunteers = []
        changed = True

    emergency_alerts = data.get('emergency_alerts')
    if not isinstance(emergency_alerts, list):
        emergency_alerts = []
        changed = True

    stats = data.get('stats')
    if not isinstance(stats, dict):
        stats = {}
        changed = True

    for cat in cats:
        if not isinstance(cat, dict):
            continue
        if 'feed_count' not in cat or _to_int(cat.get('feed_count')) is None:
            cat['feed_count'] = 0
            changed = True
        else:
            v = int(cat['feed_count'])
            if cat['feed_count'] != v:
                cat['feed_count'] = v
                changed = True
        if 'views' not in cat or _to_int(cat.get('views')) is None:
            cat['views'] = 0
            changed = True
        else:
            v = int(cat['views'])
            if cat['views'] != v:
                cat['views'] = v
                changed = True
        if 'neutered' not in cat:
            cat['neutered'] = False
            changed = True
        if 'adoption_ready' not in cat:
            cat['adoption_ready'] = False
            changed = True
        if 'adoption_note' not in cat:
            cat['adoption_note'] = ''
            changed = True

    total_cats = len(cats)
    total_feeds = sum(int(c.get('feed_count', 0) or 0) for c in cats if isinstance(c, dict))
    total_views = sum(int(c.get('views', 0) or 0) for c in cats if isinstance(c, dict))
    if stats.get('total_cats') != total_cats:
        stats['total_cats'] = total_cats
        changed = True
    if stats.get('total_feeds') != total_feeds:
        stats['total_feeds'] = total_feeds
        changed = True
    if stats.get('total_views') != total_views:
        stats['total_views'] = total_views
        changed = True

    active_users = _to_int(stats.get('active_users'))
    if active_users is None:
        stats['active_users'] = 42
        changed = True
    elif stats.get('active_users') != active_users:
        stats['active_users'] = active_users
        changed = True

    data['cats'] = cats
    data['feed_logs'] = feed_logs
    data['adoption_applications'] = adoption_applications
    data['reports'] = reports
    data['volunteers'] = volunteers
    data['emergency_alerts'] = emergency_alerts
    data['stats'] = stats
    return data, changed

def load_data():
    init_data()
    with DATA_LOCK:
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            broken_name = DATA_FILE + '.broken.' + datetime.now().strftime('%Y%m%d%H%M%S')
            try:
                os.replace(DATA_FILE, broken_name)
            except Exception:
                pass
            data = load_default_data()
            save_data(data)
            return data

    data, changed = _ensure_data_shape(data)
    if changed:
        save_data(data)
    return data

def load_default_data():
    return {
        "cats": [
            {
                "id": 1,
                "name": "咪咪",
                "nickname": "小区一霸",
                "gender": "female",
                "age": "2 岁",
                "color": "橘白相间",
                "location": "A 区 - 教学楼后",
                "status": "free",
                "description": "性格活泼，喜欢晒太阳，经常在教学楼后的小花园出现。",
                "image": "cat1.jpg",
                "feed_count": 156,
                "views": 1234,
                "health": "健康",
                "neutered": True,
                "adoption_ready": False
            },
            {
                "id": 2,
                "name": "小黑",
                "nickname": "夜行侠",
                "gender": "male",
                "age": "1 岁半",
                "color": "纯黑",
                "location": "B 区 - 食堂门口",
                "status": "free",
                "description": "夜间活跃，白天喜欢躲在车底下，对人比较警惕。",
                "image": "cat2.jpg",
                "feed_count": 89,
                "views": 876,
                "health": "健康",
                "neutered": False,
                "adoption_ready": True
            },
            {
                "id": 3,
                "name": "雪球",
                "nickname": "棉花糖",
                "gender": "female",
                "age": "3 岁",
                "color": "纯白",
                "location": "C 区 - 图书馆前",
                "status": "free",
                "description": "非常亲人，会主动蹭人，是图书馆的常驻猫咪。",
                "image": "cat3.jpg",
                "feed_count": 234,
                "views": 2156,
                "health": "健康",
                "neutered": True,
                "adoption_ready": True
            },
            {
                "id": 4,
                "name": "大橘",
                "nickname": "十斤橘",
                "gender": "male",
                "age": "4 岁",
                "color": "橘色",
                "location": "D 区 - 操场角落",
                "status": "free",
                "description": "体重超标，需要控制饮食，但依然很贪吃。",
                "image": "cat4.jpg",
                "feed_count": 312,
                "views": 1890,
                "health": "需关注",
                "neutered": True,
                "adoption_ready": False
            }
        ],
        "feed_logs": [],
        "adoption_applications": [],
        "stats": {
            "total_cats": 4,
            "total_feeds": 791,
            "total_views": 6156,
            "active_users": 42
        }
    }

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE) or '.', exist_ok=True)
    with DATA_LOCK:
        fd, tmp_path = tempfile.mkstemp(prefix='data.', suffix='.json', dir=os.path.dirname(DATA_FILE) or None)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, DATA_FILE)
        finally:
            try:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except Exception:
                pass

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cats')
def cats():
    return render_template('cats.html')

@app.route('/adopt')
def adopt():
    return render_template('adopt.html')

@app.route('/api/cats')
def get_cats():
    data = load_data()
    return jsonify(data['cats'])

@app.route('/api/cat/<int:cat_id>')
def get_cat(cat_id):
    data = load_data()
    for cat in data['cats']:
        if cat['id'] == cat_id:
            if request.args.get('count', '1') != '0':
                cat['views'] = int(cat.get('views', 0) or 0) + 1
                save_data(data)
            return jsonify(cat)
    return jsonify({'error': 'Cat not found'}), 404

@app.route('/api/stats')
def get_stats():
    data = load_data()
    return jsonify(data['stats'])

@app.route('/api/stats/feed-history')
def get_feed_history():
    """获取投喂历史记录"""
    data = load_data()
    logs = data.get('feed_logs', [])
    # 返回最近 30 条记录
    return jsonify(logs[-30:][::-1])

@app.route('/api/notifications')
def get_notifications():
    """获取通知列表"""
    data = load_data()
    # 从投喂日志和举报状态生成通知
    notifications = []
    
    # 最近的投喂记录作为通知
    feed_logs = data.get('feed_logs', [])[-10:]
    for log in feed_logs:
        cat_id = log.get('cat_id')
        cat_name = None
        for cat in data.get('cats', []):
            if cat.get('id') == cat_id:
                cat_name = cat.get('name')
                break
        notifications.append({
            'id': f"feed_{log.get('id')}",
            'type': 'feed',
            'title': f'投喂记录',
            'message': f'{log.get("user_name", "用户")} 投喂了 {cat_name or "猫咪"}',
            'time': log.get('time'),
            'read': False
        })
    
    # 紧急求助通知
    alerts = data.get('emergency_alerts', [])[-5:]
    for alert in alerts:
        if alert.get('status') == 'active':
            notifications.append({
                'id': f"alert_{alert.get('id')}",
                'type': 'emergency',
                'title': f'紧急求助',
                'message': f'{alert.get("cat_name")} 需要帮助！位置：{alert.get("location")}',
                'time': alert.get('time'),
                'read': False
            })
    
    return jsonify(notifications[::-1][:20])

@app.route('/api/notifications/unread-count')
def get_unread_notification_count():
    """获取未读通知数量"""
    # 目前返回 0，因为所有通知都是模拟的
    return jsonify({'count': 0})

@app.route('/api/feed', methods=['POST'])
def feed_cat():
    if not request.is_json:
        return jsonify({'success': False, 'message': '请求格式错误'}), 400

    req_data = request.get_json(silent=True) or {}
    cat_id = _to_int(req_data.get('cat_id'))
    if not cat_id:
        return jsonify({'success': False, 'message': 'cat_id 不合法'}), 400

    user_name = _clean_str(req_data.get('user_name'), 32) or '匿名用户'
    
    data = load_data()
    
    target_cat = None
    for cat in data['cats']:
        if cat.get('id') == cat_id:
            target_cat = cat
            break
    if not target_cat:
        return jsonify({'success': False, 'message': '猫咪不存在'}), 404

    target_cat['feed_count'] = int(target_cat.get('feed_count', 0) or 0) + 1
    
    # 记录投喂日志
    log = {
        'id': _next_id(data['feed_logs']),
        'cat_id': cat_id,
        'user_name': user_name,
        'time': datetime.now().isoformat(timespec='seconds')
    }
    data['feed_logs'].append(log)
    if len(data['feed_logs']) > MAX_FEED_LOGS:
        data['feed_logs'] = data['feed_logs'][-MAX_FEED_LOGS:]
    
    save_data(data)
    
    return jsonify({
        'success': True,
        'message': f'投喂成功！{user_name} 投喂了 {target_cat.get("name", "猫咪")}',
        'cat_id': cat_id,
        'feed_count': target_cat['feed_count']
    })

@app.route('/api/feed-logs')
def get_feed_logs():
    data = load_data()
    cat_id = _to_int(request.args.get('cat_id'))
    limit = _to_int(request.args.get('limit')) or 10
    limit = max(1, min(limit, 50))
    logs = data['feed_logs']
    if cat_id:
        logs = [log for log in logs if isinstance(log, dict) and log.get('cat_id') == cat_id]
    logs = logs[-limit:]
    return jsonify(logs[::-1])  # 倒序排列

@app.route('/api/adopt/apply', methods=['POST'])
def apply_adoption():
    if not request.is_json:
        return jsonify({'success': False, 'message': '请求格式错误'}), 400

    req_data = request.get_json(silent=True) or {}
    cat_id = _to_int(req_data.get('cat_id'))
    if not cat_id:
        return jsonify({'success': False, 'message': 'cat_id 不合法'}), 400

    applicant = req_data.get('applicant', {})
    if not isinstance(applicant, dict):
        return jsonify({'success': False, 'message': 'applicant 不合法'}), 400
    
    data = load_data()

    target_cat = None
    for cat in data['cats']:
        if cat.get('id') == cat_id:
            target_cat = cat
            break
    if not target_cat:
        return jsonify({'success': False, 'message': '猫咪不存在'}), 404
    if not target_cat.get('adoption_ready'):
        note = (target_cat.get('adoption_note') or '').strip()
        if note:
            return jsonify({'success': False, 'message': f'该猫咪暂不可领养：{note}'}), 400
        if target_cat.get('health') and target_cat.get('health') != '健康':
            return jsonify({'success': False, 'message': f'该猫咪暂不可领养：健康{target_cat.get("health")}' }), 400
        if target_cat.get('neutered') is False:
            return jsonify({'success': False, 'message': '该猫咪暂不可领养：未绝育'}), 400
        return jsonify({'success': False, 'message': '该猫咪暂不可领养：暂未开放领养'}), 400

    name = _clean_str(applicant.get('name'), 32)
    phone = _clean_str(applicant.get('phone'), 32)
    adoption_reason = _clean_str(applicant.get('adoptionReason'), 800)
    age = _to_int(applicant.get('age'))
    housing_type = _clean_str(applicant.get('housingType'), 16)
    housing_size = _clean_str(applicant.get('housingSize'), 16)
    family_agree = _clean_str(applicant.get('familyAgree'), 16)
    pet_experience = _clean_str(applicant.get('petExperience'), 16)

    if not name or not phone or not adoption_reason:
        return jsonify({'success': False, 'message': '请填写姓名、电话与领养动机'}), 400
    if age is None or age < 18 or age > 120:
        return jsonify({'success': False, 'message': '年龄需为 18-120 之间'}), 400
    if not housing_type or not housing_size or not family_agree or not pet_experience:
        return jsonify({'success': False, 'message': '请完整填写居住情况与养宠经验'}), 400
    
    # 创建申请记录
    application = {
        'id': _next_id(data['adoption_applications']),
        'cat_id': cat_id,
        'applicant': {
            'name': name,
            'age': age,
            'phone': phone,
            'email': _clean_str(applicant.get('email'), 128),
            'housingType': housing_type,
            'housingSize': housing_size,
            'familyAgree': family_agree,
            'petExperience': pet_experience,
            'previousPets': _clean_str(applicant.get('previousPets'), 128),
            'adoptionReason': adoption_reason
        },
        'time': datetime.now().isoformat(timespec='seconds'),
        'status': 'pending'
    }
    data['adoption_applications'].append(application)
    if len(data['adoption_applications']) > MAX_ADOPTION_APPS:
        data['adoption_applications'] = data['adoption_applications'][-MAX_ADOPTION_APPS:]
    save_data(data)
    
    return jsonify({'success': True, 'message': '领养申请已提交，我们会尽快审核！'})

@app.route('/api/cleanup-logs', methods=['POST'])
def cleanup_logs():
    """清理过期的投喂记录，保留最近 100 条"""
    data = load_data()
    max_logs = 100
    
    if len(data['feed_logs']) > max_logs:
        removed = len(data['feed_logs']) - max_logs
        data['feed_logs'] = data['feed_logs'][-max_logs:]
        save_data(data)
        return jsonify({'success': True, 'message': f'已清理 {removed} 条旧记录'})
    
    return jsonify({'success': True, 'message': '记录数量正常，无需清理'})

@app.route('/api/export')
def export_data():
    data = load_data()
    return jsonify(data)

@app.route('/api/admin/reset', methods=['POST'])
def admin_reset():
    if not ADMIN_TOKEN:
        return jsonify({'error': 'Not found'}), 404
    token = request.headers.get('X-Admin-Token') or ''
    if token != ADMIN_TOKEN:
        return jsonify({'error': 'Unauthorized'}), 401
    data = load_default_data()
    save_data(data)
    return jsonify({'success': True})

# ========== 网格化安全守护体系 API ==========

@app.route('/api/report', methods=['POST'])
def create_report():
    """创建举报记录"""
    if not request.is_json:
        return jsonify({'success': False, 'message': '请求格式错误'}), 400

    req_data = request.get_json(silent=True) or {}
    cat_id = _to_int(req_data.get('cat_id'))
    report_type = _clean_str(req_data.get('report_type'), 32)  # injury, abuse, neglect, other
    description = _clean_str(req_data.get('description'), 500)
    reporter_name = _clean_str(req_data.get('reporter_name'), 32) or '匿名用户'
    reporter_contact = _clean_str(req_data.get('reporter_contact'), 64)
    is_emergency = req_data.get('is_emergency', False)

    if not cat_id or not report_type or not description:
        return jsonify({'success': False, 'message': '请填写完整举报信息'}), 400

    data = load_data()

    # 验证猫咪存在
    target_cat = None
    for cat in data['cats']:
        if cat.get('id') == cat_id:
            target_cat = cat
            break
    if not target_cat:
        return jsonify({'success': False, 'message': '猫咪不存在'}), 404

    # 创建举报记录
    report = {
        'id': _next_id(data['reports']),
        'cat_id': cat_id,
        'cat_name': target_cat.get('name'),
        'report_type': report_type,
        'description': description,
        'reporter_name': reporter_name,
        'reporter_contact': reporter_contact,
        'is_emergency': bool(is_emergency),
        'status': 'pending',  # pending, reviewing, resolved, dismissed
        'time': datetime.now().isoformat(timespec='seconds'),
        'evidence': []  # 可上传图片/视频证据
    }
    data['reports'].append(report)
    if len(data['reports']) > MAX_REPORTS:
        data['reports'] = data['reports'][-MAX_REPORTS:]
    save_data(data)

    # 如果是紧急事件，自动创建求助警报
    if is_emergency:
        alert = {
            'id': _next_id(data['emergency_alerts']),
            'report_id': report['id'],
            'cat_id': cat_id,
            'cat_name': target_cat.get('name'),
            'location': target_cat.get('location'),
            'type': report_type,
            'description': description,
            'status': 'active',
            'time': datetime.now().isoformat(timespec='seconds')
        }
        data['emergency_alerts'].append(alert)
        save_data(data)

    return jsonify({
        'success': True,
        'message': '举报已提交，我们会尽快处理！' if not is_emergency else '紧急求助已发送，志愿者正在赶来的路上！',
        'report_id': report['id']
    })

@app.route('/api/reports')
def get_reports():
    """获取举报列表"""
    data = load_data()
    status = _clean_str(request.args.get('status'), 16)
    cat_id = _to_int(request.args.get('cat_id'))
    
    reports = data.get('reports', [])
    if status:
        reports = [r for r in reports if r.get('status') == status]
    if cat_id:
        reports = [r for r in reports if r.get('cat_id') == cat_id]
    
    return jsonify(reports[-50:][::-1])

@app.route('/api/volunteer/apply', methods=['POST'])
def apply_volunteer():
    """申请成为志愿者"""
    if not request.is_json:
        return jsonify({'success': False, 'message': '请求格式错误'}), 400

    req_data = request.get_json(silent=True) or {}
    name = _clean_str(req_data.get('name'), 32)
    phone = _clean_str(req_data.get('phone'), 32)
    id_card = _clean_str(req_data.get('id_card'), 32)
    experience = _clean_str(req_data.get('experience'), 500)
    area = _clean_str(req_data.get('area'), 64)
    available_time = _clean_str(req_data.get('available_time'), 100)

    if not name or not phone or not id_card:
        return jsonify({'success': False, 'message': '请填写姓名、电话和身份证号'}), 400

    data = load_data()

    # 检查是否已申请
    for vol in data.get('volunteers', []):
        if vol.get('id_card') == id_card:
            return jsonify({'success': False, 'message': '您已提交过志愿者申请'}), 400

    volunteer = {
        'id': _next_id(data['volunteers']),
        'name': name,
        'phone': phone,
        'id_card': id_card,
        'experience': experience,
        'area': area,
        'available_time': available_time,
        'status': 'pending',  # pending, approved, rejected
        'level': 'volunteer',  # volunteer, senior_volunteer, coordinator
        'verified': False,
        'apply_time': datetime.now().isoformat(timespec='seconds'),
        'feed_count': 0,
        'rescue_count': 0
    }
    data['volunteers'].append(volunteer)
    save_data(data)

    return jsonify({
        'success': True,
        'message': '志愿者申请已提交，审核通过后您将收到通知！'
    })

@app.route('/api/volunteers')
def get_volunteers():
    """获取志愿者列表（脱敏）"""
    data = load_data()
    status = _clean_str(request.args.get('status'), 16)
    
    volunteers = data.get('volunteers', [])
    if status:
        volunteers = [v for v in volunteers if v.get('status') == status]
    
    # 脱敏处理
    result = []
    for v in volunteers:
        result.append({
            'id': v.get('id'),
            'name': v.get('name'),
            'level': v.get('level'),
            'area': v.get('area'),
            'verified': v.get('verified'),
            'feed_count': v.get('feed_count', 0),
            'rescue_count': v.get('rescue_count', 0)
        })
    
    return jsonify(result[-100:][::-1])

@app.route('/api/emergency/alerts')
def get_emergency_alerts():
    """获取紧急求助列表"""
    data = load_data()
    status = _clean_str(request.args.get('status'), 16)
    
    alerts = data.get('emergency_alerts', [])
    if status:
        alerts = [a for a in alerts if a.get('status') == status]
    
    # 只返回脱敏的位置信息（区域级别）
    result = []
    for a in alerts:
        location = a.get('location', '')
        # 脱敏：只显示区域，不显示精确位置
        if ' - ' in location:
            location = location.split(' - ')[0] + '区'
        result.append({
            'id': a.get('id'),
            'report_id': a.get('report_id'),
            'cat_id': a.get('cat_id'),
            'cat_name': a.get('cat_name'),
            'location': location,
            'type': a.get('type'),
            'description': a.get('description'),
            'status': a.get('status'),
            'time': a.get('time')
        })
    
    return jsonify(result[-20:][::-1])

@app.route('/api/emergency/alert/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """解决紧急求助"""
    if not ADMIN_TOKEN:
        return jsonify({'error': 'Not found'}), 404
    token = request.headers.get('X-Admin-Token') or ''
    if token != ADMIN_TOKEN:
        return jsonify({'error': 'Unauthorized'}), 401

    data = load_data()
    for alert in data.get('emergency_alerts', []):
        if alert.get('id') == alert_id:
            alert['status'] = 'resolved'
            alert['resolve_time'] = datetime.now().isoformat(timespec='seconds')
            save_data(data)
            return jsonify({'success': True, 'message': '求助已标记为已解决'})
    
    return jsonify({'success': False, 'message': '求助不存在'}), 404

@app.route('/api/location/<int:cat_id>')
def get_cat_location(cat_id):
    """获取猫咪位置（根据权限返回不同精度）"""
    data = load_data()
    
    # 检查是否为认证志愿者
    is_volunteer = False
    volunteer_id = request.args.get('volunteer_id')
    if volunteer_id:
        for vol in data.get('volunteers', []):
            if str(vol.get('id')) == str(volunteer_id) and vol.get('verified'):
                is_volunteer = True
                break

    for cat in data['cats']:
        if cat['id'] == cat_id:
            location = cat.get('location', '')
            # 普通用户只显示区域
            if not is_volunteer and ' - ' in location:
                location = location.split(' - ')[0]
            return jsonify({
                'cat_id': cat_id,
                'cat_name': cat.get('name'),
                'location': location,
                'is_precise': is_volunteer
            })
    
    return jsonify({'error': 'Cat not found'}), 404

# ========== 认证系统 API ==========

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """手机号 + 验证码登录/注册"""
    if not request.is_json:
        return jsonify({'success': False, 'message': '请求格式错误'}), 400

    req_data = request.get_json(silent=True) or {}
    phone = _clean_str(req_data.get('phone'), 11)
    code = _clean_str(req_data.get('code'), 6)

    # 简单手机号校验
    if not phone or len(phone) < 11 or not phone.isdigit():
        return jsonify({'success': False, 'message': '请输入正确的手机号'}), 400

    # MVP 阶段：验证码固定为 8888
    if code != '8888':
        return jsonify({'success': False, 'message': '验证码错误，请重试（测试验证码：8888）'}), 400

    data = load_data()

    # 查找或创建用户
    user = None
    for u in data.get('users', []):
        if u.get('phone') == phone:
            user = u
            break

    if user is None:
        # 注册新用户
        if len(data.get('users', [])) >= MAX_USERS:
            return jsonify({'success': False, 'message': '系统用户数已达上限'}), 400
        user = {
            'id': _next_id(data.get('users', [])),
            'phone': phone,
            'nickname': f'爱猫人{phone[-4:]}',
            'avatar': '🐱',
            'role': 'user',
            'points': 5,
            'feed_count': 0,
            'created_at': datetime.now().isoformat(timespec='seconds'),
            'token': str(uuid.uuid4())
        }
        data['users'].append(user)
    else:
        # 刷新 token
        user['token'] = str(uuid.uuid4())

    save_data(data)

    return jsonify({
        'success': True,
        'message': '登录成功',
        'token': user['token'],
        'user': {
            'id': user['id'],
            'phone': user['phone'],
            'nickname': user['nickname'],
            'avatar': user.get('avatar', '🐱'),
            'role': user.get('role', 'user'),
            'points': user.get('points', 0),
            'feed_count': user.get('feed_count', 0)
        }
    })

@app.route('/api/auth/me', methods=['GET'])
@login_required
def auth_me():
    """获取当前登录用户信息"""
    user = request._current_user
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'phone': user['phone'],
            'nickname': user['nickname'],
            'avatar': user.get('avatar', '🐱'),
            'role': user.get('role', 'user'),
            'points': user.get('points', 0),
            'feed_count': user.get('feed_count', 0)
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    """退出登录（清除 token）"""
    token = _extract_bearer_token()
    if token:
        data = load_data()
        for u in data.get('users', []):
            if u.get('token') == token:
                u['token'] = ''
                save_data(data)
                break
    return jsonify({'success': True, 'message': '已退出登录'})

# ========== 投喂 API（改造：区分登录用户与游客） ==========

@app.route('/api/feed', methods=['POST'])
@login_required
def feed_cat_login():
    """登录用户投喂（无限制，消耗积分）"""
    if not request.is_json:
        return jsonify({'success': False, 'message': '请求格式错误'}), 400

    req_data = request.get_json(silent=True) or {}
    cat_id = _to_int(req_data.get('cat_id'))
    if not cat_id:
        return jsonify({'success': False, 'message': 'cat_id 不合法'}), 400

    user = request._current_user
    user_name = user.get('nickname', '用户')

    data = load_data()

    target_cat = None
    for cat in data['cats']:
        if cat.get('id') == cat_id:
            target_cat = cat
            break
    if not target_cat:
        return jsonify({'success': False, 'message': '猫咪不存在'}), 404

    # 更新猫咪投喂数
    target_cat['feed_count'] = int(target_cat.get('feed_count', 0) or 0) + 1

    # 更新用户投喂数
    for u in data.get('users', []):
        if u.get('id') == user.get('id'):
            u['feed_count'] = u.get('feed_count', 0) + 1
            u['points'] = u.get('points', 0) + 1
            break

    # 记录投喂日志
    log = {
        'id': _next_id(data['feed_logs']),
        'cat_id': cat_id,
        'user_name': user_name,
        'user_id': user.get('id'),
        'time': datetime.now().isoformat(timespec='seconds'),
        'type': 'user'
    }
    data['feed_logs'].append(log)
    if len(data['feed_logs']) > MAX_FEED_LOGS:
        data['feed_logs'] = data['feed_logs'][-MAX_FEED_LOGS:]

    save_data(data)

    return jsonify({
        'success': True,
        'message': f'投喂成功！{user_name} 投喂了 {target_cat.get("name", "猫咪")}',
        'cat_id': cat_id,
        'feed_count': target_cat['feed_count'],
        'is_guest': False
    })

@app.route('/api/feed-as-guest', methods=['POST'])
def feed_as_guest():
    """游客投喂（每人仅限 1 次）"""
    if not request.is_json:
        return jsonify({'success': False, 'message': '请求格式错误'}), 400

    req_data = request.get_json(silent=True) or {}
    cat_id = _to_int(req_data.get('cat_id'))
    guest_id = _clean_str(req_data.get('guest_id'), 64)

    if not cat_id:
        return jsonify({'success': False, 'message': 'cat_id 不合法'}), 400
    if not guest_id:
        return jsonify({'success': False, 'message': 'missing guest_id'}), 400

    data = load_data()

    # 检查该游客是否已经投喂过
    guest_feeds = data.get('guest_feeds', {})
    guest_feed_count = guest_feeds.get(guest_id, {}).get('count', 0)

    if guest_feed_count >= MAX_GUEST_FEEDS:
        return jsonify({
            'success': False,
            'message': '游客投喂次数已用完，登录后无限畅喂！',
            'need_login': True
        }), 403

    target_cat = None
    for cat in data['cats']:
        if cat.get('id') == cat_id:
            target_cat = cat
            break
    if not target_cat:
        return jsonify({'success': False, 'message': '猫咪不存在'}), 404

    # 更新猫咪投喂数
    target_cat['feed_count'] = int(target_cat.get('feed_count', 0) or 0) + 1

    # 记录游客投喂
    guest_feeds[guest_id] = {
        'count': guest_feed_count + 1,
        'last_feed': datetime.now().isoformat(timespec='seconds')
    }
    data['guest_feeds'] = guest_feeds

    # 记录投喂日志
    log = {
        'id': _next_id(data['feed_logs']),
        'cat_id': cat_id,
        'user_name': '游客',
        'guest_id': guest_id,
        'time': datetime.now().isoformat(timespec='seconds'),
        'type': 'guest'
    }
    data['feed_logs'].append(log)
    if len(data['feed_logs']) > MAX_FEED_LOGS:
        data['feed_logs'] = data['feed_logs'][-MAX_FEED_LOGS:]

    save_data(data)

    remaining = MAX_GUEST_FEEDS - guest_feed_count - 1
    return jsonify({
        'success': True,
        'message': f'投喂成功！您还剩 {remaining} 次游客投喂机会，登录后无限畅喂！',
        'cat_id': cat_id,
        'feed_count': target_cat['feed_count'],
        'is_guest': True,
        'remaining': remaining
    })

if __name__ == '__main__':
    init_data()
    debug = os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes', 'on')
    host = os.environ.get('PROJECTCAT_HOST', '127.0.0.1')
    port = int(os.environ.get('PROJECTCAT_PORT', '5000'))
    app.run(debug=debug, host=host, port=port)

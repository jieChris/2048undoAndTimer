# 前端部署说明（无后端版）

当前站点按“纯前端练习工具”部署：
- 不需要 Node.js
- 不需要 MySQL
- 不需要 `backend/`

## 1. 服务器目录
- 网站根目录：`/www/wwwroot/www.taihe.fun`

## 2. 首次部署
在服务器执行：

```bash
cd /www/wwwroot
# 目录不存在时
# git clone https://github.com/jieChris/2048undoAndTimer www.taihe.fun

cd /www/wwwroot/www.taihe.fun
chmod +x deploy_frontend.sh
./deploy_frontend.sh
```

说明：
- `deploy_frontend.sh` 会自动：
1. 拉取最新代码
2. 删除网站目录中的 `backend/`（前端部署不需要）
3. 重载 Nginx

## 3. 日常更新流程
你本地在 VSCode 提交并 Push 到 `main` 后，服务器只要执行：

```bash
cd /www/wwwroot/www.taihe.fun
./deploy_frontend.sh
```

## 4. 可选：保留 backend 代码（仅归档）
如果你想留存后端代码但不放在网站目录，可放到：
- `/www/backup/2048-backend/`

不要放在网站根目录下。

## 5. 最小检查清单
1. 打开 `https://你的域名/` 正常进入首页
2. 模式页、历史页、回放页可打开
3. 完成一局后可在本地历史看到记录
4. 历史可导出/导入/删除

# 2048 项目上传分类说明（前后端分离）

本文用于回答三个问题：
1. 前端哪些要上传
2. 后端哪些要上传
3. 哪些不需要上传（或不建议上传）

## 1. 建议的服务器目录

- 前端站点目录（Nginx 站点根目录）  
  例如：`/www/wwwroot/www.taihe.fun`
- 后端服务目录（Node 项目目录）  
  例如：`/www/wwwroot/2048-backend`

## 2. 前端：需要上传

把下面内容上传到前端站点目录：

- 页面文件：`index.html`、`play.html`、`modes.html`、`undo_2048.html`、`capped_2048.html`、`Practice_board.html`、`history.html`、`leaderboard.html`、`account.html`、`replay.html`
- 静态目录：`js/`、`style/`、`meta/`、`images/`
- 站点资源：`favicon.ico`

可选上传：
- `README.md`（仅说明文档）
- `v1.71.txt`（版本记录）

## 3. 后端：需要上传

把 `backend` 项目作为独立目录上传到后端目录，保留以下内容：

- `backend/package.json`
- `backend/package-lock.json`
- `backend/src/`
- `backend/migrations/`
- `backend/scripts/`
- `backend/README.md`
- `backend/EXPORT_API.md`
- `backend/.env.example`（模板）

在服务器上手动创建并填写：
- `backend/.env`（生产配置，不建议从本地直接覆盖上传）

## 4. 不需要上传（或建议不要上传）

项目根目录中一般不需要上传：
- `.git/`
- `.gitignore`
- `.jshintrc`
- `CONTRIBUTING.md`
- `PLAN.md`、`PLAN2.md`
- `verification/`（测试页面）

后端目录中不需要上传：
- `backend/node_modules/`（在服务器执行 `npm install` 重新安装）
- `backend/tests/`（生产非必须，可不传）
- 本地开发用 `.env`（避免把本机配置直接带到线上）

## 5. 宝塔上传后的标准操作（后端）

在后端目录执行：

```bash
cd /www/wwwroot/2048-backend
npm install
npm run migrate
```

然后启动两个进程（建议 PM2）：

```bash
pm2 start src/server.js --name game-api
pm2 start src/worker.js --name game-worker
pm2 save
```

## 6. Nginx 反代（核心）

站点配置里保留静态站点 root，并增加 `/api/` 反代到后端：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 7. 前端 API 地址建议

生产环境建议前端调用同域相对路径：
- `"/api/v1"`  

这样可避免跨域和 CSP 问题（不再写死 `127.0.0.1:3001`）。

## 8. 最小上线检查清单

1. 打开 `https://你的域名/`，页面能加载
2. `https://你的域名/api/v1/leaderboards/standard_4x4_pow2_no_undo?limit=1` 有响应
3. 注册/登录成功
4. 完成一局后历史可见
5. Worker 正常消费（日志无持续报错）

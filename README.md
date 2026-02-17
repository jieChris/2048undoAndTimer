# 2048
当前项目.  [点击即玩!](http://taihe.fun/)

# 2048

项目参考[1024](https://play.google.com/store/apps/details?id=com.veewo.a1024),  [Saming's 2048](http://saming.fr/p/2048/) 

玩就完了. [点击即玩!](http://gabrielecirulli.github.io/2048/)


## 许可
2048 采用 [MIT license.](https://github.com/gabrielecirulli/2048/blob/master/LICENSE.txt)许可证授权

## Backend (账号 / 排行榜 / 反作弊)
- 新增后端目录：`backend/`
- 提供：
1. 用户注册登录（用户名+密码）
2. 三模式排行榜（总榜+周榜）
3. 对局历史（公开可查，含终盘 4x4 棋盘）
4. 服务端 replay v3 复算校验（防 Console 改分/改盘面）

### 本地启动
1. `cd backend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run migrate`
5. `npm run dev`（API）
6. 新开终端 `npm run dev:worker`（复算 worker）

### 前端新增页面
- `account.html` 账号中心
- `leaderboard.html` 排行榜
- `history.html` 历史记录

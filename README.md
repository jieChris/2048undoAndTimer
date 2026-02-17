# 2048
This game.  [Play it here!](http://taihe.fun/)

# 2048

A small clone of [1024](https://play.google.com/store/apps/details?id=com.veewo.a1024), based on [Saming's 2048](http://saming.fr/p/2048/) (also a clone).

Made just for fun. [Play it here!](http://gabrielecirulli.github.io/2048/)

### Contributions

 - [TimPetricola](https://github.com/TimPetricola) added best score storage
 - [chrisprice](https://github.com/chrisprice) added custom code for swipe handling on mobile

Many thanks to [rayhaanj](https://github.com/rayhaanj), [Mechazawa](https://github.com/Mechazawa), [grant](https://github.com/grant), [remram44](https://github.com/remram44) and [ghoullier](https://github.com/ghoullier) for the many other good contributions.

## Contributing
Changes and improvements are more than welcome! Feel free to fork and open a pull request. Please make your changes in a specific branch and request to pull into `master`! If you can, please make sure the game fully works before sending the PR, as that will help speed up the process.

You can find the same information in the [contributing guide.](https://github.com/gabrielecirulli/2048/blob/master/CONTRIBUTING.md)

## License
2048 is licensed under the [MIT license.](https://github.com/gabrielecirulli/2048/blob/master/LICENSE.txt)

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

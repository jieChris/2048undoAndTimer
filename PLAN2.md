## 2048 多玩法扩展计划（标准版主页 + 多尺寸 + Fibonacci + 限定排行榜）

### 摘要
本计划分两期实施。  
第一期实现你当前优先项：`标准版无撤回` 作为主页、模式选择重构、`3x3/3x4/2x4`、`4x4 Fibonacci`、并把排行榜严格限定为三类（标准无撤回、经典有撤回、封顶无撤回）。  
第二期实现 `5x5~10x10`（每个尺寸做有撤回/无撤回双版本）。  
关键技术路线是把当前“4x4 + 2幂规则 + 固定模式枚举”改为“可配置变体引擎 + 可配置后端校验”。

### 已锁定决策
1. 新玩法默认策略：除封顶外，按“每个模式都做有撤回+无撤回”。
2. 封顶模式：仅保留无撤回版本。
3. Fibonacci 规则：`1+1=2`，相邻斐波那契数可合并为下一项。
4. Fibonacci 出数概率：`1 占 75%`，`2 占 25%`。
5. 多尺寸交付节奏：先做 `3x3/3x4/2x4`，`5x5~10x10` 第二期。
6. 排行榜只统计 3 桶：`standard`（4x4无撤回）、`classic_undo`（4x4有撤回）、`capped`（4x4封顶无撤回）。

### 一期交付范围（必须完成）
1. 主页切换为标准版无撤回（4x4、2幂规则、可进榜）。
2. 新增模式入口并保持页面风格一致。
3. 新增玩法：
1. `3x3`（有撤回/无撤回）
2. `3x4`（有撤回/无撤回）
3. `2x4`（有撤回/无撤回）
4. `4x4 Fibonacci`（有撤回/无撤回）
4. 排行榜只保留三类统计，不显示其他模式榜单。
5. 历史记录保留所有模式（包括不进榜模式）。

### 二期交付范围（明确排期）
1. 新增 `5x5/6x6/7x7/8x8/9x9/10x10`。
2. 每个尺寸提供有撤回/无撤回版本。
3. 默认不进榜，仅进历史与回放。

## 重要接口与类型变更（决策完成）

### 前端模式配置（新增）
新增 `js/mode_catalog.js`，定义统一 `ModeConfig`：
- `key`：字符串唯一键（如 `standard_4x4_pow2_no_undo`）
- `label`
- `board_width`、`board_height`
- `ruleset`：`pow2 | fibonacci`
- `undo_enabled`：布尔
- `max_tile`：可选（封顶=2048）
- `spawn_table`：如 `[{value:1,weight:75},{value:2,weight:25}]`
- `ranked_bucket`：`standard | classic_undo | capped | none`

### 后端会话接口（修改）
`POST /api/v1/sessions/complete` 请求体新增字段并设为必填：
- `mode_key`
- `board_width`
- `board_height`
- `ruleset`
- `undo_enabled`
- `ranked_bucket`

`mode` 保留一版兼容（读取后映射到 `mode_key`），下一版本移除。

### 排行榜接口（修改）
`GET /api/v1/leaderboards/:bucket`
- `bucket` 仅允许：`standard | classic_undo | capped`
- 其他 bucket 返回 400

### 历史接口（修改）
`GET /api/v1/users/:username/history`
- 返回项增加：`mode_key`、`board_width`、`board_height`、`ruleset`、`undo_enabled`、`ranked_bucket`

## 数据库与迁移计划

### 迁移文件
新增 `backend/migrations/003_mode_refactor.sql`：
1. `game_sessions.mode` 从 `ENUM` 改为 `VARCHAR(64)`。
2. 新增列：
- `mode_key VARCHAR(64) NOT NULL`
- `board_width TINYINT UNSIGNED NOT NULL DEFAULT 4`
- `board_height TINYINT UNSIGNED NOT NULL DEFAULT 4`
- `ruleset ENUM('pow2','fibonacci') NOT NULL DEFAULT 'pow2'`
- `undo_enabled BOOLEAN NOT NULL DEFAULT TRUE`
- `ranked_bucket ENUM('standard','classic_undo','capped','none') NOT NULL DEFAULT 'none'`
3. 历史数据回填：
- 旧 `classic` -> `mode_key='classic_4x4_pow2_undo'`, `ranked_bucket='classic_undo'`
- 旧 `capped` -> `mode_key='capped_4x4_pow2_no_undo'`, `ranked_bucket='capped'`
- 旧 `practice` -> `mode_key='practice_legacy'`, `ranked_bucket='none'`
4. 新索引：
- `(ranked_bucket, status, score, created_at)`
- `(mode_key, created_at)`
- `(user_id, created_at)`

## 前端实现计划

### 1. 模式入口与页面组织
1. `index.html` 固定加载 `standard_4x4_pow2_no_undo`。
2. `modes.html` 改为模式中心，显示所有一期模式入口。
3. 新增 `play.html`（单页动态模式页），通过 `?mode_key=` 加载对应配置。
4. 旧页面兼容：
- `capped_2048.html` 可保留并重定向到 `play.html?mode_key=capped_4x4_pow2_no_undo`
- `Practice_board.html` 标记 legacy 或迁到新体系（不进榜）

### 2. 输入系统
1. 新增 `ConfigurableInputManager`，由 `undo_enabled` 决定是否绑定 `Z`。
2. UI 上按配置显示/隐藏“撤回”文字、按钮、提示。

### 3. 棋盘渲染与尺寸泛化
1. `Grid` 从单 `size` 改为 `width + height`。
2. `GameManager` 所有遍历从 `this.size` 改为 `this.width/this.height`。
3. `HTMLActuator` 改为动态网格渲染，不再依赖写死的 `4x4` DOM 与 `.tile-position-*-*` 固定 CSS。
4. 用计算式定位（按当前模式动态算 `cellSize/gap/padding`），支持到 `10x10`。
5. 当前样式体系保留，新增动态样式变量，保证页面“基本一致”。

### 4. 规则引擎
1. 合并规则抽象：
- `pow2`: 相同值可合并
- `fibonacci`: `1+1` 或相邻项可合并
2. 出数规则抽象：
- `pow2`: `2/4`（90/10）
- `fibonacci`: `1/2`（75/25）
3. 封顶规则：
- 仅 `capped_4x4_pow2_no_undo` 设置 `max_tile=2048`

### 5. 回放
1. 本地回放导出/导入扩展为通用格式（包含 `mode_key + board_width + board_height + ruleset + undo_enabled`）。
2. 回放执行按配置重建棋盘与规则。
3. 历史回放页根据 `mode_key` 自动加载对应模式。

## 后端实现计划

### 1. 会话校验
1. `sessions.js` 改为基于 `mode_key` 校验。
2. 校验 `board_width/board_height`、`ruleset`、`undo_enabled` 与模式目录一致。
3. `ranked_bucket` 必须与 `mode_key` 绑定规则一致，禁止客户端伪造进榜。

### 2. 反作弊引擎
1. `ReplayEngine` 支持可配置 `width/height/ruleset/spawn_table/max_tile/undo_enabled`。
2. `verify.js` 用请求里的模式配置复算，不再写死 `size=4 + pow2`。
3. 排行榜查询仅取 `status='verified' AND ranked_bucket in (...)`。

### 3. 排行榜服务
1. `leaderboards.js` 参数从 `mode` 改为 `bucket`。
2. 只允许 `standard | classic_undo | capped`。
3. 前端下拉只显示这三项。

## 测试与验收

### 功能测试
1. 主页进入即无撤回标准版，`Z` 无效且无撤回按钮。
2. 模式页可进入一期所有新模式。
3. 各模式棋盘尺寸正确：
- 3x3、3x4、2x4 显示与碰撞逻辑正确
4. Fibonacci 合并逻辑正确：
- `1+1=2`
- 相邻项合并（如 `2+3=5`, `3+5=8`）
5. 封顶模式仍只能合并到 2048 且无撤回。
6. 排行榜仅三类可查；其他模式无榜单入口。
7. 历史页可看到所有模式并正确显示模式标签与终盘棋盘。

### 反作弊测试
1. 修改前端分数/终盘后提交应被拒绝。
2. 篡改 mode_key 或 ranked_bucket 进榜应被拒绝。
3. Fibonacci 与非4x4回放复算必须与客户端结果一致。

### 回归测试
1. 现有登录、上传、历史、回放不回退。
2. 旧历史数据可正常展示并可过滤。

## 上线与分阶段发布

1. 第一步：后端先上 `mode_key + ranked_bucket` 兼容读取（保持旧前端可用）。
2. 第二步：前端上线一期模式体系与主页切换。
3. 第三步：观察 3 天，监控提交失败率、复算失败率、排行榜查询耗时。
4. 第四步：进入二期 `5x5~10x10` 开发与发布。

## 假设与默认值（已固定）
1. 一期不包含 `5x5~10x10`，这些放二期。
2. 封顶模式仅无撤回版。
3. 只有三类榜单：标准无撤回、经典有撤回、封顶无撤回。
4. 其他所有新模式“有撤回/无撤回双版本”仅进历史不进榜。
5. Fibonacci 出生概率固定为 `1:75% / 2:25%`。

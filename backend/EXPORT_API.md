# Export API 使用说明

该文档说明如何导出指定用户的完整对局记录（含回放）。

## 1. 接口地址

- `GET /api/v1/users/:username/export`

示例：

```bash
curl -L "http://127.0.0.1:3001/api/v1/users/test_user/export" -o test_user_sessions.json
```

## 2. 查询参数

- `format`：`json` 或 `ndjson`，默认 `json`
- `status`：`all|verified|pending|rejected`，默认 `all`
- `mode_key`：按模式键过滤（推荐）
- `mode`：按旧模式字段过滤（兼容旧数据）
- `include_replay`：`true|false`，默认 `true`

示例：

```bash
curl -L "http://127.0.0.1:3001/api/v1/users/alice/export?status=verified&mode_key=standard_4x4_no_undo&format=json" -o alice_verified.json
```

```bash
curl -L "http://127.0.0.1:3001/api/v1/users/alice/export?format=ndjson&include_replay=true" -o alice.ndjson
```

## 3. 返回格式

### JSON

返回对象包含：

- `exported_at`
- `user`
- `total`
- `filters`
- `items`

`items` 中每条对局含：

- `session_id`
- `mode` / `mode_key`
- `board_width` / `board_height`
- `ruleset`
- `undo_enabled`
- `ranked_bucket`
- `mode_family`
- `rank_policy`
- `special_rules_snapshot`
- `challenge_id`
- `status`
- `score`
- `best_tile`
- `duration_ms`
- `final_board`
- `replay_version`
- `replay`（当 `include_replay=true`）
- `verify_reason`
- `ended_at`
- `created_at`

### NDJSON

第一行是 `type=meta`，后续每行是 `type=session` 的单条 JSON，便于流式处理和大文件导入。

## 4. 文件下载行为

接口会自动附带 `Content-Disposition: attachment`，浏览器会直接下载：

- `xxx_sessions_YYYYMMDD.json`
- `xxx_sessions_YYYYMMDD.ndjson`

## 5. 常见问题

1. 返回 `404 user_not_found`
- 用户名不存在。

2. 返回 `400 invalid_status`
- `status` 参数不是 `all|verified|pending|rejected`。

3. 想导出不含回放的轻量文件
- 使用 `include_replay=false`，可显著减小体积。

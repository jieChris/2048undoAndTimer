CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

CREATE INDEX idx_game_sessions_mode_status_score_created
ON game_sessions(mode, status, score, created_at);

CREATE INDEX idx_game_sessions_mode_week_status_score_created
ON game_sessions(mode, week_start, status, score, created_at);

CREATE INDEX idx_game_sessions_user_created_at
ON game_sessions(user_id, created_at);

CREATE INDEX idx_verify_jobs_status_available
ON verify_jobs(status, available_at);

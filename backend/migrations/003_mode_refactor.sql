ALTER TABLE game_sessions
  MODIFY COLUMN mode VARCHAR(64) NOT NULL;

ALTER TABLE game_sessions
  ADD COLUMN mode_key VARCHAR(64) NULL AFTER mode,
  ADD COLUMN board_width TINYINT UNSIGNED NOT NULL DEFAULT 4 AFTER mode_key,
  ADD COLUMN board_height TINYINT UNSIGNED NOT NULL DEFAULT 4 AFTER board_width,
  ADD COLUMN ruleset ENUM('pow2','fibonacci') NOT NULL DEFAULT 'pow2' AFTER board_height,
  ADD COLUMN undo_enabled BOOLEAN NOT NULL DEFAULT TRUE AFTER ruleset,
  ADD COLUMN ranked_bucket ENUM('standard','classic_undo','capped','none') NOT NULL DEFAULT 'none' AFTER undo_enabled;

UPDATE game_sessions
SET
  mode_key = CASE
    WHEN mode = 'classic' THEN 'classic_4x4_pow2_undo'
    WHEN mode = 'capped' THEN 'capped_4x4_pow2_no_undo'
    WHEN mode = 'practice' THEN 'practice_legacy'
    ELSE 'classic_4x4_pow2_undo'
  END,
  board_width = 4,
  board_height = 4,
  ruleset = 'pow2',
  undo_enabled = CASE
    WHEN mode = 'capped' THEN FALSE
    ELSE TRUE
  END,
  ranked_bucket = CASE
    WHEN mode = 'classic' THEN 'classic_undo'
    WHEN mode = 'capped' THEN 'capped'
    ELSE 'none'
  END;

ALTER TABLE game_sessions
  MODIFY COLUMN mode_key VARCHAR(64) NOT NULL;

CREATE INDEX idx_game_sessions_bucket_status_score_created
ON game_sessions(ranked_bucket, status, score, created_at);

CREATE INDEX idx_game_sessions_mode_key_created
ON game_sessions(mode_key, created_at);

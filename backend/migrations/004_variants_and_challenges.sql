CREATE TABLE IF NOT EXISTS challenges (
  id varchar(64) PRIMARY KEY,
  challenge_date date NOT NULL,
  mode_key varchar(64) NOT NULL,
  seed double NOT NULL,
  status enum('active','expired') NOT NULL DEFAULT 'active',
  title varchar(120) NOT NULL,
  special_rules_snapshot json NULL,
  created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_challenges_challenge_date (challenge_date),
  KEY idx_challenges_mode_date (mode_key, challenge_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE game_sessions
  MODIFY COLUMN ranked_bucket varchar(64) NOT NULL DEFAULT 'none',
  ADD COLUMN mode_family varchar(32) NOT NULL DEFAULT 'pow2' AFTER ranked_bucket,
  ADD COLUMN rank_policy enum('ranked','unranked','seasonal') NOT NULL DEFAULT 'unranked' AFTER mode_family,
  ADD COLUMN special_rules_snapshot json NULL AFTER rank_policy,
  ADD COLUMN challenge_id varchar(64) NULL AFTER special_rules_snapshot;

UPDATE game_sessions
SET
  mode_family = CASE
    WHEN ruleset = 'fibonacci' THEN 'fibonacci'
    ELSE 'pow2'
  END,
  rank_policy = CASE
    WHEN ranked_bucket IN ('standard', 'classic_undo', 'capped') THEN 'ranked'
    ELSE 'unranked'
  END,
  special_rules_snapshot = IFNULL(special_rules_snapshot, JSON_OBJECT());

ALTER TABLE game_sessions
  ADD CONSTRAINT fk_game_sessions_challenge
  FOREIGN KEY (challenge_id) REFERENCES challenges(id)
  ON DELETE SET NULL;

CREATE INDEX idx_game_sessions_challenge_status_score_created
ON game_sessions(challenge_id, status, score, created_at);

CREATE INDEX idx_game_sessions_rank_policy_bucket_status_score_created
ON game_sessions(rank_policy, ranked_bucket, status, score, created_at);

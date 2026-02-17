CREATE TABLE IF NOT EXISTS users (
  id char(36) PRIMARY KEY,
  username varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  password_hash text NOT NULL,
  created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_login_at datetime(3) NULL,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id char(36) PRIMARY KEY,
  user_id char(36) NOT NULL,
  token_hash varchar(64) NOT NULL,
  expires_at datetime(3) NOT NULL,
  revoked_at datetime(3) NULL,
  created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ip varchar(45) NULL,
  user_agent text NULL,
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS game_sessions (
  id char(36) PRIMARY KEY,
  user_id char(36) NOT NULL,
  mode enum('classic','capped','practice') NOT NULL,
  status enum('pending','verified','rejected') NOT NULL,
  score int NOT NULL,
  best_tile int NOT NULL,
  duration_ms int NOT NULL,
  final_board json NOT NULL,
  replay_version smallint unsigned NOT NULL DEFAULT 3,
  replay_payload longtext NOT NULL,
  verify_reason text NULL,
  client_version varchar(50) NULL,
  created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ended_at datetime(3) NOT NULL,
  week_start date NOT NULL,
  CONSTRAINT fk_game_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS verify_jobs (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  session_id char(36) NOT NULL,
  status enum('queued','running','done','failed') NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  available_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_error text NULL,
  created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_verify_jobs_session_id (session_id),
  CONSTRAINT fk_verify_jobs_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

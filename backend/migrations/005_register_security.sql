CREATE TABLE IF NOT EXISTS register_attempts (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  ip varchar(45) NOT NULL,
  device_id varchar(128) NULL,
  username varchar(20) NULL,
  success tinyint(1) NOT NULL DEFAULT 0,
  reason varchar(64) NULL,
  created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_register_attempts_ip_created (ip, created_at),
  KEY idx_register_attempts_device_created (device_id, created_at),
  KEY idx_register_attempts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

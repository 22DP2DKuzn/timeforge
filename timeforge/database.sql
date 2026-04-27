-- TimeForge Database Setup
-- Запусти в phpMyAdmin: вкладка "SQL"

CREATE DATABASE IF NOT EXISTS `timeforge`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `timeforge`;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `first_name`       VARCHAR(100)  NOT NULL,
  `last_name`        VARCHAR(100)  NOT NULL,
  `email`            VARCHAR(255)  NOT NULL UNIQUE,
  `password`         VARCHAR(255)  NOT NULL,
  `role`             ENUM('admin','user','guest') NOT NULL DEFAULT 'user',
  `timezone`         VARCHAR(100)  NOT NULL DEFAULT 'Europe/Riga',
  `language`         VARCHAR(10)   NOT NULL DEFAULT 'lv',
  `blocked`          TINYINT(1)    NOT NULL DEFAULT 0,
  `xp`               INT           NOT NULL DEFAULT 0,
  `level_num`        INT           NOT NULL DEFAULT 1,
  `streak`           INT           NOT NULL DEFAULT 0,
  `last_active_date` DATE                   DEFAULT NULL,
  `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
  `id`          VARCHAR(36)  NOT NULL PRIMARY KEY,
  `user_id`     INT          NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT,
  `start_date`  DATE,
  `end_date`    DATE,
  `color`       VARCHAR(20)  NOT NULL DEFAULT '#5641FF',
  `icon`        VARCHAR(10)  NOT NULL DEFAULT '📁',
  `status`      VARCHAR(50)  NOT NULL DEFAULT 'active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id`           VARCHAR(36)  NOT NULL PRIMARY KEY,
  `user_id`      INT          NOT NULL,
  `project_id`   VARCHAR(36)           DEFAULT NULL,
  `name`         VARCHAR(255) NOT NULL,
  `description`  TEXT,
  `date`         DATE,
  `time`         VARCHAR(10)           DEFAULT '09:00',
  `duration`     INT          NOT NULL DEFAULT 30,
  `priority`     VARCHAR(20)  NOT NULL DEFAULT 'medium',
  `category`     VARCHAR(50)  NOT NULL DEFAULT 'other',
  `status`       VARCHAR(50)  NOT NULL DEFAULT 'planned',
  `type`         VARCHAR(20)  NOT NULL DEFAULT 'task',
  `location`     VARCHAR(255)          DEFAULT '',
  `completed_at` DATETIME               DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `focus_sessions` (
  `id`         VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id`    INT         NOT NULL,
  `task_id`    VARCHAR(36)          DEFAULT NULL,
  `start_time` DATETIME,
  `end_time`   DATETIME,
  `duration`   INT,
  `type`       VARCHAR(30),
  `completed`  TINYINT(1)  NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         VARCHAR(36)  NOT NULL PRIMARY KEY,
  `user_id`    INT          NOT NULL,
  `type`       VARCHAR(50),
  `title`      VARCHAR(255),
  `message`    TEXT,
  `icon`       VARCHAR(10)  NOT NULL DEFAULT '🔔',
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotes` (
  `id`         VARCHAR(36) NOT NULL PRIMARY KEY,
  `text_lv`    TEXT        NOT NULL,
  `text_en`    TEXT        NOT NULL,
  `author`     VARCHAR(255),
  `active`     TINYINT(1)  NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `favorite_quotes` (
  `user_id`  INT         NOT NULL,
  `quote_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`user_id`, `quote_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `user_id`        INT          NOT NULL,
  `achievement_id` VARCHAR(100) NOT NULL,
  `unlocked_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `achievement_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id`         VARCHAR(36)  NOT NULL PRIMARY KEY,
  `user_id`    INT          NOT NULL,
  `action`     VARCHAR(100),
  `details`    TEXT,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id`              INT       NOT NULL PRIMARY KEY,
  `email_notifications`  TINYINT(1) NOT NULL DEFAULT 1,
  `reminder_24h`         TINYINT(1) NOT NULL DEFAULT 1,
  `reminder_1h`          TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at`           TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

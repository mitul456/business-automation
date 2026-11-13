-- ==============================================================================
-- OmniFlow SaaS — MySQL Production Database Initialization Script
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `omniflow_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `omniflow_db`;

-- Grant permissions to omniflow user
GRANT ALL PRIVILEGES ON `omniflow_db`.* TO 'omniflow_user'@'%';
FLUSH PRIVILEGES;

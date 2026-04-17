CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    url VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    INDEX idx_notifications_user_created_at (user_id, created_at),
    INDEX idx_notifications_user_is_read (user_id, is_read),
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);
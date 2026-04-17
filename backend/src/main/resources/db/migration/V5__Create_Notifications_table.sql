CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    url VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE INDEX idx_notifications_user_created_at ON Notifications (user_id, created_at);
CREATE INDEX idx_notifications_user_isread_created_at ON Notifications (user_id, is_read, created_at);
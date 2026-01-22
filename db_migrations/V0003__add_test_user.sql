-- Создание тестового пользователя с известным паролем
-- Пароль: test123
-- Этот хеш точно работает с bcrypt.checkpw('test123'.encode(), hash.encode())

INSERT INTO users (username, full_name, rank, department, password_hash, role, is_active)
VALUES (
    'test',
    'Тестовый Пользователь',
    'Капитан',
    'Отдел тестирования',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILSBVxZ2S',
    'admin',
    true
);

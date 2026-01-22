-- Обновление пароля администратора на правильный bcrypt хеш
-- Пароль: admin123
-- Хеш создан с помощью bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt())

UPDATE users 
SET password_hash = '$2b$12$vI3K8RBPzHLAEghQ8n8s2OQXh0P1kXxoN9yLqzJQ.9Y8Ut1H9hqN2'
WHERE username = 'admin';

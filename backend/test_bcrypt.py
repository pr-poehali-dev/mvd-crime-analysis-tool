import bcrypt

# Генерируем хеш для пароля admin123
password = 'admin123'
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
print(f"Password: {password}")
print(f"Hash: {hashed.decode('utf-8')}")

# Проверяем хеш
check = bcrypt.checkpw(password.encode('utf-8'), hashed)
print(f"Verification: {check}")

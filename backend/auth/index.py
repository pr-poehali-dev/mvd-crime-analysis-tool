import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import hashlib
import secrets
import bcrypt

def get_db_connection():
    """Подключение к базе данных PostgreSQL"""
    return psycopg2.connect(
        os.environ['DATABASE_URL'],
        cursor_factory=RealDictCursor
    )

def hash_password(password: str) -> str:
    """Хеширование пароля с bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, password_hash: str) -> bool:
    """Проверка пароля"""
    return bcrypt.checkpw(password.encode(), password_hash.encode())

def generate_token() -> str:
    """Генерация токена сессии"""
    return secrets.token_urlsafe(32)

def handler(event: dict, context) -> dict:
    """API для авторизации и управления доступом сотрудников МВД"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'login')
            
            if action == 'login':
                username = body.get('username', '')
                password = body.get('password', '')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False,
                            'error': 'Укажите имя пользователя и пароль'
                        }),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT id, username, full_name, rank, department, role, is_active, password_hash
                    FROM users
                    WHERE username = %s AND is_active = true
                """, (username,))
                
                user = cur.fetchone()
                
                if not user or not verify_password(password, user['password_hash']):
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 401,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False,
                            'error': 'Неверное имя пользователя или пароль'
                        }),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE users
                    SET last_login = %s
                    WHERE id = %s
                """, (datetime.now(), user['id']))
                
                conn.commit()
                
                token = generate_token()
                
                user_data = {k: v for k, v in user.items() if k != 'password_hash'}
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'message': 'Авторизация успешна',
                        'data': {
                            'user': user_data,
                            'token': token
                        }
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'register':
                username = body.get('username', '')
                password = body.get('password', '')
                full_name = body.get('full_name', '')
                rank = body.get('rank', '')
                department = body.get('department', '')
                
                if not username or not password or not full_name:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False,
                            'error': 'Заполните все обязательные поля'
                        }),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                existing_user = cur.fetchone()
                
                if existing_user:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 409,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False,
                            'error': 'Пользователь с таким именем уже существует'
                        }),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                
                cur.execute("""
                    INSERT INTO users (username, full_name, rank, department, password_hash, role)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, username, full_name, rank, department, role
                """, (username, full_name, rank, department, password_hash, 'officer'))
                
                new_user = cur.fetchone()
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'message': 'Пользователь зарегистрирован',
                        'data': dict(new_user)
                    }, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            cur.execute("""
                SELECT id, username, full_name, rank, department, role, is_active, created_at, last_login
                FROM users
                ORDER BY created_at DESC
            """)
            
            users = cur.fetchall()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'data': users,
                    'count': len(users)
                }, default=str),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'isBase64Encoded': False
        }
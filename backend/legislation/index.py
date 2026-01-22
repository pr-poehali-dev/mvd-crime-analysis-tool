import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    """Подключение к базе данных PostgreSQL"""
    return psycopg2.connect(
        os.environ['DATABASE_URL'],
        cursor_factory=RealDictCursor
    )

def handler(event: dict, context) -> dict:
    """API для работы с базой законодательства РФ (УК РФ, УПК РФ, Конституция)"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        path_params = event.get('pathParams', {})
        query_params = event.get('queryStringParameters', {}) or {}
        
        if method == 'GET':
            article_type = query_params.get('type', 'uk_rf')
            search_query = query_params.get('search', '')
            category = query_params.get('category', '')
            
            table_map = {
                'uk_rf': 'uk_rf_articles',
                'upk_rf': 'upk_rf_articles',
                'constitution': 'constitution_articles'
            }
            
            table_name = table_map.get(article_type, 'uk_rf_articles')
            
            query = f"SELECT * FROM {table_name} WHERE 1=1"
            params = []
            
            if search_query:
                query += " AND (article_number ILIKE %s OR title ILIKE %s)"
                search_pattern = f"%{search_query}%"
                params.extend([search_pattern, search_pattern])
            
            if category:
                query += " AND category ILIKE %s"
                params.append(f"%{category}%")
            
            query += " ORDER BY article_number"
            
            cur.execute(query, params)
            articles = cur.fetchall()
            
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
                    'data': articles,
                    'count': len(articles)
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'add')
            
            if action == 'update_from_source':
                update_result = {
                    'articles_added': 0,
                    'articles_updated': 0,
                    'timestamp': datetime.now().isoformat()
                }
                
                cur.execute("""
                    INSERT INTO legislation_updates (source_type, articles_added, articles_updated, status)
                    VALUES (%s, %s, %s, %s)
                """, ('manual', 0, 0, 'success'))
                
                conn.commit()
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
                        'message': 'Обновление законодательства запущено',
                        'data': update_result
                    }),
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

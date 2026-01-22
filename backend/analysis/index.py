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

def analyze_crime(description: str, category: str, evidence: str) -> dict:
    """Анализ преступления и определение применимых статей"""
    keywords_map = {
        'кража': ['158'],
        'украл': ['158'],
        'похитил': ['158', '161'],
        'грабеж': ['161'],
        'грабёж': ['161'],
        'разбой': ['162'],
        'оружие': ['162', '222'],
        'мошенничество': ['159'],
        'обман': ['159'],
        'убийство': ['105'],
        'убил': ['105'],
        'наркотик': ['228'],
        'дтп': ['264'],
        'авария': ['264']
    }
    
    description_lower = description.lower()
    evidence_lower = evidence.lower()
    combined_text = f"{description_lower} {evidence_lower}"
    
    suggested_articles = []
    for keyword, articles in keywords_map.items():
        if keyword in combined_text:
            suggested_articles.extend(articles)
    
    suggested_articles = list(set(suggested_articles))
    
    return {
        'suggested_articles': suggested_articles,
        'analysis_date': datetime.now().isoformat(),
        'confidence': 'high' if len(suggested_articles) > 0 else 'low'
    }

def handler(event: dict, context) -> dict:
    """API для анализа преступлений и управления делами"""
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
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            case_number = body.get('case_number', '')
            incident_date = body.get('incident_date', '')
            category = body.get('category', '')
            description = body.get('description', '')
            evidence = body.get('evidence', '')
            officer_id = body.get('officer_id', 1)
            
            if not case_number or not incident_date or not description:
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
            
            analysis_result = analyze_crime(description, category, evidence)
            
            cur.execute("""
                INSERT INTO crime_analyses (
                    case_number, incident_date, category, description, 
                    evidence, analysis_result, status, officer_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, case_number, status, created_at
            """, (
                case_number, incident_date, category, description,
                evidence, json.dumps(analysis_result), 'completed', officer_id
            ))
            
            new_analysis = cur.fetchone()
            
            for article_num in analysis_result['suggested_articles']:
                cur.execute("""
                    SELECT id FROM uk_rf_articles WHERE article_number = %s
                """, (article_num,))
                article = cur.fetchone()
                
                if article:
                    cur.execute("""
                        INSERT INTO analysis_articles (analysis_id, article_type, article_id, relevance_score)
                        VALUES (%s, %s, %s, %s)
                    """, (new_analysis['id'], 'uk_rf', article['id'], 0.85))
            
            conn.commit()
            
            cur.execute("""
                SELECT 
                    ca.*,
                    u.full_name as officer_name,
                    u.rank as officer_rank
                FROM crime_analyses ca
                LEFT JOIN users u ON ca.officer_id = u.id
                WHERE ca.id = %s
            """, (new_analysis['id'],))
            
            complete_analysis = cur.fetchone()
            
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
                    'message': 'Анализ преступления завершён',
                    'data': complete_analysis
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            status_filter = query_params.get('status', '')
            officer_id = query_params.get('officer_id', '')
            
            query = """
                SELECT 
                    ca.*,
                    u.full_name as officer_name,
                    u.rank as officer_rank
                FROM crime_analyses ca
                LEFT JOIN users u ON ca.officer_id = u.id
                WHERE 1=1
            """
            params = []
            
            if status_filter:
                query += " AND ca.status = %s"
                params.append(status_filter)
            
            if officer_id:
                query += " AND ca.officer_id = %s"
                params.append(int(officer_id))
            
            query += " ORDER BY ca.created_at DESC LIMIT 50"
            
            cur.execute(query, params)
            analyses = cur.fetchall()
            
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
                    'data': analyses,
                    'count': len(analyses)
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

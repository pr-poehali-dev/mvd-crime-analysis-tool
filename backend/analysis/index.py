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

def analyze_crime(description: str, category: str, evidence: str, conn) -> dict:
    """Улучшенный анализ преступления с использованием полнотекстового поиска по базе"""
    
    # Расширенный словарь ключевых слов с синонимами и связанными терминами
    keywords_map = {
        # Преступления против собственности
        'кража': ['158', '158.1'],
        'украл': ['158'],
        'украли': ['158'],
        'похитил': ['158', '161', '126'],
        'похищение': ['158', '126'],
        'воровство': ['158'],
        'тайное хищение': ['158'],
        'грабеж': ['161'],
        'грабёж': ['161'],
        'открытое хищение': ['161'],
        'отобрал': ['161'],
        'разбой': ['162'],
        'нападение': ['162', '213'],
        'оружие': ['162', '222', '223', '226'],
        'пистолет': ['222', '162'],
        'нож': ['162', '222'],
        'автомат': ['222'],
        'взрывчатка': ['222.1', '223.1'],
        'мошенничество': ['159', '159.1', '159.2', '159.3', '159.4', '159.5', '159.6'],
        'обман': ['159', '165'],
        'обманул': ['159'],
        'развод': ['159'],
        'фальшивый': ['186', '187'],
        'поддельный': ['186', '187', '327'],
        'подделка': ['186', '327'],
        'вымогательство': ['163'],
        'вымогал': ['163'],
        'требовал деньги': ['163'],
        'присвоение': ['160'],
        'растрата': ['160'],
        'угон': ['166'],
        'угнал машину': ['166'],
        'поджог': ['167', '205'],
        'уничтожение имущества': ['167'],
        'повреждение имущества': ['167', '168'],
        
        # Преступления против жизни и здоровья
        'убийство': ['105'],
        'убил': ['105'],
        'лишил жизни': ['105'],
        'умышленное убийство': ['105'],
        'двух человек': ['105.1'],
        'нескольких человек': ['105.1'],
        'младенец': ['106'],
        'новорожденный': ['106'],
        'аффект': ['107', '113'],
        'необходимая оборона': ['108', '114'],
        'самооборона': ['108'],
        'по неосторожности': ['109', '118'],
        'неосторожно': ['109', '118', '168'],
        'суицид': ['110'],
        'самоубийство': ['110'],
        'доведение до самоубийства': ['110'],
        'избил': ['111', '112', '115', '116'],
        'избиение': ['111', '112', '116'],
        'побои': ['116'],
        'удар': ['115', '116'],
        'тяжкий вред': ['111'],
        'средний вред': ['112'],
        'легкий вред': ['115'],
        'истязание': ['117'],
        'пытки': ['117'],
        'угроза убийством': ['119'],
        'угрожал убить': ['119'],
        'вич': ['122'],
        'спид': ['122'],
        'заражение': ['121', '122'],
        'венерическая болезнь': ['121'],
        
        # Половые преступления
        'изнасилование': ['131'],
        'изнасиловал': ['131'],
        'насилие сексуальное': ['132'],
        'несовершеннолетний': ['134', '135', '150', '151'],
        'ребенок': ['134', '135', '150'],
        'развратные действия': ['135'],
        
        # Преступления против свободы
        'похищение человека': ['126'],
        'захват заложника': ['206'],
        'заложник': ['206'],
        'лишение свободы': ['127'],
        'незаконное лишение свободы': ['127'],
        'торговля людьми': ['127.1'],
        'рабский труд': ['127.2'],
        'клевета': ['128.1'],
        
        # Наркотические преступления
        'наркотик': ['228', '228.1', '228.2', '228.3', '228.4', '229', '230', '231', '232'],
        'наркотики': ['228', '228.1', '229'],
        'героин': ['228', '228.1'],
        'кокаин': ['228', '228.1'],
        'марихуана': ['228', '231'],
        'гашиш': ['228', '231'],
        'амфетамин': ['228', '228.1'],
        'наркотическое средство': ['228', '228.1'],
        'психотропное вещество': ['228', '228.1'],
        'сбыт наркотиков': ['228.1'],
        'распространение наркотиков': ['228.1'],
        'склонение к употреблению': ['230'],
        'притон': ['232'],
        'выращивание наркотических растений': ['231'],
        
        # Транспортные преступления
        'дтп': ['264', '265'],
        'авария': ['264'],
        'дорожно-транспортное': ['264'],
        'сбил пешехода': ['264'],
        'наехал': ['264'],
        'скрылся с места': ['265'],
        'оставил место дтп': ['265'],
        'пьяный за рулем': ['264.1'],
        'алкоголь за рулем': ['264'],
        'нарушение пдд': ['264'],
        
        # Экономические преступления
        'коррупция': ['290', '291'],
        'взятка': ['290', '291', '291.1', '291.2'],
        'подкуп': ['290', '291', '204'],
        'дал взятку': ['291'],
        'получил взятку': ['290'],
        'откат': ['290', '291'],
        'отмывание': ['174', '174.1'],
        'легализация': ['174', '174.1'],
        'уклонение от налогов': ['198', '199'],
        'налоги не платил': ['198', '199'],
        'незаконное предпринимательство': ['171'],
        'банкротство': ['195', '196', '197'],
        'фиктивное банкротство': ['197'],
        'преднамеренное банкротство': ['196'],
        
        # Компьютерные преступления
        'взлом': ['272', '273', '274.1'],
        'хакер': ['272', '273'],
        'компьютер': ['272', '273', '274'],
        'вирус': ['273'],
        'компьютерная программа': ['273'],
        'неправомерный доступ': ['272'],
        'вредоносная программа': ['273'],
        'база данных': ['272'],
        'критическая инфраструктура': ['274.1'],
        
        # Террористические и экстремистские преступления
        'терроризм': ['205', '205.1', '205.2', '205.3', '205.4', '205.5'],
        'террористический акт': ['205'],
        'теракт': ['205'],
        'взрыв': ['205', '207', '222.1'],
        'ложное сообщение': ['207'],
        'заминирование': ['207'],
        'экстремизм': ['280', '282', '282.1', '282.2'],
        'разжигание ненависти': ['282'],
        'национальная рознь': ['282'],
        'религиозная рознь': ['282'],
        
        # Преступления против государственной власти
        'служебный подлог': ['292'],
        'подлог': ['292', '327'],
        'халатность': ['293'],
        'превышение полномочий': ['286'],
        'злоупотребление полномочиями': ['285'],
        'фальсификация доказательств': ['303'],
        'незаконное задержание': ['301'],
        'пытки следователем': ['302'],
        'ложный донос': ['306'],
        'лжесвидетельство': ['307'],
        'государственная измена': ['275'],
        'шпионаж': ['276'],
        
        # Хулиганство и общественный порядок
        'хулиганство': ['213'],
        'дебош': ['213'],
        'нарушение порядка': ['213'],
        'вандализм': ['214'],
        'массовые беспорядки': ['212'],
        'бандитизм': ['209'],
        'банда': ['209', '210'],
        'преступная группа': ['210'],
        'организованная группа': ['210'],
    }
    
    description_lower = description.lower()
    evidence_lower = evidence.lower()
    combined_text = f"{description_lower} {evidence_lower} {category.lower()}"
    
    # Этап 1: Поиск по ключевым словам
    keyword_articles = set()
    matched_keywords = []
    
    for keyword, articles in keywords_map.items():
        if keyword in combined_text:
            keyword_articles.update(articles)
            matched_keywords.append(keyword)
    
    # Этап 2: Полнотекстовый поиск в базе данных
    cur = conn.cursor()
    search_terms = ' '.join(matched_keywords[:5]) if matched_keywords else description_lower[:100]
    
    # Поиск по УК РФ
    cur.execute("""
        SELECT article_number, title, category, severity
        FROM uk_rf_articles
        WHERE 
            title ILIKE %s 
            OR category ILIKE %s
        ORDER BY 
            CASE 
                WHEN title ILIKE %s THEN 1
                WHEN category ILIKE %s THEN 2
                ELSE 3
            END
        LIMIT 10
    """, (f'%{search_terms}%', f'%{category}%', f'%{search_terms}%', f'%{category}%'))
    
    db_articles = cur.fetchall()
    db_article_numbers = [art['article_number'] for art in db_articles]
    
    # Объединение результатов
    all_articles = list(keyword_articles) + db_article_numbers
    suggested_articles = list(dict.fromkeys(all_articles))[:15]  # Убираем дубликаты, берем топ-15
    
    # Получаем детали статей
    article_details = []
    for art_num in suggested_articles[:10]:  # Берем топ-10 для детализации
        cur.execute("""
            SELECT article_number, title, category, severity
            FROM uk_rf_articles
            WHERE article_number = %s
        """, (art_num,))
        art = cur.fetchone()
        if art:
            article_details.append({
                'number': art['article_number'],
                'title': art['title'],
                'category': art['category'],
                'severity': art['severity']
            })
    
    # Определение уровня уверенности
    confidence = 'high' if len(matched_keywords) >= 2 else 'medium' if len(matched_keywords) == 1 else 'low'
    
    return {
        'suggested_articles': suggested_articles,
        'article_details': article_details,
        'matched_keywords': matched_keywords,
        'analysis_date': datetime.now().isoformat(),
        'confidence': confidence,
        'total_found': len(suggested_articles)
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
            
            analysis_result = analyze_crime(description, category, evidence, conn)
            
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
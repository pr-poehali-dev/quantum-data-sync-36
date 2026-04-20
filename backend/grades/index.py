"""CRUD оценок и пересдач студентов"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    resource = params.get('type', 'grades')

    # ── ПЕРЕСДАЧИ ────────────────────────────────────────────
    if resource == 'retakes':
        if method == 'GET':
            student_id = params.get('student_id')
            if not student_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'student_id required'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                SELECT id, student_id, month, year, attempt, score
                FROM retakes WHERE student_id=%s ORDER BY year, month, attempt
            """, (student_id,))
            rows = cur.fetchall()
            conn.close()
            retakes = [{'id': r[0], 'student_id': r[1], 'month': r[2], 'year': r[3], 'attempt': r[4], 'score': r[5]} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'retakes': retakes}, ensure_ascii=False)}

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            student_id = body.get('student_id')
            month = body.get('month', '').strip()
            year = body.get('year')
            attempt = body.get('attempt')
            score = body.get('score')
            if not all([student_id, month, year, attempt, score is not None]):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO retakes (student_id, month, year, attempt, score)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (student_id, month, year, attempt) DO UPDATE SET score=EXCLUDED.score
            """, (student_id, month, int(year), int(attempt), int(score)))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    # ── ОЦЕНКИ ────────────────────────────────────────────────
    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        student_id = body.get('student_id')
        month = body.get('month', '').strip()
        year = body.get('year')
        score = body.get('score')
        if not all([student_id, month, year, score is not None]):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        if not (0 <= int(score) <= 100):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Оценка должна быть от 0 до 100'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO grades (student_id, month, year, score)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (student_id, month, year) DO UPDATE SET score = EXCLUDED.score
        """, (student_id, month, year, int(score)))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    if method == 'GET':
        student_id = params.get('student_id')
        conn = get_conn()
        cur = conn.cursor()
        if student_id:
            # grades + best score (max of grade and retakes)
            cur.execute("""
                SELECT g.id, g.student_id, g.month, g.year, g.score,
                       GREATEST(g.score, COALESCE(MAX(r.score), 0)) as best_score
                FROM grades g
                LEFT JOIN retakes r ON r.student_id=g.student_id AND r.month=g.month AND r.year=g.year
                WHERE g.student_id=%s
                GROUP BY g.id, g.student_id, g.month, g.year, g.score
                ORDER BY g.year, g.month
            """, (student_id,))
        else:
            cur.execute("""
                SELECT g.id, g.student_id, g.month, g.year, g.score,
                       GREATEST(g.score, COALESCE(MAX(r.score), 0)) as best_score
                FROM grades g
                LEFT JOIN retakes r ON r.student_id=g.student_id AND r.month=g.month AND r.year=g.year
                GROUP BY g.id, g.student_id, g.month, g.year, g.score
                ORDER BY g.student_id, g.year, g.month
            """)
        rows = cur.fetchall()
        conn.close()
        grades = [{'id': r[0], 'student_id': r[1], 'month': r[2], 'year': r[3], 'score': r[4], 'best_score': r[5]} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'grades': grades}, ensure_ascii=False)}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

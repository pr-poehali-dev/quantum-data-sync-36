"""CRUD оценок: добавление и редактирование оценок студентов"""
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
        params = event.get('queryStringParameters') or {}
        student_id = params.get('student_id')
        conn = get_conn()
        cur = conn.cursor()
        if student_id:
            cur.execute("SELECT id, student_id, month, year, score FROM grades WHERE student_id = %s ORDER BY year, month", (student_id,))
        else:
            cur.execute("SELECT id, student_id, month, year, score FROM grades ORDER BY student_id, year, month")
        rows = cur.fetchall()
        conn.close()
        grades = [{'id': r[0], 'student_id': r[1], 'month': r[2], 'year': r[3], 'score': r[4]} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'grades': grades}, ensure_ascii=False)}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

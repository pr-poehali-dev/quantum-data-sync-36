"""CRUD замечаний: список, добавление, редактирование, удаление"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT r.id, r.student_id, s.name, s.group, r.text, r.created_at
            FROM remarks r
            JOIN students s ON s.id = r.student_id
            ORDER BY r.created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        remarks = [
            {'id': r[0], 'student_id': r[1], 'student_name': r[2], 'group': r[3],
             'text': r[4], 'created_at': r[5].strftime('%d.%m.%Y %H:%M')}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'remarks': remarks}, ensure_ascii=False)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        student_id = body.get('student_id')
        text = body.get('text', '').strip()
        if not student_id or not text:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('INSERT INTO remarks (student_id, text) VALUES (%s, %s) RETURNING id', (student_id, text))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        remark_id = body.get('id')
        text = body.get('text', '').strip()
        if not remark_id or not text:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('UPDATE remarks SET text=%s WHERE id=%s', (text, remark_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        body = json.loads(event.get('body') or '{}')
        remark_id = body.get('id')
        if not remark_id:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'ID обязателен'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM remarks WHERE id=%s', (remark_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

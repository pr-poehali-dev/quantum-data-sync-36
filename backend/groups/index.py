"""CRUD статистики групп: набор и остаток"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT id, "group", enrolled, remaining FROM group_stats ORDER BY "group"')
        rows = cur.fetchall()
        conn.close()
        groups = [{'id': r[0], 'group': r[1], 'enrolled': r[2], 'remaining': r[3]} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'groups': groups}, ensure_ascii=False)}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        group = body.get('group', '').strip()
        enrolled = body.get('enrolled')
        remaining = body.get('remaining')
        if not group or enrolled is None or remaining is None:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO group_stats ("group", enrolled, remaining)
            VALUES (%s, %s, %s)
            ON CONFLICT ("group") DO UPDATE SET enrolled=EXCLUDED.enrolled, remaining=EXCLUDED.remaining
        """, (group, int(enrolled), int(remaining)))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

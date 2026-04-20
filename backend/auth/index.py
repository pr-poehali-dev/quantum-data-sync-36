"""Авторизация администратора"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        username = body.get('username', '').strip()
        password = body.get('password', '').strip()

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            "SELECT id, username FROM admins WHERE username = %s AND password_hash = %s",
            (username, password)
        )
        row = cur.fetchone()
        conn.close()

        if row:
            token = f"admin_{row[0]}_{username}"
            return {
                'statusCode': 200,
                'headers': CORS,
                'body': json.dumps({'ok': True, 'token': token, 'username': row[1]})
            }
        return {
            'statusCode': 401,
            'headers': CORS,
            'body': json.dumps({'ok': False, 'error': 'Неверный логин или пароль'})
        }

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

"""CRUD студентов: список, добавление, редактирование, отчисление"""
import json
import os
import psycopg2
from datetime import datetime

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    if method == 'GET':
        include_expelled = params.get('expelled') == 'true'
        conn = get_conn()
        cur = conn.cursor()

        if include_expelled:
            cur.execute("""
                SELECT id, name, "group", expelled, expel_comment, expel_date
                FROM students WHERE expelled = TRUE ORDER BY expel_date DESC
            """)
            rows = cur.fetchall()
            conn.close()
            expelled = [
                {'id': r[0], 'name': r[1], 'group': r[2],
                 'expel_comment': r[4],
                 'expel_date': r[5].strftime('%d.%m.%Y') if r[5] else ''}
                for r in rows
            ]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'expelled': expelled}, ensure_ascii=False)}

        cur.execute("""
            SELECT s.id, s.name, s.group,
                   COALESCE(ROUND(AVG(CASE WHEN g.score > 0 THEN g.score END)::numeric, 1), 0) as average,
                   json_agg(json_build_object('month', g.month, 'year', g.year, 'score', g.score) ORDER BY g.year, CASE g.month
                     WHEN 'Сен' THEN 1 WHEN 'Окт' THEN 2 WHEN 'Ноя' THEN 3 WHEN 'Дек' THEN 4
                     WHEN 'Янв' THEN 5 WHEN 'Фев' THEN 6 WHEN 'Мар' THEN 7 WHEN 'Апр' THEN 8
                     WHEN 'Май' THEN 9 WHEN 'Июн' THEN 10
                     ELSE 11 END) FILTER (WHERE g.id IS NOT NULL) as grades
            FROM students s
            LEFT JOIN grades g ON g.student_id = s.id
            WHERE s.expelled = FALSE OR s.expelled IS NULL
            GROUP BY s.id, s.name, s.group
            ORDER BY s.name
        """)
        rows = cur.fetchall()
        conn.close()

        students = []
        for row in rows:
            students.append({
                'id': row[0],
                'name': row[1],
                'group': row[2],
                'average': float(row[3]) if row[3] else 0,
                'grades': row[4] or []
            })

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'students': students}, ensure_ascii=False)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        name = body.get('name', '').strip()
        group = body.get('group', '').strip()
        if not name or not group:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('INSERT INTO students (name, "group") VALUES (%s, %s) RETURNING id', (name, group))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        student_id = body.get('id')
        action = body.get('action', 'update')

        if action == 'expel':
            comment = body.get('expel_comment', '').strip()
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                'UPDATE students SET expelled=TRUE, expel_comment=%s, expel_date=%s WHERE id=%s',
                (comment, datetime.now(), student_id)
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'restore':
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                'UPDATE students SET expelled=FALSE, expel_comment=NULL, expel_date=NULL WHERE id=%s',
                (student_id,)
            )
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        name = body.get('name', '').strip()
        group = body.get('group', '').strip()
        if not student_id or not name or not group:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('UPDATE students SET name=%s, "group"=%s WHERE id=%s', (name, group, student_id))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

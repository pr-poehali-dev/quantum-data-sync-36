"""CRUD групп и часов вычитки: список, создание, переименование, удаление, план/факт часов"""
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
    resource = params.get('type', 'groups')

    # ── ЧАСЫ ВЫЧИТКИ ──────────────────────────────────────────
    if resource == 'hours':
        if method == 'GET':
            year = int(params.get('year', 2025))
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                SELECT h.id, h."group", h.year, h.plan_hours, h.fact_hours
                FROM hours_plan h WHERE h.year = %s ORDER BY h."group"
            """, (year,))
            rows = cur.fetchall()
            conn.close()
            hours = [{'id': r[0], 'group': r[1], 'year': r[2], 'plan_hours': r[3], 'fact_hours': r[4]} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'hours': hours}, ensure_ascii=False)}

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            group = body.get('group', '').strip()
            year = body.get('year', 2025)
            plan_hours = body.get('plan_hours')
            fact_hours = body.get('fact_hours')
            if not group or plan_hours is None or fact_hours is None:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO hours_plan ("group", year, plan_hours, fact_hours, updated_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT ("group", year) DO UPDATE
                SET plan_hours=EXCLUDED.plan_hours, fact_hours=EXCLUDED.fact_hours, updated_at=NOW()
            """, (group, int(year), int(plan_hours), int(fact_hours)))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    # ── ГРУППЫ ────────────────────────────────────────────────
    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT gs.id, gs."group", gs.enrolled, gs.remaining,
                   COUNT(s.id) as student_count
            FROM group_stats gs
            LEFT JOIN students s ON s."group" = gs."group" AND (s.expelled = FALSE OR s.expelled IS NULL)
            GROUP BY gs.id, gs."group", gs.enrolled, gs.remaining
            ORDER BY gs."group"
        """)
        rows = cur.fetchall()
        conn.close()
        groups = [{'id': r[0], 'group': r[1], 'enrolled': r[2], 'remaining': r[3], 'student_count': r[4]} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'groups': groups}, ensure_ascii=False)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        group = body.get('group', '').strip()
        enrolled = body.get('enrolled', 0)
        remaining = body.get('remaining', 0)
        if not group:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Название группы обязательно'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT id FROM group_stats WHERE "group" = %s', (group,))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Группа уже существует'})}
        cur.execute('INSERT INTO group_stats ("group", enrolled, remaining) VALUES (%s, %s, %s) RETURNING id',
                    (group, int(enrolled), int(remaining)))
        new_id = cur.fetchone()[0]
        # также создаём запись в hours_plan
        cur.execute('INSERT INTO hours_plan ("group", year, plan_hours, fact_hours) VALUES (%s, 2025, 0, 0) ON CONFLICT DO NOTHING', (group,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'id': new_id})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        group = body.get('group', '').strip()
        action = body.get('action', 'update_stats')

        if action == 'rename':
            old_name = body.get('old_name', '').strip()
            new_name = body.get('new_name', '').strip()
            if not old_name or not new_name:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите старое и новое название'})}
            conn = get_conn()
            cur = conn.cursor()
            cur.execute('UPDATE group_stats SET "group"=%s WHERE "group"=%s', (new_name, old_name))
            cur.execute('UPDATE students SET "group"=%s WHERE "group"=%s', (new_name, old_name))
            cur.execute('UPDATE hours_plan SET "group"=%s WHERE "group"=%s', (new_name, old_name))
            conn.commit()
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

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

    if method == 'DELETE':
        body = json.loads(event.get('body') or '{}')
        group = body.get('group', '').strip()
        if not group:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Название группы обязательно'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM students WHERE "group"=%s AND (expelled=FALSE OR expelled IS NULL)', (group,))
        count = cur.fetchone()[0]
        if count > 0:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': f'В группе {count} активных студентов. Переведите или отчислите их перед удалением.'})}
        cur.execute('DELETE FROM group_stats WHERE "group"=%s', (group,))
        cur.execute('DELETE FROM hours_plan WHERE "group"=%s', (group,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

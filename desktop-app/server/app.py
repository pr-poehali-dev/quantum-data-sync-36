"""
Локальный Flask-сервер для десктопного приложения.
Заменяет облачные функции poehali.dev.
База данных: SQLite (файл data/db.sqlite3)
"""
import json
import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'db.sqlite3')


def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            "group" TEXT NOT NULL,
            expelled INTEGER DEFAULT 0,
            expel_comment TEXT,
            expel_date TEXT
        );

        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES students(id),
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            UNIQUE(student_id, month, year)
        );

        CREATE TABLE IF NOT EXISTS retakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES students(id),
            month TEXT NOT NULL,
            year INTEGER NOT NULL,
            attempt INTEGER NOT NULL CHECK(attempt IN (1,2,3)),
            score INTEGER NOT NULL DEFAULT 0,
            UNIQUE(student_id, month, year, attempt)
        );

        CREATE TABLE IF NOT EXISTS remarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES students(id),
            text TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS groups_stat (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            "group" TEXT NOT NULL UNIQUE,
            enrolled INTEGER DEFAULT 0,
            remaining INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS hours_plan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            "group" TEXT NOT NULL,
            year INTEGER NOT NULL,
            plan_hours INTEGER DEFAULT 0,
            fact_hours INTEGER DEFAULT 0,
            UNIQUE("group", year)
        );

        INSERT OR IGNORE INTO admins (username, password_hash) VALUES ('admin', 'admin');
    """)
    conn.commit()
    conn.close()


# ── AUTH ──────────────────────────────────────────────────────────────────────

@app.route('/auth', methods=['POST', 'OPTIONS'])
def auth():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    body = request.get_json(force=True) or {}
    username = body.get('username', '').strip()
    password = body.get('password', '').strip()
    conn = get_conn()
    row = conn.execute(
        "SELECT id, username FROM admins WHERE username=? AND password_hash=?",
        (username, password)
    ).fetchone()
    conn.close()
    if row:
        token = f"admin_{row['id']}_{row['username']}"
        return jsonify({'ok': True, 'token': token, 'username': row['username']})
    return jsonify({'ok': False, 'error': 'Неверный логин или пароль'}), 401


# ── STUDENTS ──────────────────────────────────────────────────────────────────

@app.route('/students', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def students():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    conn = get_conn()

    if request.method == 'GET':
        expelled = request.args.get('expelled') == 'true'
        if expelled:
            rows = conn.execute(
                "SELECT id, name, \"group\", expel_comment, expel_date FROM students WHERE expelled=1 ORDER BY expel_date DESC"
            ).fetchall()
            conn.close()
            return jsonify({'expelled': [
                {'id': r['id'], 'name': r['name'], 'group': r['group'],
                 'expel_comment': r['expel_comment'] or '',
                 'expel_date': r['expel_date'] or ''}
                for r in rows
            ]})

        MONTH_ORDER = {'Сен':1,'Окт':2,'Ноя':3,'Дек':4,'Янв':5,'Фев':6,'Мар':7,'Апр':8,'Май':9,'Июн':10}
        rows = conn.execute(
            "SELECT id, name, \"group\" FROM students WHERE expelled=0 OR expelled IS NULL ORDER BY name"
        ).fetchall()
        students_list = []
        for row in rows:
            sid = row['id']
            grades_rows = conn.execute("""
                SELECT g.id, g.month, g.year, g.score,
                       MAX(COALESCE(r.score, 0)) as max_retake
                FROM grades g
                LEFT JOIN retakes r ON r.student_id=g.student_id AND r.month=g.month AND r.year=g.year
                WHERE g.student_id=?
                GROUP BY g.id, g.month, g.year, g.score
            """, (sid,)).fetchall()

            grades = []
            best_scores = []
            for g in grades_rows:
                best = max(g['score'], g['max_retake'] or 0)
                grades.append({
                    'month': g['month'], 'year': g['year'],
                    'score': g['score'], 'best_score': best
                })
                if best > 0:
                    best_scores.append(best)
            grades.sort(key=lambda x: (x['year'], MONTH_ORDER.get(x['month'], 99)))

            avg = round(sum(best_scores) / len(best_scores), 1) if best_scores else 0
            students_list.append({
                'id': sid, 'name': row['name'], 'group': row['group'],
                'average': avg, 'grades': grades
            })
        conn.close()
        return jsonify({'students': students_list})

    if request.method == 'POST':
        body = request.get_json(force=True) or {}
        name = body.get('name', '').strip()
        group = body.get('group', '').strip()
        if not name or not group:
            return jsonify({'error': 'Заполните все поля'}), 400
        cur = conn.execute('INSERT INTO students (name, "group") VALUES (?,?)', (name, group))
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return jsonify({'ok': True, 'id': new_id})

    if request.method == 'PUT':
        body = request.get_json(force=True) or {}
        sid = body.get('id')
        action = body.get('action', 'update')
        if action == 'expel':
            comment = body.get('expel_comment', '').strip()
            conn.execute('UPDATE students SET expelled=1, expel_comment=?, expel_date=? WHERE id=?',
                         (comment, datetime.now().strftime('%d.%m.%Y'), sid))
            conn.commit()
            conn.close()
            return jsonify({'ok': True})
        if action == 'restore':
            conn.execute('UPDATE students SET expelled=0, expel_comment=NULL, expel_date=NULL WHERE id=?', (sid,))
            conn.commit()
            conn.close()
            return jsonify({'ok': True})
        name = body.get('name', '').strip()
        group = body.get('group', '').strip()
        conn.execute('UPDATE students SET name=?, "group"=? WHERE id=?', (name, group, sid))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    if request.method == 'DELETE':
        body = request.get_json(force=True) or {}
        sid = body.get('id')
        conn.execute('DELETE FROM retakes WHERE student_id=?', (sid,))
        conn.execute('DELETE FROM grades WHERE student_id=?', (sid,))
        conn.execute('DELETE FROM remarks WHERE student_id=?', (sid,))
        conn.execute('DELETE FROM students WHERE id=?', (sid,))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    conn.close()
    return jsonify({'error': 'Method not allowed'}), 405


# ── GRADES ────────────────────────────────────────────────────────────────────

@app.route('/grades', methods=['GET', 'PUT', 'OPTIONS'])
def grades():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    conn = get_conn()
    resource = request.args.get('type', 'grades')

    if resource == 'retakes':
        if request.method == 'GET':
            sid = request.args.get('student_id')
            if not sid:
                return jsonify({'error': 'student_id required'}), 400
            rows = conn.execute(
                "SELECT id, student_id, month, year, attempt, score FROM retakes WHERE student_id=? ORDER BY year, month, attempt",
                (sid,)
            ).fetchall()
            conn.close()
            return jsonify({'retakes': [dict(r) for r in rows]})
        if request.method == 'PUT':
            body = request.get_json(force=True) or {}
            conn.execute("""
                INSERT INTO retakes (student_id, month, year, attempt, score)
                VALUES (?,?,?,?,?)
                ON CONFLICT(student_id, month, year, attempt) DO UPDATE SET score=excluded.score
            """, (body['student_id'], body['month'], body['year'], body['attempt'], body['score']))
            conn.commit()
            conn.close()
            return jsonify({'ok': True})

    if request.method == 'PUT':
        body = request.get_json(force=True) or {}
        conn.execute("""
            INSERT INTO grades (student_id, month, year, score)
            VALUES (?,?,?,?)
            ON CONFLICT(student_id, month, year) DO UPDATE SET score=excluded.score
        """, (body['student_id'], body['month'], body['year'], body['score']))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    if request.method == 'GET':
        sid = request.args.get('student_id')
        if sid:
            rows = conn.execute(
                "SELECT id, student_id, month, year, score FROM grades WHERE student_id=? ORDER BY year, month",
                (sid,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, student_id, month, year, score FROM grades ORDER BY student_id, year, month"
            ).fetchall()
        conn.close()
        return jsonify({'grades': [dict(r) for r in rows]})

    conn.close()
    return jsonify({'error': 'Method not allowed'}), 405


# ── REMARKS ───────────────────────────────────────────────────────────────────

@app.route('/remarks', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def remarks():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    conn = get_conn()

    if request.method == 'GET':
        rows = conn.execute("""
            SELECT r.id, r.student_id, s.name as student_name, s."group",
                   r.text, r.created_at
            FROM remarks r
            JOIN students s ON s.id = r.student_id
            ORDER BY r.created_at DESC
        """).fetchall()
        conn.close()
        return jsonify({'remarks': [dict(r) for r in rows]})

    if request.method == 'POST':
        body = request.get_json(force=True) or {}
        conn.execute(
            "INSERT INTO remarks (student_id, text) VALUES (?,?)",
            (body['student_id'], body['text'])
        )
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    if request.method == 'PUT':
        body = request.get_json(force=True) or {}
        conn.execute("UPDATE remarks SET text=? WHERE id=?", (body['text'], body['id']))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    if request.method == 'DELETE':
        body = request.get_json(force=True) or {}
        conn.execute("DELETE FROM remarks WHERE id=?", (body['id'],))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    conn.close()
    return jsonify({'error': 'Method not allowed'}), 405


# ── GROUPS ────────────────────────────────────────────────────────────────────

@app.route('/groups', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def groups():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    conn = get_conn()
    resource = request.args.get('type', 'groups')

    if resource == 'hours':
        year = int(request.args.get('year', 2025))
        if request.method == 'GET':
            rows = conn.execute(
                "SELECT id, \"group\", year, plan_hours, fact_hours FROM hours_plan WHERE year=?", (year,)
            ).fetchall()
            conn.close()
            return jsonify({'hours': [dict(r) for r in rows]})
        if request.method == 'PUT':
            body = request.get_json(force=True) or {}
            conn.execute("""
                INSERT INTO hours_plan ("group", year, plan_hours, fact_hours)
                VALUES (?,?,?,?)
                ON CONFLICT("group", year) DO UPDATE SET plan_hours=excluded.plan_hours, fact_hours=excluded.fact_hours
            """, (body['group'], body['year'], body['plan_hours'], body['fact_hours']))
            conn.commit()
            conn.close()
            return jsonify({'ok': True})

    if request.method == 'GET':
        rows = conn.execute("""
            SELECT g.id, g."group", g.enrolled, g.remaining,
                   COUNT(s.id) as student_count
            FROM groups_stat g
            LEFT JOIN students s ON s."group"=g."group" AND (s.expelled=0 OR s.expelled IS NULL)
            GROUP BY g.id, g."group", g.enrolled, g.remaining
            ORDER BY g."group"
        """).fetchall()
        conn.close()
        return jsonify({'groups': [dict(r) for r in rows]})

    if request.method == 'POST':
        body = request.get_json(force=True) or {}
        conn.execute(
            'INSERT OR IGNORE INTO groups_stat ("group", enrolled, remaining) VALUES (?,?,?)',
            (body['group'], body.get('enrolled', 0), body.get('remaining', 0))
        )
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    if request.method == 'PUT':
        body = request.get_json(force=True) or {}
        if body.get('action') == 'rename':
            old, new = body['old_name'], body['new_name']
            conn.execute('UPDATE groups_stat SET "group"=? WHERE "group"=?', (new, old))
            conn.execute('UPDATE students SET "group"=? WHERE "group"=?', (new, old))
            conn.execute('UPDATE hours_plan SET "group"=? WHERE "group"=?', (new, old))
            conn.commit()
            conn.close()
            return jsonify({'ok': True})
        conn.execute(
            'UPDATE groups_stat SET enrolled=?, remaining=? WHERE "group"=?',
            (body['enrolled'], body['remaining'], body['group'])
        )
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    if request.method == 'DELETE':
        body = request.get_json(force=True) or {}
        conn.execute('DELETE FROM groups_stat WHERE "group"=?', (body['group'],))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    conn.close()
    return jsonify({'error': 'Method not allowed'}), 405


if __name__ == '__main__':
    init_db()
    print("✓ База данных инициализирована")
    print("✓ Сервер запущен: http://localhost:8787")
    app.run(host='127.0.0.1', port=8787, debug=False)

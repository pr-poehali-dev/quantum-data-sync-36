INSERT INTO admins (username, password_hash) VALUES ('admin', 'admin123') ON CONFLICT (username) DO NOTHING;
INSERT INTO students (name, "group") VALUES ('Алина Смирнова', '11А'), ('Дмитрий Козлов', '11А'), ('Мария Петрова', '11Б'), ('Артём Новиков', '11Б'), ('Екатерина Фёдорова', '10А'), ('Иван Морозов', '10А'), ('Ольга Волкова', '10Б'), ('Сергей Лебедев', '10Б') ON CONFLICT DO NOTHING;

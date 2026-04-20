CREATE TABLE IF NOT EXISTS retakes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  month VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  attempt INTEGER NOT NULL CHECK (attempt IN (1,2,3)),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  UNIQUE(student_id, month, year, attempt)
);

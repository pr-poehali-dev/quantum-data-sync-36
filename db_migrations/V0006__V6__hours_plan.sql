CREATE TABLE IF NOT EXISTS hours_plan (
  id SERIAL PRIMARY KEY,
  "group" VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL DEFAULT 2025,
  plan_hours INTEGER NOT NULL DEFAULT 0,
  fact_hours INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE("group", year)
);

INSERT INTO hours_plan ("group", year, plan_hours, fact_hours)
VALUES ('10А', 2025, 0, 0), ('10Б', 2025, 0, 0), ('11А', 2025, 0, 0), ('11Б', 2025, 0, 0)
ON CONFLICT ("group", year) DO NOTHING;

const URLS = {
  auth: 'https://functions.poehali.dev/2898c68e-1cb8-4052-b336-c63380540184',
  grades: 'https://functions.poehali.dev/573d36b0-7035-4966-9cc2-4f0dd28de835',
  students: 'https://functions.poehali.dev/e463755e-48b0-432b-8c2c-03150bb6b680',
  remarks: 'https://functions.poehali.dev/d3678517-7c39-450d-80ff-f9f8d95f76df',
}

export async function apiLogin(username: string, password: string) {
  const r = await fetch(URLS.auth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return r.json()
}

export async function apiGetStudents() {
  const r = await fetch(URLS.students)
  const data = await r.json()
  return data.students as Student[]
}

export async function apiAddStudent(name: string, group: string) {
  const r = await fetch(URLS.students, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, group }),
  })
  return r.json()
}

export async function apiUpdateStudent(id: number, name: string, group: string) {
  const r = await fetch(URLS.students, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, group }),
  })
  return r.json()
}

export async function apiUpdateGrade(student_id: number, month: string, year: number, score: number) {
  const r = await fetch(URLS.grades, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, month, year, score }),
  })
  return r.json()
}

export interface Grade {
  month: string
  year: number
  score: number
}

export interface Student {
  id: number
  name: string
  group: string
  average: number
  grades: Grade[]
}

export interface Remark {
  id: number
  student_id: number
  student_name: string
  group: string
  text: string
  created_at: string
}

export async function apiGetRemarks() {
  const r = await fetch(URLS.remarks)
  const data = await r.json()
  return data.remarks as Remark[]
}

export async function apiAddRemark(student_id: number, text: string) {
  const r = await fetch(URLS.remarks, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, text }),
  })
  return r.json()
}
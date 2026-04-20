const URLS = {
  auth: 'https://functions.poehali.dev/2898c68e-1cb8-4052-b336-c63380540184',
  grades: 'https://functions.poehali.dev/573d36b0-7035-4966-9cc2-4f0dd28de835',
  students: 'https://functions.poehali.dev/e463755e-48b0-432b-8c2c-03150bb6b680',
  remarks: 'https://functions.poehali.dev/d3678517-7c39-450d-80ff-f9f8d95f76df',
  groups: 'https://functions.poehali.dev/808d17c9-0a41-49e5-9530-c12682963007',
}

export async function apiLogin(username: string, password: string) {
  const r = await fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
  return r.json()
}

export async function apiGetStudents() {
  const r = await fetch(URLS.students)
  const data = await r.json()
  return data.students as Student[]
}

export async function apiGetExpelled() {
  const r = await fetch(URLS.students + '?expelled=true')
  const data = await r.json()
  return data.expelled as ExpelledStudent[]
}

export async function apiAddStudent(name: string, group: string) {
  const r = await fetch(URLS.students, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, group }) })
  return r.json()
}

export async function apiUpdateStudent(id: number, name: string, group: string) {
  const r = await fetch(URLS.students, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name, group, action: 'update' }) })
  return r.json()
}

export async function apiExpelStudent(id: number, expel_comment: string) {
  const r = await fetch(URLS.students, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'expel', expel_comment }) })
  return r.json()
}

export async function apiRestoreStudent(id: number) {
  const r = await fetch(URLS.students, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'restore' }) })
  return r.json()
}

export async function apiUpdateGrade(student_id: number, month: string, year: number, score: number) {
  const r = await fetch(URLS.grades, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id, month, year, score }) })
  return r.json()
}

export async function apiGetRemarks() {
  const r = await fetch(URLS.remarks)
  const data = await r.json()
  return data.remarks as Remark[]
}

export async function apiAddRemark(student_id: number, text: string) {
  const r = await fetch(URLS.remarks, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id, text }) })
  return r.json()
}

export async function apiUpdateRemark(id: number, text: string) {
  const r = await fetch(URLS.remarks, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, text }) })
  return r.json()
}

export async function apiDeleteRemark(id: number) {
  const r = await fetch(URLS.remarks, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  return r.json()
}

export async function apiGetGroups() {
  const r = await fetch(URLS.groups)
  const data = await r.json()
  return data.groups as GroupStat[]
}

export async function apiAddGroup(group: string, enrolled: number, remaining: number) {
  const r = await fetch(URLS.groups, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group, enrolled, remaining }) })
  return r.json()
}

export async function apiUpdateGroup(group: string, enrolled: number, remaining: number) {
  const r = await fetch(URLS.groups, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group, enrolled, remaining }) })
  return r.json()
}

export async function apiRenameGroup(old_name: string, new_name: string) {
  const r = await fetch(URLS.groups, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rename', old_name, new_name }) })
  return r.json()
}

export async function apiDeleteGroup(group: string) {
  const r = await fetch(URLS.groups, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group }) })
  return r.json()
}

export async function apiDeleteStudent(id: number) {
  const r = await fetch(URLS.students, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  return r.json()
}

export interface HoursPlan {
  id: number; group: string; year: number; plan_hours: number; fact_hours: number
}

export async function apiGetHours(year = 2025) {
  const r = await fetch(`${URLS.groups}?type=hours&year=${year}`)
  const data = await r.json()
  return data.hours as HoursPlan[]
}

export async function apiUpdateHours(group: string, year: number, plan_hours: number, fact_hours: number) {
  const r = await fetch(`${URLS.groups}?type=hours`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group, year, plan_hours, fact_hours }) })
  return r.json()
}

export interface Grade { month: string; year: number; score: number; best_score?: number }

export interface Retake { id: number; student_id: number; month: string; year: number; attempt: number; score: number }

export async function apiGetRetakes(student_id: number) {
  const r = await fetch(`${URLS.grades}?type=retakes&student_id=${student_id}`)
  const data = await r.json()
  return data.retakes as Retake[]
}

export async function apiUpdateRetake(student_id: number, month: string, year: number, attempt: number, score: number) {
  const r = await fetch(`${URLS.grades}?type=retakes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id, month, year, attempt, score }) })
  return r.json()
}

export interface Student {
  id: number; name: string; group: string; average: number; grades: Grade[]
}

export interface ExpelledStudent {
  id: number; name: string; group: string; expel_comment: string; expel_date: string
}

export interface Remark {
  id: number; student_id: number; student_name: string; group: string; text: string; created_at: string
}

export interface GroupStat {
  id: number; group: string; enrolled: number; remaining: number; student_count?: number
}
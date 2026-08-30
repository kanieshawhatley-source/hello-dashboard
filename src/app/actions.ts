'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSql } from '@/lib/db';
import { todayISO } from '@/lib/dates';
import {
  COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  isValidPassword,
} from '@/lib/auth';
import type { Priority } from '@/lib/types';

/** Every page reads from the same tables, so refresh all of them after a write. */
function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/tasks');
  revalidatePath('/habits');
}

function readTitle(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? '').trim();
  if (!value) throw new Error('Title cannot be empty.');
  if (value.length > 200) throw new Error('Title is too long (200 characters max).');
  return value;
}

function readPriority(formData: FormData): Priority {
  const value = Number(formData.get('priority'));
  return ([1, 2, 3] as const).includes(value as Priority) ? (value as Priority) : 2;
}

function readDueDate(formData: FormData): string | null {
  const value = String(formData.get('dueDate') ?? '').trim();
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Due date must be YYYY-MM-DD.');
  return value;
}

function readId(value: FormDataEntryValue | null): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid id.');
  return id;
}

export async function createTask(formData: FormData) {
  const sql = getSql();
  const title = readTitle(formData, 'title');
  const notes = String(formData.get('notes') ?? '').trim() || null;

  await sql`
    insert into tasks (title, notes, priority, due_date)
    values (${title}, ${notes}, ${readPriority(formData)}, ${readDueDate(formData)}::date)
  `;

  revalidateAll();
}

export async function setTaskCompletion(formData: FormData) {
  const sql = getSql();
  const id = readId(formData.get('id'));
  // The checkbox is absent from the payload when unchecked.
  const completed = formData.get('completed') === 'true';

  await sql`
    update tasks
    set completed_at = ${completed ? new Date().toISOString() : null}::timestamptz
    where id = ${id}
  `;

  revalidateAll();
}

export async function deleteTask(formData: FormData) {
  const sql = getSql();
  await sql`delete from tasks where id = ${readId(formData.get('id'))}`;
  revalidateAll();
}

export async function createHabit(formData: FormData) {
  const sql = getSql();
  await sql`insert into habits (name) values (${readTitle(formData, 'name')})`;
  revalidateAll();
}

export async function toggleHabitToday(formData: FormData) {
  const sql = getSql();
  const id = readId(formData.get('id'));
  const today = todayISO();
  const done = formData.get('done') === 'true';

  if (done) {
    // Re-checking a habit already logged today must not error.
    await sql`
      insert into habit_entries (habit_id, entry_date)
      values (${id}, ${today}::date)
      on conflict (habit_id, entry_date) do nothing
    `;
  } else {
    await sql`delete from habit_entries where habit_id = ${id} and entry_date = ${today}::date`;
  }

  revalidateAll();
}

export async function deleteHabit(formData: FormData) {
  const sql = getSql();
  // habit_entries cascades on delete, so the history goes with it.
  await sql`delete from habits where id = ${readId(formData.get('id'))}`;
  revalidateAll();
}

export async function logIn(formData: FormData) {
  const password = String(formData.get('password') ?? '');

  if (!(await isValidPassword(password))) {
    redirect('/login?error=1');
  }

  cookies().set(COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });

  redirect('/');
}

export async function logOut() {
  cookies().delete(COOKIE_NAME);
  redirect('/login');
}

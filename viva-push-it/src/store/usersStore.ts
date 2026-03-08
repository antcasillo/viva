import type { User } from '../types/database';
import { mockUsers } from '../data/mockData';

const DEFAULT_PASSWORD = 'user123';
const INITIAL_CREDENTIALS: Record<string, string> = {
  'admin@vivapush.it': 'admin123',
  'genitore.bianchi@gmail.com': 'user123',
  'anna.verdi@email.it': 'user123',
  'marco.neri@outlook.com': 'user123',
  'laura.gialli@gmail.com': 'user123',
  'paolo.rossi@email.it': 'user123',
};

let users: User[] = [...mockUsers];
let credentials: Record<string, string> = { ...INITIAL_CREDENTIALS };

export function getUsers(): User[] {
  return [...users];
}

export function getUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function checkPassword(email: string, password: string): boolean {
  return credentials[email.toLowerCase()] === password;
}

export function addUser(user: Omit<User, 'id' | 'createdAt'>, password: string = DEFAULT_PASSWORD): User {
  const id = 'user-' + Date.now();
  const created = { ...user, id, createdAt: new Date().toISOString() };
  users.push(created);
  credentials[user.email.toLowerCase()] = password;
  return created;
}

export function updateUser(id: string, updates: Partial<User>): void {
  users = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
}

export function setUserPassword(id: string, newPassword: string): void {
  const u = users.find((x) => x.id === id);
  if (u) credentials[u.email.toLowerCase()] = newPassword;
}

export function deleteUser(id: string): void {
  const u = users.find((x) => x.id === id);
  if (u) delete credentials[u.email.toLowerCase()];
  users = users.filter((u) => u.id !== id);
}

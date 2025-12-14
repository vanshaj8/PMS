import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export class Database {
  private static instance: Database;
  private initialized = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async initialize() {
    if (this.initialized) return;
    await ensureDataDir();
    this.initialized = true;
  }

  private getFilePath(collection: string): string {
    return path.join(DATA_DIR, `${collection}.json`);
  }

  async read<T>(collection: string): Promise<T[]> {
    await this.initialize();
    const filePath = this.getFilePath(collection);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async write<T>(collection: string, data: T[]): Promise<void> {
    await this.initialize();
    const filePath = this.getFilePath(collection);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async findById<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
    const items = await this.read<T>(collection);
    return items.find(item => item.id === id) || null;
  }

  async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
    const items = await this.read<T>(collection);
    items.push(item);
    await this.write(collection, items);
    return item;
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.read<T>(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(collection, items);
    return items[index];
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const items = await this.read<any>(collection);
    const filtered = items.filter((item: any) => item.id !== id);
    if (filtered.length === items.length) return false;
    await this.write(collection, filtered);
    return true;
  }

  async find<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.read<T>(collection);
    return items.filter(predicate);
  }
}

export const db = Database.getInstance();


import { v4 as uuidv4 } from 'uuid';
import { db } from '../utils/database.js';
import { hashPassword } from '../utils/auth.js';
import { User, UserRole } from '../types/index.js';

export class UserService {
  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department?: string;
    location?: string;
    managerId?: string;
    hrbpId?: string;
  }): Promise<User> {
    const existing = await db.find<User>('users', u => u.email === data.email);
    if (existing.length > 0) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const now = new Date().toISOString();

    const user: User = {
      id: uuidv4(),
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      department: data.department,
      location: data.location,
      managerId: data.managerId,
      hrbpId: data.hrbpId,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    return await db.create('users', user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await db.find<User>('users', u => u.email.toLowerCase() === email.toLowerCase());
    return users[0] || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return await db.findById<User>('users', id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    return await db.update<User>('users', id, updates);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.read<User>('users');
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.find<User>('users', u => u.role === role && u.isActive);
  }

  async initializeDefaultUsers(): Promise<void> {
    const users = await db.read<User>('users');
    if (users.length > 0) return; // Already initialized

    const defaultUsers = [
      {
        email: 'admin@pip.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as UserRole,
      },
      {
        email: 'manager@pip.com',
        password: 'manager123',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager' as UserRole,
      },
      {
        email: 'employee@pip.com',
        password: 'employee123',
        firstName: 'Employee',
        lastName: 'User',
        role: 'employee' as UserRole,
      },
      {
        email: 'hrbp@pip.com',
        password: 'hrbp123',
        firstName: 'HRBP',
        lastName: 'User',
        role: 'hrbp' as UserRole,
      },
      {
        email: 'executive@pip.com',
        password: 'executive123',
        firstName: 'Executive',
        lastName: 'User',
        role: 'executive' as UserRole,
      },
    ];

    for (const userData of defaultUsers) {
      await this.createUser(userData);
    }
  }
}

export const userService = new UserService();


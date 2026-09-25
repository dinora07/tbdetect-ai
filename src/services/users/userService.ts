import { User, Role } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const userService = {
  async getUsers(search?: string, roleFilter?: string): Promise<User[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter && roleFilter !== 'ALL') params.set('role', roleFilter);
        return await httpClient.get<User[]>(`/users?${params.toString()}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const users = appStorage.getUsers();
    return users.filter((u) => {
      const q = search?.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.clinicName.toLowerCase().includes(q) ||
        (u.specialty && u.specialty.toLowerCase().includes(q));

      const matchesRole = !roleFilter || roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  },

  async getUserById(id: string): Promise<User | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<User>(`/users/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(100);
    return appStorage.getUsers().find((u) => u.id === id);
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newId = `usr_${Date.now().toString(36)}`;
    const newUser: User = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    if (API_CONFIG.useBackendApi) {
      try {
        const res = await httpClient.post<User>('/users', newUser);
        if (res) return res;
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const users = appStorage.getUsers();
    appStorage.setUsers([newUser, ...users]);

    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'USER',
      resourceId: newId,
      details: `Created user account for ${newUser.name} (${newUser.email}), Role: ${newUser.role}`,
    });

    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.put<User>(`/users/${id}`, updates);
      } catch {
        // Fallback
      }
    }

    await delay(180);
    const users = appStorage.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index > -1) {
      const updated: User = {
        ...users[index],
        ...updates,
      };
      // If name or firstName/lastName changed, sync them cleanly
      if (updates.firstName || updates.lastName) {
        updated.name = `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || updated.name;
      }
      users[index] = updated;
      appStorage.setUsers(users);

      await auditService.logEvent({
        action: 'UPDATE',
        resourceType: 'USER',
        resourceId: id,
        details: `Updated user profile/credentials for ${updated.name} (${id})`,
      });

      // Dispatch event so active user session updates live
      window.dispatchEvent(new CustomEvent('tbdetect_user_profile_updated', { detail: updated }));

      return updated;
    }
    return undefined;
  },

  async toggleUserStatus(id: string): Promise<User | undefined> {
    const users = appStorage.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index > -1) {
      const updated: User = {
        ...users[index],
        active: !users[index].active,
      };
      users[index] = updated;
      appStorage.setUsers(users);

      await auditService.logEvent({
        action: 'UPDATE',
        resourceType: 'USER',
        resourceId: id,
        details: `Toggled user status for ${updated.name}: ${updated.active ? 'ACTIVE' : 'DEACTIVATED'}`,
      });

      return updated;
    }
    return undefined;
  },

  async deleteUser(id: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/users/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const users = appStorage.getUsers();
    const target = users.find((u) => u.id === id);
    const filtered = users.filter((u) => u.id !== id);
    appStorage.setUsers(filtered);

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'USER',
        resourceId: id,
        details: `Deleted user credentials for ${target.name} (${target.email})`,
      });
    }

    return filtered.length < users.length;
  },
};

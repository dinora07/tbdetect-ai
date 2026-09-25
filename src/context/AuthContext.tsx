import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { mockUsers } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  role: Role;
  login: (email: string, role?: Role) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: Role) => void;
  loginAsDemo: (role: Role) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  updateAvatar: (newAvatarUrl: string) => void;
  isDoctor: boolean;
  isAdmin: boolean;
  isClinicAdmin: boolean;
  isStaff: boolean;
  isPatient: boolean;
  canManageUsers: boolean;
  canReviewCases: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Dr. Sarah Chen for instant rich clinical experience, or load from localStorage
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tbdetect_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email === mockUsers[0].email || parsed.id === mockUsers[0].id) {
          return { ...mockUsers[0], ...parsed };
        }
        return parsed;
      } catch {
        return mockUsers[0];
      }
    }
    return mockUsers[0]; // Sharipova Dinora
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('tbdetect_jwt') || 'mock-jwt-token-signed-spring-boot';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('tbdetect_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tbdetect_user');
    }
  }, [user]);

  const login = async (email: string, requestedRole?: Role): Promise<boolean> => {
    const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      mockUsers.find((u) => u.role === requestedRole) ||
      mockUsers[0];

    setUser(foundUser);
    const mockJwt = `jwt-header.${btoa(JSON.stringify(foundUser))}.mock-signature`;
    setToken(mockJwt);
    localStorage.setItem('tbdetect_jwt', mockJwt);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tbdetect_user');
    localStorage.removeItem('tbdetect_jwt');
  };

  const switchDemoRole = (targetRole: Role) => {
    const roleUser = mockUsers.find((u) => u.role === targetRole) || {
      ...mockUsers[0],
      role: targetRole,
      name: `Demo ${targetRole}`,
    };
    setUser(roleUser);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      return updated;
    });
  };

  const updateAvatar = (newAvatarUrl: string) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, avatarUrl: newAvatarUrl };
    });
  };

  const currentRole: Role = user?.role || 'DOCTOR';

  const isDoctor = currentRole === 'DOCTOR';
  const isAdmin = currentRole === 'ADMIN';
  const isClinicAdmin = currentRole === 'CLINIC_ADMIN';
  const isStaff = currentRole === 'MEDICAL_STAFF';
  const isPatient = currentRole === 'PATIENT';

  const canManageUsers = isAdmin || isClinicAdmin;
  const canReviewCases = isDoctor || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        token,
        role: currentRole,
        login,
        logout,
        switchDemoRole,
        loginAsDemo: switchDemoRole,
        updateUser,
        updateAvatar,
        isDoctor,
        isAdmin,
        isClinicAdmin,
        isStaff,
        isPatient,
        canManageUsers,
        canReviewCases,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

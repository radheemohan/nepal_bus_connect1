import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: string | null;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('nbc_user');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (name: string) => {
    setUser(name);
    localStorage.setItem('nbc_user', name);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nbc_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

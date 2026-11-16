import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface AuthGuardProps {
  allowedRoles?: string[];
}

interface DecodedToken {
  sub: string;
  papel: string;
  exp: number;
}

function parseToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const token = localStorage.getItem('@HabitOS:token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decoded = parseToken(token);
  if (!decoded) {
    localStorage.removeItem('@HabitOS:token');
    localStorage.removeItem('@HabitOS:user');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(decoded.papel)) {
    // Redireciona para o painel correto caso não tenha acesso a esta rota
    switch (decoded.papel) {
      case 'ROLE_MORADOR':
        return <Navigate to="/app" replace />;
      case 'ROLE_PORTEIRO':
        return <Navigate to="/portaria" replace />;
      case 'ROLE_SUPER_ADMIN':
      case 'ROLE_SINDICO':
      case 'ROLE_ADMIN':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}

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

export function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const token = localStorage.getItem('@CondoEconomy:token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Verifica se o token expirou
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('@CondoEconomy:token');
      localStorage.removeItem('@CondoEconomy:user');
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(decoded.papel)) {
        // Redireciona para o painel correto caso não tenha acesso a esta rota
        switch(decoded.papel) {
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
    }

    return <Outlet />;
  } catch (error) {
    localStorage.removeItem('@CondoEconomy:token');
    localStorage.removeItem('@CondoEconomy:user');
    return <Navigate to="/login" replace />;
  }
}

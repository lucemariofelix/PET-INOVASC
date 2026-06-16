import { useAuth } from "../hooks/useAuth";

export default function RoleGuard({ rolesAllowed, children }) {
  const { usuario } = useAuth();

  if (!usuario) return null;

  if (rolesAllowed.includes(usuario.funcao)) {
    return children;
  }

  return null;
}

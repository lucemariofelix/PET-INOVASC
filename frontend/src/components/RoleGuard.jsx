// Perfis permitidos passados como array. Ex: ['ADMIN', 'RECEPCAO']
export default function RoleGuard({ rolesAllowed, children }) {
  // Pega o usuário logado do localStorage (ajuste a chave se necessário)
  const usuarioString = localStorage.getItem("sgr_usuario");

  if (!usuarioString) return null; // Se não tiver usuário, não renderiza nada

  let usuarioLogado;

  try {
    usuarioLogado = JSON.parse(usuarioString);
  } catch (error) {
    console.error("Erro ao ler usuário do localStorage", error);
    return null;
  }

  const funcaoUser = usuarioLogado.funcao; // Ex: 'ADMIN'

  // Se a função do usuário estiver na lista de permitidos, exibe o conteúdo
  if (rolesAllowed.includes(funcaoUser)) {
    return children;
  }

  // Se não tiver permissão, esconde silenciosamente
  return null;
}

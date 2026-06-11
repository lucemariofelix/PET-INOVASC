const { getSupabaseUsuario } = require("../config/supabase");

exports.verificarPermissao = (rolesPermitidas) => {
  return async (request, reply) => {
    try {
      // 1. Verifica se o React enviou o crachá (Token)
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply
          .status(401)
          .send({ erro: "Token de autenticação ausente." });
      }

      // 2. Usa o Supabase para ler o token e garantir que ele é válido e verdadeiro
      const supabaseClient = getSupabaseUsuario(authHeader);
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        return reply.status(401).send({ erro: "Sessão inválida ou expirada." });
      }

      // 3. Consulta a nossa tabela para ver a função E O NOME do usuário
      const { data: perfil, error: dbError } = await supabaseClient
        .from("perfis_usuarios")
        .select("nome, funcao") // <-- CORREÇÃO: Adicionado o 'nome' aqui na busca
        .eq("id", user.id)
        .single();

      if (dbError || !perfil) {
        return reply
          .status(403)
          .send({ erro: "Perfil não encontrado no banco de dados." });
      }

      // 4. A TRAVA PRINCIPAL: Verifica se a função está na lista VIP da rota
      if (!rolesPermitidas.includes(perfil.funcao)) {
        return reply.status(403).send({
          erro: `Acesso Negado. O perfil ${perfil.funcao} não tem permissão para isso.`,
        });
      }

      // 5. O SEGREDO: Injeta os dados de quem fez o login dentro do request!
      // Assim, qualquer Controller que vier depois consegue saber quem é a pessoa.
      request.user = {
        id: user.id,
        nome: perfil.nome,
        funcao: perfil.funcao,
      };
    } catch (error) {
      request.log.error("Erro no Middleware de Autenticação:", error);
      return reply
        .status(500)
        .send({ erro: "Falha interna na verificação de segurança." });
    }
  };
};

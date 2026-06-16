const { supabase } = require("../config/supabase");

class AuthService {
  async login(email, senha) {
    // 1. Autentica no motor do Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

    if (authError) {
      throw new Error("E-mail ou senha incorretos.");
    }

    // 2. Busca o perfil do usuário para saber a permissão (RECEPCAO, ACS, ADMIN)
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfis_usuarios")
      .select("nome, funcao")
      .eq("id", authData.user.id)
      .single();

    if (perfilError || !perfilData) {
      throw new Error("Perfil de usuário não configurado no sistema.");
    }

    const accessToken = authData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sessão não retornada pelo Supabase Auth.");
    }

    // Retorna o token apenas para o controller gravar no cookie HttpOnly.
    return {
      accessToken,
      expiresIn: authData.session?.expires_in,
      usuario: {
        id: authData.user.id,
        nome: perfilData.nome,
        funcao: perfilData.funcao,
      },
    };
  }
}

module.exports = new AuthService();

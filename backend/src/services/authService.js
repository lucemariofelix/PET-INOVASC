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

    // Retorna os dados essenciais para o Frontend salvar no estado
    return {
      token: authData.session.access_token,
      usuario: {
        id: authData.user.id,
        nome: perfilData.nome,
        funcao: perfilData.funcao,
      },
    };
  }
}

module.exports = new AuthService();

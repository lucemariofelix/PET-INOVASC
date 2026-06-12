const usuarioRepository = require("../repositories/usuarioRepository");
const { supabaseAdmin } = require('../config/supabase'); // Trazendo o cliente com poderes de Admin

class UsuarioService {
  async listar(authHeader) {
    return await usuarioRepository.listarTodos(authHeader);
  }

  async listarACS(authHeader) {
    return await usuarioRepository.listarACS(authHeader);
  }

  async criarUsuario(dados, authHeader) {
    if (!dados.nome || !dados.email || !dados.senha || !dados.funcao) {
      throw new Error("Todos os campos são obrigatórios para criar um usuário.");
    }

    // 1. Cria a conta no Supabase Auth (O cofre oficial)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dados.email.toLowerCase(),
      password: dados.senha,
      email_confirm: true // Pula a etapa de confirmação de email
    });

    if (authError) {
      throw new Error(`Erro ao criar credencial de login: ${authError.message}`);
    }

    // 2. Prepara o payload amarrando o ID oficial do Supabase Auth
    const payload = {
      id: authData.user.id, // Pega o ID gerado pelo cofre!
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      funcao: dados.funcao
      // Não salvamos a senha aqui! O Supabase já cuidou da segurança dela no passo 1.
    };

    try {
      // 3. Salva o perfil na nossa tabela
      return await usuarioRepository.criar(payload, authHeader);
    } catch (dbError) {
      // ROLLBACK: Se o banco falhar, apaga a credencial criada no passo 1
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao salvar perfil: ${dbError.message}`);
    }
  }

  async atualizarUsuario(id, dados, authHeader) {
    if (!id) throw new Error("ID do usuário é obrigatório.");

    const payload = {
      nome: dados.nome,
      email: dados.email?.toLowerCase(),
      funcao: dados.funcao,
    };

    // Se o admin mandou uma senha nova, atualizamos lá no Supabase Auth
    if (dados.senha && dados.senha.trim() !== "") {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: dados.senha
      });
      if (authUpdateError) throw new Error(`Erro ao atualizar senha no sistema: ${authUpdateError.message}`);
    }

    // Nota: Se quiser permitir a mudança de email de login, precisa de um update no auth.admin também, 
    // mas por hora atualizar apenas o perfil e a senha já resolve 99% dos casos da UBS.
    return await usuarioRepository.atualizar(id, payload, authHeader);
  }

  async excluirUsuario(id, authHeader) {
    if (!id) throw new Error("ID do usuário é obrigatório para exclusão.");
    
    // 1. Apaga do nosso banco de dados (perfis_usuarios)
    await usuarioRepository.excluir(id, authHeader);

    // 2. Apaga definitivamente o acesso no Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error("Aviso: Usuário apagado do perfil, mas falhou ao apagar do Auth.", error);
    }
    
    return true;
  }
}

module.exports = new UsuarioService();

const usuarioRepository = require("../repositories/usuarioRepository");
const avatarRepository = require("../repositories/avatarRepository");
const { supabaseAdmin } = require("../config/supabase");
const {
  AppError,
  ValidationError,
  NotFoundError,
} = require("../errors/AppError");

const FUNCOES_PERMITIDAS = new Set(["ADMIN", "RECEPCAO", "ACS"]);

const emailJaCadastrado = (error) => {
  const mensagem = error?.message?.toLowerCase() || "";
  return (
    error?.code === "email_exists" ||
    error?.code === "user_already_exists" ||
    mensagem.includes("already been registered") ||
    mensagem.includes("user already exists") ||
    mensagem.includes("email already")
  );
};

const conflitoEmail = () =>
  new AppError(
    "Este e-mail já está cadastrado.",
    409,
    "EMAIL_ALREADY_REGISTERED",
  );

class UsuarioService {
  validarSupabaseAdmin(metodo = "createUser") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada. Não é possível criar usuários no Auth.");
    }

    if (!supabaseAdmin?.auth?.admin?.[metodo]) {
      throw new Error("Cliente administrativo do Supabase indisponível.");
    }
  }

  async listar(authHeader) {
    return await usuarioRepository.listarTodos(authHeader);
  }

  async listarACS(authHeader) {
    return await usuarioRepository.listarACS(authHeader);
  }

  async criarUsuario(dados, authHeader) {
    if (!dados || typeof dados !== "object") {
      throw new ValidationError("Informe os dados do usuário.");
    }

    const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
    const email =
      typeof dados.email === "string" ? dados.email.trim().toLowerCase() : "";
    const senha = typeof dados.senha === "string" ? dados.senha : "";
    const funcao =
      typeof dados.funcao === "string"
        ? dados.funcao.trim().toUpperCase()
        : "";

    if (!nome || !email || !senha.trim() || !funcao) {
      throw new ValidationError("Todos os campos são obrigatórios para criar um usuário.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new ValidationError("Informe um e-mail válido.");
    }
    if (!FUNCOES_PERMITIDAS.has(funcao)) {
      throw new ValidationError("Função de usuário inválida.");
    }

    this.validarSupabaseAdmin();

    // 1. Cria a conta no Supabase Auth (O cofre oficial)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true // Pula a etapa de confirmação de email
    });

    if (authError) {
      if (emailJaCadastrado(authError)) throw conflitoEmail();
      throw authError;
    }

    const authUserId = authData?.user?.id;
    if (!authUserId) {
      throw new Error("Erro ao criar credencial de login: ID do usuário não retornado pelo Supabase Auth.");
    }

    // 2. Prepara o payload amarrando o ID oficial do Supabase Auth
    const payload = {
      id: authUserId, // Pega o ID gerado pelo cofre!
      nome,
      email,
      funcao
      // Não salvamos a senha aqui! O Supabase já cuidou da segurança dela no passo 1.
    };

    try {
      // 3. Salva o perfil na nossa tabela usando service role para evitar bloqueio por RLS
      return await usuarioRepository.criarComAdmin(payload);
    } catch (dbError) {
      // ROLLBACK: Se o banco falhar, apaga a credencial criada no passo 1
      try {
        const { error: rollbackError } =
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        if (rollbackError) {
          console.error(
            "Falha ao compensar criação de usuário no Auth.",
            rollbackError,
          );
        }
      } catch (rollbackError) {
        console.error(
          "Falha ao compensar criação de usuário no Auth.",
          rollbackError,
        );
      }
      if (dbError?.code === "23505") throw conflitoEmail();
      throw dbError;
    }
  }

  async atualizarUsuario(id, dados, authHeader) {
    if (!id) throw new ValidationError("ID do usuário é obrigatório.");
    if (!dados || typeof dados !== "object") {
      throw new ValidationError("Informe os dados do usuário.");
    }

    const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
    const email =
      typeof dados.email === "string" ? dados.email.trim().toLowerCase() : "";
    const funcao =
      typeof dados.funcao === "string"
        ? dados.funcao.trim().toUpperCase()
        : "";
    if (!nome || !email || !funcao) {
      throw new ValidationError("Nome, e-mail e função são obrigatórios.");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new ValidationError("Informe um e-mail válido.");
    }
    if (!FUNCOES_PERMITIDAS.has(funcao)) {
      throw new ValidationError("Função de usuário inválida.");
    }

    const perfilAnterior = await usuarioRepository.buscarPorId(id, authHeader);
    if (!perfilAnterior) throw new NotFoundError("Usuário não encontrado.");

    const payload = { nome, email, funcao };
    const authPayload = {};
    if (email !== perfilAnterior.email?.trim().toLowerCase()) {
      authPayload.email = email;
      authPayload.email_confirm = true;
    }
    if (typeof dados.senha === "string" && dados.senha.trim()) {
      authPayload.password = dados.senha;
    }
    if (Object.keys(authPayload).length) {
      this.validarSupabaseAdmin("updateUserById");
    }

    let perfilAtualizado;
    try {
      perfilAtualizado = await usuarioRepository.atualizar(id, payload, authHeader);
    } catch (error) {
      if (error?.code === "23505") throw conflitoEmail();
      throw error;
    }

    if (Object.keys(authPayload).length) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(id, authPayload);
      if (authUpdateError) {
        try {
          await usuarioRepository.atualizar(
            id,
            {
              nome: perfilAnterior.nome,
              email: perfilAnterior.email,
              funcao: perfilAnterior.funcao,
            },
            authHeader,
          );
        } catch (rollbackError) {
          console.error("Falha ao restaurar perfil após erro no Auth.", rollbackError);
        }
        if (emailJaCadastrado(authUpdateError)) throw conflitoEmail();
        throw authUpdateError;
      }
    }

    return perfilAtualizado;
  }

  async excluirUsuario(id, authHeader) {
    if (!id) throw new ValidationError("ID do usuário é obrigatório para exclusão.");

    this.validarSupabaseAdmin("deleteUser");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    const authJaAusente =
      error?.code === "user_not_found" ||
      error?.status === 404 ||
      error?.message?.toLowerCase().includes("user not found");
    if (error && !authJaAusente) throw error;

    await usuarioRepository.excluir(id, authHeader);
    try {
      await avatarRepository.removerComAdmin(id);
    } catch (errorAvatar) {
      console.error("Falha ao remover avatar do usuário excluído.", errorAvatar);
    }
    return true;
  }
}

module.exports = new UsuarioService();

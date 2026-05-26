const { getSupabaseUsuario, supabase } = require("../config/supabase");

class PacienteRepository {
  // CRIAR
  async criar(dadosPaciente, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes")
      .insert([dadosPaciente])
      .select();

    if (error) throw error;

    return data[0];
  }

  // LISTAR
  async listarTodos(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes")
      .select(
        `
        *,
        consultas (
          data_proxima_consulta,
          tipo_profissional,
          status_consulta
        )
      `,
      )
      .order("created_at", { ascending: false });
    if (error) throw error;

    return data;
  }

  // ATUALIZAR (NOVO)
  async atualizar(id, dadosPaciente, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes")
      .update({
        nome_completo: dadosPaciente.nome_completo,
        cpf_cns: dadosPaciente.cpf_cns,
        data_nascimento: dadosPaciente.data_nascimento,
        telefone: dadosPaciente.telefone || null,
        endereco: dadosPaciente.endereco || null,
        acs: dadosPaciente.acs || null,
        condicao: dadosPaciente.condicao
          ? dadosPaciente.condicao.toUpperCase()
          : null,
        updated_at: new Date().toISOString(), // Auditoria
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    // Se o banco não retornou nenhuma linha, o ID não existe
    if (!data || data.length === 0) {
      throw new Error("Paciente não encontrado para atualização.");
    }

    return data[0];
  }
}

module.exports = new PacienteRepository();

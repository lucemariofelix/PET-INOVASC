const { getSupabaseUsuario } = require("../config/supabase");

class GrupoAcompanhamentoRepository {
  async listarTodos(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("grupos_acompanhamento")
      .select("id, nome, descricao, criado_em")
      .order("nome", { ascending: true });

    if (error) throw error;
    return data;
  }

  async criar(dadosGrupo, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("grupos_acompanhamento")
      .insert([dadosGrupo])
      .select("id, nome, descricao, criado_em");

    if (error) throw error;
    return data[0];
  }

  async listarPacientesDoGrupo(grupoId, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes_grupos")
      .select(
        `
          paciente_id,
          pacientes!pacientes_grupos_paciente_id_fkey (
            id,
            telefone
          )
        `,
      )
      .eq("grupo_id", grupoId);

    if (error) throw error;

    return (data || [])
      .map((vinculo) => vinculo.pacientes)
      .filter((paciente) => Boolean(paciente));
  }
}

module.exports = new GrupoAcompanhamentoRepository();

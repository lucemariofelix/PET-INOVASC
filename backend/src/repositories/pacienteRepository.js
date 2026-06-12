const { getSupabaseUsuario } = require("../config/supabase");

const SELECT_PACIENTE_COMPLETO = `
  *,
  agente:perfis_usuarios!pacientes_agente_id_fkey (
    id,
    nome,
    funcao
  ),
  pacientes_grupos (
    id,
    grupos_acompanhamento (
      id,
      nome,
      descricao
    )
  ),
  consultas (
    data_proxima_consulta,
    tipo_profissional,
    status_consulta
  )
`;

class PacienteRepository {
  // CRIAR
  async criar(dadosPaciente, gruposIds, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes")
      .insert([dadosPaciente])
      .select();

    if (error) throw error;

    const paciente = data[0];
    await this.sincronizarGrupos(supabaseClient, paciente.id, gruposIds);

    return await this.buscarPorId(paciente.id, authHeader);
  }

  // LISTAR
  async listarTodos(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes")
      .select(SELECT_PACIENTE_COMPLETO)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return data;
  }

  async filtrar(filtros, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { grupo_id, agente_id } = filtros;
    let pacienteIds = null;

    if (grupo_id) {
      const { data: vinculos, error: erroVinculos } = await supabaseClient
        .from("pacientes_grupos")
        .select("paciente_id")
        .eq("grupo_id", grupo_id);

      if (erroVinculos) throw erroVinculos;

      pacienteIds = [...new Set(vinculos.map((vinculo) => vinculo.paciente_id))];

      if (pacienteIds.length === 0) {
        return [];
      }
    }

    let query = supabaseClient
      .from("pacientes")
      .select(SELECT_PACIENTE_COMPLETO)
      .order("created_at", { ascending: false });

    if (agente_id) {
      query = query.eq("agente_id", agente_id);
    }

    if (pacienteIds) {
      query = query.in("id", pacienteIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  async buscarPorId(id, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes")
      .select(SELECT_PACIENTE_COMPLETO)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async buscarAgenteACSPorId(id, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("perfis_usuarios")
      .select("id, nome, funcao")
      .eq("id", id)
      .eq("funcao", "ACS")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async sincronizarGrupos(supabaseClient, pacienteId, gruposIds) {
    if (gruposIds === undefined) {
      return;
    }

    const { error: erroDelete } = await supabaseClient
      .from("pacientes_grupos")
      .delete()
      .eq("paciente_id", pacienteId);

    if (erroDelete) throw erroDelete;

    if (gruposIds.length === 0) {
      return;
    }

    const vinculos = gruposIds.map((grupoId) => ({
      paciente_id: pacienteId,
      grupo_id: grupoId,
    }));

    const { error: erroInsert } = await supabaseClient
      .from("pacientes_grupos")
      .insert(vinculos);

    if (erroInsert) throw erroInsert;
  }

  // ATUALIZAR (NOVO)
  async atualizar(id, dadosPaciente, gruposIds, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("pacientes")
      .update({
        ...dadosPaciente,
        updated_at: new Date().toISOString(), // Auditoria
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    // Se o banco não retornou nenhuma linha, o ID não existe
    if (!data || data.length === 0) {
      throw new Error("Paciente não encontrado para atualização.");
    }

    await this.sincronizarGrupos(supabaseClient, id, gruposIds);

    return await this.buscarPorId(id, authHeader);
  }
}

module.exports = new PacienteRepository();

import { useEffect } from "react";

export function useHistoricoMensagensRealtime(setConsultas) {
  useEffect(() => {
    let supabaseClient = null;
    let canalRealtime = null;
    let ativo = true;

    const assinarRealtime = async () => {
      const { supabase } = await import("../api/supabase.js");
      if (!ativo) return;

      supabaseClient = supabase;
      canalRealtime = supabase
        .channel("mudancas-status-whatsapp")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "historico_mensagens",
          },
          (payload) => {
            const msgAtualizada = payload.new;

            setConsultas((consultasAtuais) =>
              consultasAtuais.map((consulta) => {
                if (
                  consulta.id === msgAtualizada.consulta_id ||
                  consulta.pacientes?.id === msgAtualizada.paciente_id
                ) {
                  const historico = [...(consulta.historico_mensagens || [])];
                  const msgIndex = historico.findIndex(
                    (m) => m.mensagem_id === msgAtualizada.mensagem_id,
                  );

                  if (msgIndex !== -1) {
                    historico[msgIndex] = {
                      ...historico[msgIndex],
                      status: msgAtualizada.status,
                    };
                  } else if (historico.length > 0) {
                    historico[0] = {
                      ...historico[0],
                      status: msgAtualizada.status,
                    };
                  }

                  return { ...consulta, historico_mensagens: historico };
                }
                return consulta;
              }),
            );
          },
        )
        .subscribe();
    };

    assinarRealtime();

    return () => {
      ativo = false;
      if (supabaseClient && canalRealtime) {
        supabaseClient.removeChannel(canalRealtime);
      }
    };
  }, [setConsultas]);
}

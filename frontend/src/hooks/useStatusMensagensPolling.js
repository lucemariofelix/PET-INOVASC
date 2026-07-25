import { useEffect } from "react";
import { mensageriaApi } from "../api/mensageria";

const INTERVALO_PADRAO = 10_000;

export function useStatusMensagensPolling(
  consultaIds,
  aoAtualizar,
  intervaloMs = INTERVALO_PADRAO,
) {
  const chaveConsultaIds = [...new Set(consultaIds.filter(Boolean))]
    .sort()
    .join(",");

  useEffect(() => {
    if (!chaveConsultaIds) return undefined;

    let ativo = true;
    let requisicaoAtual = null;
    let consultando = false;

    const consultar = async () => {
      if (
        !ativo ||
        consultando ||
        (typeof document !== "undefined" && document.hidden)
      ) {
        return;
      }

      consultando = true;
      requisicaoAtual = new AbortController();

      try {
        const resposta = await mensageriaApi.getStatusMensagens(
          chaveConsultaIds.split(","),
          { signal: requisicaoAtual.signal },
        );
        if (ativo) aoAtualizar(resposta.mensagens || []);
      } catch (erro) {
        if (erro.name !== "AbortError") {
          console.error("Erro ao atualizar status das mensagens:", erro);
        }
      } finally {
        consultando = false;
        requisicaoAtual = null;
      }
    };

    const retomar = () => {
      if (typeof document === "undefined" || !document.hidden) consultar();
    };

    consultar();
    const intervalo = window.setInterval(consultar, intervaloMs);
    window.addEventListener("focus", retomar);
    document.addEventListener("visibilitychange", retomar);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("focus", retomar);
      document.removeEventListener("visibilitychange", retomar);
      requisicaoAtual?.abort();
    };
  }, [aoAtualizar, chaveConsultaIds, intervaloMs]);
}

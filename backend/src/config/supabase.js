require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 👇 BLOCO DE DIAGNÓSTICO CORRIGIDO 👇
console.log("=== TESTE DE CREDENCIAIS ===");
console.log("URL carregada:", supabaseUrl);
// CORREÇÃO: Trocado supabaseKey por supabaseAnonKey
console.log("Chave carregada:", supabaseAnonKey ? "Chave encontrada! ✅" : "Indefinida/Vazia ❌");

// Cliente padrão para rotas públicas (como a de fazer login)
const supabasePadrao = createClient(supabaseUrl, supabaseAnonKey);

// NOVO: Função que injeta o token do usuário de forma segura por requisição
const getSupabaseUsuario = (authHeader) => {
  if (!authHeader) return supabasePadrao;

  // Cria um cliente temporário e isolado para esta requisição com o JWT do usuário
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader // Repassa o 'Bearer eyJ...' vindo do frontend
      }
    }
  });
};

module.exports = {
  supabase: supabasePadrao,
  getSupabaseUsuario
};
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de serviço (Service Role)

// Cliente padrão para rotas públicas (como a de fazer login)
const supabasePadrao = createClient(supabaseUrl, supabaseAnonKey);

// NOVO: Cliente com poderes administrativos (Bypass RLS e Gerenciamento do Auth de usuários)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Função que injeta o token do usuário de forma segura por requisição (Garante RLS ativo)
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
  supabaseAdmin, // Exportado para uso no seu usuarioService
  getSupabaseUsuario
};

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Cria a conexão
const supabase = createClient(supabaseUrl, supabaseKey);

// Exporta para ser usado em qualquer lugar do projeto
module.exports = supabase;
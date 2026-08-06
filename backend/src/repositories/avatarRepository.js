const { getSupabaseUsuario, supabaseAdmin } = require("../config/supabase");

const BUCKET_AVATARS = "avatars";

class AvatarRepository {
  async salvar(usuarioId, buffer, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const caminho = `${usuarioId}/avatar.webp`;
    const { error } = await supabaseClient.storage
      .from(BUCKET_AVATARS)
      .upload(caminho, buffer, {
        cacheControl: "3600",
        contentType: "image/webp",
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabaseClient.storage
      .from(BUCKET_AVATARS)
      .getPublicUrl(caminho);
    if (!data?.publicUrl) {
      throw new Error("Supabase Storage não retornou a URL pública do avatar.");
    }
    return data.publicUrl;
  }

  async atualizarPerfil(avatarUrl, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient.rpc(
      "atualizar_avatar_proprio",
      { p_avatar_url: avatarUrl },
    );

    if (error) throw error;
    return data;
  }

  async removerComAdmin(usuarioId) {
    if (!supabaseAdmin?.storage) return;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_AVATARS)
      .remove([`${usuarioId}/avatar.webp`]);
    if (error) throw error;
  }
}

module.exports = new AvatarRepository();

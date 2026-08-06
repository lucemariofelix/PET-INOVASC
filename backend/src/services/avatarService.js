const avatarRepository = require("../repositories/avatarRepository");
const { AppError } = require("../errors/AppError");

const LIMITE_AVATAR_BYTES = 200 * 1024;

const erroAvatar = (mensagem, statusCode, code) =>
  new AppError(mensagem, statusCode, code);

const possuiAssinaturaWebp = (buffer) =>
  buffer.length >= 12 &&
  buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
  buffer.subarray(8, 12).toString("ascii") === "WEBP";

class AvatarService {
  async atualizarAvatar({ arquivo, usuarioId, authHeader }) {
    if (!arquivo || arquivo.fieldname !== "avatar") {
      throw erroAvatar("Envie a imagem no campo avatar.", 400, "AVATAR_REQUIRED");
    }

    const nomeArquivo = arquivo.filename?.toLowerCase() || "";
    if (arquivo.mimetype !== "image/webp" || !nomeArquivo.endsWith(".webp")) {
      throw erroAvatar(
        "A foto deve estar no formato WebP.",
        415,
        "UNSUPPORTED_AVATAR_TYPE",
      );
    }

    const buffer = await arquivo.toBuffer();
    if (!buffer.length) {
      throw erroAvatar("A imagem enviada está vazia.", 400, "AVATAR_REQUIRED");
    }
    if (buffer.length > LIMITE_AVATAR_BYTES) {
      throw erroAvatar(
        "A foto deve ter no máximo 200 KB.",
        413,
        "AVATAR_TOO_LARGE",
      );
    }
    if (!possuiAssinaturaWebp(buffer)) {
      throw erroAvatar(
        "O conteúdo enviado não é uma imagem WebP válida.",
        415,
        "UNSUPPORTED_AVATAR_TYPE",
      );
    }

    const urlPublica = await avatarRepository.salvar(
      usuarioId,
      buffer,
      authHeader,
    );
    const avatarUrl = `${urlPublica}?v=${Date.now()}`;
    await avatarRepository.atualizarPerfil(avatarUrl, authHeader);
    return avatarUrl;
  }
}

module.exports = new AvatarService();

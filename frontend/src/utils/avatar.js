export const TIPOS_AVATAR_ACEITOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const OPCOES_COMPRESSAO_AVATAR = Object.freeze({
  maxSizeMB: 0.15,
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: "image/webp",
});

export const comprimirAvatar = async (arquivo, compressor) => {
  if (!arquivo || !TIPOS_AVATAR_ACEITOS.has(arquivo.type)) {
    throw new Error("Selecione uma imagem JPEG, PNG ou WebP.");
  }

  const comprimido = await compressor(arquivo, OPCOES_COMPRESSAO_AVATAR);
  return new File([comprimido], "avatar.webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
};

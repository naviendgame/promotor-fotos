import { SEM_CATEGORIA } from "../constants/categorias-foto";
import type { Foto } from "../types/foto";
import { obterData } from "./datas";

export function obterImagemUri(foto: Pick<Foto, "imagemBase64" | "imagemUrl">) {
  return foto.imagemUrl || foto.imagemBase64 || "";
}

export function obterCategoriaFoto(foto: Pick<Foto, "categoria">) {
  return foto.categoria || SEM_CATEGORIA;
}

export function obterRotuloVisita(
  foto: Pick<Foto, "visitaId" | "indiceNaVisita" | "totalFotosVisita">,
) {
  if (!foto.visitaId) return "";

  const indice = foto.indiceNaVisita || 1;
  const total = foto.totalFotosVisita || 1;
  return `Visita ${indice}/${total}`;
}

export function ordenarFotosRecentes<T extends Pick<Foto, "criadoEm">>(
  fotos: T[],
) {
  return [...fotos].sort(
    (a, b) =>
      (obterData(b.criadoEm)?.getTime() || 0) -
      (obterData(a.criadoEm)?.getTime() || 0),
  );
}

export function obterIdsFotosSubstituidas(fotos: Pick<Foto, "id" | "naLixeira" | "refacaoDeId">[]) {
  return new Set(
    fotos
      .filter((foto) => foto.naLixeira !== true)
      .map((foto) => foto.refacaoDeId)
      .filter(Boolean),
  );
}

export function filtrarFotosAtuais<T extends Pick<Foto, "id" | "naLixeira" | "refacaoDeId">>(
  fotos: T[],
) {
  const idsSubstituidos = obterIdsFotosSubstituidas(fotos);

  return fotos.filter(
    (foto) => foto.naLixeira !== true && !idsSubstituidos.has(foto.id),
  );
}

export function filtrarFotosNaLixeira<T extends Pick<Foto, "naLixeira">>(
  fotos: T[],
) {
  return fotos.filter((foto) => foto.naLixeira === true);
}

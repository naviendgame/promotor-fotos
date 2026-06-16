import * as ImageManipulator from "expo-image-manipulator";

export const LIMITE_FIRESTORE_STRING = 900_000;

export async function prepararImagemBase64(uri: string) {
  const tentativas = [
    { width: 1000, compress: 0.45 },
    { width: 800, compress: 0.35 },
    { width: 640, compress: 0.28 },
  ];

  for (const tentativa of tentativas) {
    const resultado = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: tentativa.width } }],
      {
        base64: true,
        compress: tentativa.compress,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    const imagemBase64 = resultado.base64 || "";
    const imagemFormatada = `data:image/jpeg;base64,${imagemBase64}`;

    if (imagemFormatada.length <= LIMITE_FIRESTORE_STRING) {
      return imagemFormatada;
    }
  }

  throw new Error(
    "A foto ainda ficou muito grande. Tente tirar a foto mais longe ou com menos detalhes.",
  );
}

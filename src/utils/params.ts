export function primeiroParametro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

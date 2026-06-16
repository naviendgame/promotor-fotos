export function obterData(valor: any) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor.toDate === "function") return valor.toDate();

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function mesmaData(data: Date, comparacao: Date) {
  return (
    data.getDate() === comparacao.getDate() &&
    data.getMonth() === comparacao.getMonth() &&
    data.getFullYear() === comparacao.getFullYear()
  );
}

export function ehHoje(valor: any) {
  const data = obterData(valor);
  return data ? mesmaData(data, new Date()) : false;
}

export function formatarDataHora(valor: any, fallback = "Data não disponível") {
  return obterData(valor)?.toLocaleString("pt-BR") || fallback;
}

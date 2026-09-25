import ctbData from "./ctb-data.json";

export const CTB_OFFICIAL_URL = "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-senatran/resolucoes-contran";
export const CTB_LEI_URL = "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm";
export const CTB_UPDATED_AT = "25/09/2026";
export const CTB_FINE_RECORDS = ctbData;

export function formatFineAmount(amount) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

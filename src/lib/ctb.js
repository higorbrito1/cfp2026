// Referência: Lei nº 9.503/1997 (CTB) em sua versão compilada no Planalto.
// Esta lista prioriza infrações recorrentes para consulta rápida no app.
export const CTB_OFFICIAL_URL = "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm";
export const CTB_UPDATED_AT = "25/09/2026";

export const CTB_FINE_RECORDS = [
  { article: "Art. 165", title: "Dirigir sob a influência de álcool", severity: "Gravíssima", amount: 2934.70, points: 7, consequence: "Suspensão do direito de dirigir por 12 meses; retenção do veículo." },
  { article: "Art. 165-A", title: "Recusar-se a fazer teste, exame clínico ou perícia para verificar influência de álcool", severity: "Gravíssima", amount: 2934.70, points: 7, consequence: "Suspensão do direito de dirigir por 12 meses; retenção do veículo." },
  { article: "Art. 162, I", title: "Dirigir sem possuir CNH, PPD ou ACC", severity: "Gravíssima", amount: 880.41, points: 7, consequence: "Retenção do veículo até habilitado." },
  { article: "Art. 167", title: "Deixar de usar o cinto de segurança", severity: "Grave", amount: 195.23, points: 5, consequence: "Retenção do veículo até colocação do cinto." },
  { article: "Art. 208", title: "Avançar o sinal vermelho do semáforo ou o de parada obrigatória", severity: "Gravíssima", amount: 293.47, points: 7, consequence: "—" },
  { article: "Art. 218, III", title: "Transitar em velocidade superior à máxima em mais de 50%", severity: "Gravíssima", amount: 880.41, points: 7, consequence: "Suspensão do direito de dirigir." },
  { article: "Art. 230, V", title: "Conduzir veículo não licenciado", severity: "Gravíssima", amount: 293.47, points: 7, consequence: "Remoção do veículo." },
  { article: "Art. 244, I", title: "Conduzir motocicleta sem capacete de segurança", severity: "Gravíssima", amount: 293.47, points: 7, consequence: "Suspensão do direito de dirigir; retenção do veículo." },
  { article: "Art. 252, VI", title: "Dirigir utilizando telefone celular", severity: "Gravíssima", amount: 293.47, points: 7, consequence: "—" },
  { article: "Art. 181, XVIII", title: "Estacionar em local e horário proibidos pela sinalização", severity: "Média", amount: 130.16, points: 4, consequence: "Remoção do veículo." },
  { article: "Art. 186, I", title: "Transitar pela contramão de direção em via de sentido único", severity: "Grave", amount: 195.23, points: 5, consequence: "—" },
  { article: "Art. 193", title: "Transitar com o veículo em calçadas, passeios, ciclovias ou acostamentos", severity: "Gravíssima", amount: 880.41, points: 7, consequence: "—" },
  { article: "Art. 220, XIV", title: "Deixar de reduzir a velocidade de forma compatível com a segurança diante de escolas ou hospitais", severity: "Gravíssima", amount: 293.47, points: 7, consequence: "—" },
  { article: "Art. 230, IX", title: "Conduzir veículo sem equipamento obrigatório ou estando este ineficiente", severity: "Grave", amount: 195.23, points: 5, consequence: "Retenção do veículo para regularização." }
];

export function formatFineAmount(amount) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function normalizeSearch(value) {
  return value
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .trim();
}

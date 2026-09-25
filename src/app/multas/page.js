"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CTB_FINE_RECORDS, CTB_LEI_URL, CTB_OFFICIAL_URL, CTB_UPDATED_AT, normalizeSearch } from "../../lib/ctb";

const detailSections = [
  ["whenToAutuate", "Quando autuar"],
  ["whenNotToAutuate", "Quando não autuar"],
  ["procedures", "Definições e procedimentos"],
  ["examples", "Exemplos para observações do AIT"],
  ["additional", "Informações complementares"]
];

function FineDetails({ fine }) {
  return (
    <>
      <div className="fine-detail-heading">
        <div>
          <span className="fine-article">Enquadramento {fine.id} · {fine.article}</span>
          <h3>{fine.title}</h3>
          <p>{fine.summary}</p>
        </div>
        <span className={`fine-severity severity-${normalizeSearch(fine.severity)}`}>{fine.severity}</span>
      </div>

      <div className="fine-detail-grid">
        {[
          ["Gravidade", fine.severity], ["Pontuação", fine.points], ["Penalidade", fine.penalty],
          ["Medida administrativa", fine.measure], ["Infrator", fine.offender], ["Constatação", fine.detection],
          ["Crime de trânsito", fine.crime], ["Competência", fine.competence]
        ].map(([label, value]) => (
          <div className="fine-detail-field" key={label}>
            <span>{label}</span>
            <strong>{value || "Não informado na ficha"}</strong>
          </div>
        ))}
      </div>

      {detailSections.filter(([key]) => fine[key]).map(([key, label]) => (
        <details className="fine-detail-section" key={key}>
          <summary>{label}</summary>
          <p>{fine[key]}</p>
        </details>
      ))}
    </>
  );
}

export default function MultasPage() {
  const [query, setQuery] = useState("");
  const [selectedFine, setSelectedFine] = useState(null);

  const results = useMemo(() => {
    const tokens = normalizeSearch(query).split(" ").filter(Boolean);
    if (!tokens.length) return CTB_FINE_RECORDS;
    return CTB_FINE_RECORDS.filter((fine) => {
      const text = normalizeSearch(Object.values(fine).join(" "));
      return tokens.every((token) => text.includes(token));
    });
  }, [query]);

  useEffect(() => {
    const closeWithEscape = (event) => event.key === "Escape" && setSelectedFine(null);
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  return (
    <main className="page-shell fines-page">
      <section className="hero-card fines-hero">
        <div>
          <Link href="/inicio" className="fine-back-link">← Voltar ao início</Link>
          <p className="eyebrow">Consulta operacional</p>
          <h1>Multas e infrações do CTB</h1>
          <p className="fines-intro">Pesquise por artigo, código, palavra da tipificação, gravidade, penalidade, abordagem ou qualquer informação da ficha.</p>
        </div>
        <div className="fines-total"><strong>{CTB_FINE_RECORDS.length}</strong><span>fichas disponíveis</span></div>
      </section>

      <section className="feature-card fines-panel">
        <label className="fine-search-field fines-search-field">
          <span className="sr-only">Pesquisar multa ou infração</span>
          <span aria-hidden="true">⌕</span>
          <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: 501-00, art. 162, CNH, abordagem ou gravíssima" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
        </label>
        <div className="fines-toolbar">
          <p className="fine-result-count" aria-live="polite">{results.length} {results.length === 1 ? "resultado encontrado" : "resultados encontrados"}</p>
          <span className="fines-hint">Clique em uma ficha para abrir os detalhes</span>
        </div>

        <div className="fine-results fines-page-results">
          {results.length ? results.map((fine) => (
            <button type="button" className="fine-card" key={fine.id} onClick={() => setSelectedFine(fine)}>
              <div className="fine-card-topline">
                <span className="fine-article">{fine.id} · {fine.article}</span>
                <span className={`fine-severity severity-${normalizeSearch(fine.severity)}`}>{fine.severity}</span>
              </div>
              <h3>{fine.title}</h3>
              <div className="fine-card-summary"><span>{fine.penalty || "Penalidade não informada"}</span><span>{fine.points || "Pontuação não informada"}</span></div>
              <small className="fine-card-open">Abrir ficha detalhada →</small>
            </button>
          )) : (
            <div className="fine-empty-state"><strong>Nenhuma infração encontrada</strong><span>Tente pelo número do artigo, código ou outra palavra da ficha.</span></div>
          )}
        </div>

        <div className="fine-source-note">
          <span>Base oficial do MBFT · consultada em {CTB_UPDATED_AT}</span>
          <span className="fine-source-links"><a href={CTB_OFFICIAL_URL} target="_blank" rel="noreferrer">Resoluções CONTRAN ↗</a><a href={CTB_LEI_URL} target="_blank" rel="noreferrer">CTB no Planalto ↗</a></span>
        </div>
      </section>

      {selectedFine && (
        <div className="modal-backdrop" onClick={() => setSelectedFine(null)}>
          <div className="modal-content fine-modal-content fine-detail-modal" role="dialog" aria-modal="true" aria-labelledby="fine-detail-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedFine(null)} aria-label="Fechar detalhes">&times;</button>
            <div id="fine-detail-title" className="fine-modal-heading"><p className="card-label">Ficha completa do MBFT</p><h2>{selectedFine.id} · {selectedFine.article}</h2><p>Os blocos abaixo podem ser abertos e recolhidos.</p></div>
            <div className="fine-detail"><FineDetails fine={selectedFine} /></div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

const PIX_KEY = "76b42e5b-820a-4ce7-a6bf-56250a7b580a";
const DEMO_NAMES = Array.from({ length: 30 }, (_, index) => String(index + 1).padStart(2, "0"));

const PRIZES = [
  { number: "01", title: "Camisetas Candelarium", detail: "Prêmio especial do curso" },
  { number: "02", title: "Whisky Ballantine's Finest", detail: "Uma garrafa para celebrar" },
  { number: "03", title: "Capacete ProTork Liberty 4", detail: "Proteção e estilo na estrada" },
  { number: "04", title: "Cutelo Profissional", detail: "Ferramenta robusta e versátil" },
  { number: "05", title: "Kit Exclusivo Moto Fest", detail: "Toalha personalizada + sabonete" }
];

export default function RifaPage() {
  const [selectedNames, setSelectedNames] = useState([]);
  const [copied, setCopied] = useState(false);

  function toggleName(name) {
    setSelectedNames((current) => (
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    ));
  }

  async function copyPixKey() {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="raffle-page">
      <div className="raffle-shell">
        <Link className="raffle-back" href="/inicio">← Voltar para o início</Link>

        <section className="raffle-hero">
          <span className="raffle-kicker">CFP 2026/2027</span>
          <h1>Rifa do curso</h1>
          <p>Participe, escolha seu nome e concorra a prêmios incríveis.</p>
          <div className="raffle-price"><strong>R$ 5,00</strong><span>por nome</span></div>
          <a className="raffle-primary" href="#escolher-nomes">Escolher nomes</a>
        </section>

        <section className="raffle-section" aria-labelledby="raffle-prizes-title">
          <div className="raffle-section-heading">
            <span className="raffle-kicker">Prêmios</span>
            <h2 id="raffle-prizes-title">Um motivo a mais para participar</h2>
          </div>
          <div className="raffle-prizes">
            {PRIZES.map((prize) => (
              <article className="raffle-prize" key={prize.number}>
                <span className="raffle-prize-number">{prize.number}</span>
                <h3>{prize.title}</h3>
                <p>{prize.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="raffle-section raffle-selection" id="escolher-nomes" aria-labelledby="raffle-selection-title">
          <div className="raffle-section-heading">
            <span className="raffle-kicker">Modelo demonstrativo</span>
            <h2 id="raffle-selection-title">Escolha seus nomes</h2>
            <p>Selecione os nomes desejados para visualizar sua participação. A confirmação da venda será definida na próxima etapa.</p>
          </div>
          <div className="raffle-name-grid">
            {DEMO_NAMES.map((name) => (
              <button
                type="button"
                className={selectedNames.includes(name) ? "raffle-name is-selected" : "raffle-name"}
                key={name}
                onClick={() => toggleName(name)}
              >
                Nome {name}
              </button>
            ))}
          </div>
          <div className="raffle-selection-summary">
            <div><span>Selecionados</span><strong>{selectedNames.length || "Nenhum"}</strong></div>
            <div><span>Total</span><strong>R$ {(selectedNames.length * 5).toFixed(2).replace(".", ",")}</strong></div>
          </div>
        </section>

        <section className="raffle-payment" aria-labelledby="raffle-payment-title">
          <div>
            <span className="raffle-kicker">Pagamento</span>
            <h2 id="raffle-payment-title">Pague via Pix</h2>
            <p>Após escolher seus nomes, use a chave Pix abaixo para realizar o pagamento.</p>
          </div>
          <div className="raffle-pix-box">
            <code>{PIX_KEY}</code>
            <button type="button" className="raffle-copy" onClick={copyPixKey}>{copied ? "Copiado!" : "Copiar chave"}</button>
          </div>
        </section>

        <p className="raffle-note">* Modelo inicial da página. Data do sorteio, disponibilidade dos nomes e canal de confirmação serão configurados na próxima etapa.</p>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";

const PIX_KEY = "76b42e5b-820a-4ce7-a6bf-56250a7b580a";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const DEMO_NAMES = Array.from({ length: 30 }, (_, index) => String(index + 1).padStart(2, "0"));

const PRIZES = [
  { number: "01", icon: "👕", title: "Camisetas Candelarium", detail: "Prêmio especial do curso" },
  { number: "02", icon: "🥃", title: "Whisky Ballantine's Finest", detail: "Uma garrafa para celebrar" },
  { number: "03", icon: "⛑️", title: "Capacete ProTork Liberty 4", detail: "Proteção e estilo na estrada" },
  { number: "04", icon: "🔪", title: "Cutelo Profissional", detail: "Ferramenta robusta e versátil" },
  { number: "05", icon: "🏍️", title: "Kit Exclusivo Moto Fest", detail: "Toalha personalizada + sabonete" }
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
        <section className="raffle-hero">
          <div className="raffle-brand-row">
            <img className="raffle-crest raffle-crest-pmpr" src={`${basePath}/brasao-pmpr.png`} alt="Brasão da Polícia Militar do Paraná" />
            <div className="raffle-hero-copy">
              <span className="raffle-kicker">POLÍCIA MILITAR DO PARANÁ · 8º BPM</span>
              <h1>Rifa CFP<br /><em>2026/2027</em></h1>
            </div>
            <img className="raffle-crest raffle-crest-bpm" src={`${basePath}/pmpr-8-bpm.png`} alt="Brasão do 8º Batalhão de Polícia Militar" />
          </div>
          <p>Participe, escolha seu nome e concorra a prêmios incríveis.</p>
          <div className="raffle-price"><strong>R$ 5,00</strong><span>por nome</span></div>
          <a className="raffle-primary" href="#escolher-nomes">Escolher nomes</a>
        </section>

        <div className="raffle-photo-band">
          <img src={`${basePath}/viaturas-pmpr.jpg`} alt="Viaturas da Polícia Militar do Paraná" />
          <div><strong>Uma ação do curso CFP 2026/2027</strong><span>Participe e concorra!</span></div>
        </div>

        <section className="raffle-section" aria-labelledby="raffle-prizes-title">
          <div className="raffle-section-heading">
            <span className="raffle-kicker">Prêmios</span>
            <h2 id="raffle-prizes-title">Um motivo a mais para participar</h2>
          </div>
          <div className="raffle-prizes">
            {PRIZES.map((prize) => (
              <article className="raffle-prize" key={prize.number}>
                <div className="raffle-prize-top"><span className="raffle-prize-number">PRÊMIO {prize.number}</span><span className="raffle-prize-icon" aria-hidden="true">{prize.icon}</span></div>
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
            <img className="raffle-qr" src={`${basePath}/pix-qrcode.png`} alt="QR Code para pagamento via Pix" />
            <div className="raffle-pix-details">
              <span>Escaneie para pagar</span>
            <code>{PIX_KEY}</code>
            <button type="button" className="raffle-copy" onClick={copyPixKey}>{copied ? "Copiado!" : "Copiar chave"}</button>
            </div>
          </div>
        </section>

        <p className="raffle-note">* Modelo inicial da página. Data do sorteio, disponibilidade dos nomes e canal de confirmação serão configurados na próxima etapa.</p>
      </div>
    </main>
  );
}

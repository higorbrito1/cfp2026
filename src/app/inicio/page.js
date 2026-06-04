"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatClock,
  formatLongDate,
  getGroupForDate,
  getTeamForDate,
  parseYmd,
  REFERENCE_DATE,
  REFERENCE_GROUP
} from "../../lib/scale";

const PARANAVAI = {
  label: "Paranavai, PR",
  latitude: -23.07306,
  longitude: -52.46528
};

const DRIVE_URL = "https://drive.google.com/drive/folders/1sbsmA7awmdsV2fN7xrAKko_yO4OcyMIE";

export default function InicioPage() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    error: ""
  });

  const referenceDate = useMemo(() => parseYmd(REFERENCE_DATE), []);
  const today = now;
  const currentGroup = getGroupForDate(today, referenceDate, REFERENCE_GROUP);
  const team = getTeamForDate(today, referenceDate, REFERENCE_GROUP);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(PARANAVAI.latitude));
        url.searchParams.set("longitude", String(PARANAVAI.longitude));
        url.searchParams.set("current", "temperature_2m");
        url.searchParams.set("timezone", "auto");

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("weather");

        const data = await response.json();
        if (cancelled) return;

        setWeather({
          loading: false,
          temperature: data?.current?.temperature_2m ?? null,
          error: ""
        });
      } catch {
        if (cancelled) return;
        setWeather({
          loading: false,
          temperature: null,
          error: "Nao foi possivel carregar a temperatura."
        });
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  function printTeam() {
    window.print();
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-overlay" />
        <div className="home-bg" aria-hidden="true" />

        <div className="home-content">
          <p className="eyebrow">CFP</p>
          <h1>Escala de guarda do quartel</h1>
          <p className="home-subtitle">
            Acesso rápido para a escala do dia, temperatura e arquivos da turma.
          </p>

          <article className="home-status">
            <div>
              <span className="status-label">Temperatura em {PARANAVAI.label}</span>
              <strong>
                {weather.loading
                  ? "Carregando..."
                  : weather.temperature !== null
                  ? `${Math.round(weather.temperature)} C`
                  : "Indisponível"}
              </strong>
              <small>{weather.error || "Atualizada em tempo real"}</small>
            </div>

            <div>
              <span className="status-label">Equipe de guarda do dia</span>
              <strong>Grupo {currentGroup}</strong>
              <small>{formatLongDate(today)}</small>
            </div>

            <div>
              <span className="status-label">Agora</span>
              <strong>{formatClock(now)}</strong>
            </div>
          </article>

          <section className="home-team printable-team" aria-label="Equipe de guarda do dia">
            <div className="team-panel-header home-team-top">
              <div>
                <p className="card-label">Equipe de guarda</p>
                <h2>Grupo {team.group}</h2>
              </div>
              <div className="team-commander">
                <span>Comandante</span>
                <strong>
                  {team.commander ? `${team.commander.code} - ${team.commander.name}` : "Indisponível"}
                </strong>
              </div>
            </div>

            <div className="team-compact-grid">
              {team.roster.map((person, index) => (
                <article
                  key={`${person.code}-${person.name}`}
                  className={index === team.commanderIndex ? "team-compact-card is-commander" : "team-compact-card"}
                >
                  <span>{person.code}</span>
                  <strong>{person.name}</strong>
                  {index === team.commanderIndex && <small>Comandante da guarda</small>}
                </article>
              ))}
            </div>
          </section>

          <div className="home-actions">
            <Link className="primary-button" href="/guarda">
              Ver escala de guarda
            </Link>
            <button type="button" className="secondary-button" onClick={printTeam}>
              Imprimir equipe
            </button>
            <a className="secondary-button" href={DRIVE_URL} target="_blank" rel="noreferrer">
              Abrir Drive CFP
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

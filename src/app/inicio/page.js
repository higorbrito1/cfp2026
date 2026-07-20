"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildMonthCells,
  countRemainingGuardsForGroup,
  formatLongDate,
  formatYmd,
  getGroupForDate,
  getTeamForDate,
  isSameDay,
  parseMonth,
  parseYmd,
  REFERENCE_DATE,
  REFERENCE_GROUP
} from "../../lib/scale";

const PARANAVAI = {
  label: "Paranavai, PR",
  latitude: -23.07306,
  longitude: -52.46528
};

const COURSE_START_DATE = new Date(2026, 4, 5); // 05/05/2026 (mês é 0-indexed)
const CURRENT_COURSE_WEEK = 10;
const TOTAL_COURSE_WEEKS = 40;
const DRIVE_URL = "https://drive.google.com/drive/folders/1sbsmA7awmdsV2fN7xrAKko_yO4OcyMIE";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function calculateCourseDays(today) {
  const diff = today - COURSE_START_DATE;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function calculateStageCountdown() {
  const remainingWeeks = TOTAL_COURSE_WEEKS - CURRENT_COURSE_WEEK;
  return {
    calendarDays: remainingWeeks * 7,
    weekdayDays: remainingWeeks * 5
  };
}

export default function InicioPage() {
  const [now, setNow] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => formatYmd(now));
  const [visibleMonth, setVisibleMonth] = useState(() => formatYmd(now).slice(0, 7));
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    error: ""
  });

  const referenceDate = useMemo(() => parseYmd(REFERENCE_DATE), []);
  const today = now;
  const stageCountdown = useMemo(() => calculateStageCountdown(), []);
  const courseDays = useMemo(() => calculateCourseDays(today), [today]);

  const selected = useMemo(() => parseYmd(selectedDate), [selectedDate]);
  const monthDate = useMemo(() => parseMonth(visibleMonth), [visibleMonth]);
  const selectedGroup = getGroupForDate(selected, referenceDate, REFERENCE_GROUP);
  const calendarTeam = getTeamForDate(selected, referenceDate, REFERENCE_GROUP);
  const selectedGroupGuardsRemaining = useMemo(
    () => countRemainingGuardsForGroup(selected, referenceDate, REFERENCE_GROUP),
    [referenceDate, selected]
  );

  const monthTitle = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(monthDate);

  const monthCells = useMemo(
    () => buildMonthCells(monthDate, referenceDate, REFERENCE_GROUP, selected),
    [monthDate, referenceDate, selected]
  );

  function changeMonth(delta) {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1);
    setVisibleMonth(formatYmd(next).slice(0, 7));
  }

  function syncSelectedDate(value) {
    setSelectedDate(value);
    setVisibleMonth(value.slice(0, 7));
  }

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

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-overlay" />
        <div className="home-bg" aria-hidden="true" />

        <div className="home-content">
          <h1>CFP 8ºBPM 26/27</h1>

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
              <small>
                {weather.error
                  ? weather.error
                  : weather.temperature !== null
                  ? weather.temperature < 17
                    ? "🧥 Use blusa"
                    : "Sem blusa"
                  : "Atualizada em tempo real"}
              </small>
            </div>

            <div>
              <span className="status-label">Dias de curso</span>
              <strong>{courseDays}</strong>
              <small>Desde 05/05/2026</small>
            </div>

            <div>
              <span className="status-label">Dias úteis até estágio</span>
              <strong>{stageCountdown.weekdayDays}</strong>
              <small>Apenas dias de segunda a sexta</small>
            </div>

            <div>
              <span className="status-label">Dias corridos até estágio</span>
              <strong>{stageCountdown.calendarDays}</strong>
              <small>Contagem total até o estágio</small>
            </div>

            <div>
              <span className="status-label">Semanas atual / total</span>
              <strong>{CURRENT_COURSE_WEEK} / {TOTAL_COURSE_WEEKS}</strong>
              <small>Semana atual e total</small>
            </div>
          </article>

          <div className="home-image-panel">
            <img
              className="home-hero-image"
              src={`${basePath}/imagem_fundo.jpeg`}
              alt="CFP 8ºBPM 26/27"
            />
          </div>

          <div className="home-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowCalendar((v) => !v);
              }}
              aria-expanded={showCalendar}
            >
              <span>{showCalendar ? "Ocultar calendário" : "Calendário de guarda"}</span>
              <svg
                className="chevron-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  marginLeft: "8px",
                  transition: "transform 0.2s ease",
                  transform: showCalendar ? "rotate(180deg)" : "rotate(0deg)",
                  display: "inline-block",
                  verticalAlign: "middle"
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <a className="secondary-button" href={DRIVE_URL} target="_blank" rel="noreferrer">
              Abrir Drive CFP
            </a>
          </div>

          <div className={`home-calendar-collapse ${showCalendar ? "is-expanded" : ""}`}>
            <div className="home-calendar-collapse-content">
              <section className="home-calendar" aria-label="Calendário de escala de guarda">
                <div className="calendar-toolbar">
                  <button type="button" className="ghost-button" onClick={() => changeMonth(-1)}>
                    Anterior
                  </button>
                  <p className="month-title">{monthTitle}</p>
                  <button type="button" className="ghost-button" onClick={() => changeMonth(1)}>
                    Próximo
                  </button>
                </div>

                <p className="selected-line">
                  <strong>{formatLongDate(selected)}</strong>
                  <span>Grupo {selectedGroup}</span>
                </p>

                <div className="calendar-grid" role="grid" aria-label={`Calendário de ${monthTitle}`}>
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((label, index) => (
                    <span key={`${label}-${index}`} className="calendar-head">
                      {label}
                    </span>
                  ))}

                  {monthCells.map((cell, index) => {
                    if (!cell.date) {
                      return <div key={`empty-${index}`} className="calendar-day is-out" aria-hidden="true" />;
                    }

                    const isToday = isSameDay(cell.date, new Date());
                    const group = getGroupForDate(cell.date, referenceDate, REFERENCE_GROUP);

                    return (
                      <button
                        key={formatYmd(cell.date)}
                        type="button"
                        className={
                          cell.isSelected
                            ? "calendar-day is-selected"
                            : isToday
                            ? "calendar-day is-today"
                            : "calendar-day"
                        }
                        onClick={() => {
                          syncSelectedDate(formatYmd(cell.date));
                          setIsModalOpen(true);
                        }}
                      >
                        <strong>{cell.dayNumber}</strong>
                        <span>Grupo {group}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="calendar-legend">
                  <span>
                    <i className="legend-swatch today" />
                    Dia atual
                  </span>
                  <span>
                    <i className="legend-swatch selected" />
                    Dia selecionado
                  </span>
                  <span>
                    <i className="legend-swatch group" />
                    Grupo do dia
                  </span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>
              &times;
            </button>

            <div className="team-panel-header" style={{ marginBottom: "16px" }}>
              <div>
                <p className="card-label">Equipe de guarda ({formatLongDate(selected)})</p>
                <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Grupo {calendarTeam.group}</h3>
              </div>
              <div className="team-commander" style={{ border: 0, padding: 0 }}>
                <span>Comandante</span>
                <strong>
                  {calendarTeam.commander
                    ? `${calendarTeam.commander.code} - ${calendarTeam.commander.name}`
                    : "Indisponível"}
                </strong>
              </div>
            </div>

            <div className="selected-note" aria-live="polite">
              <strong>{selectedGroupGuardsRemaining}</strong>
              <span>guardas restantes do grupo {selectedGroup} até o estágio</span>
            </div>

            <ul className="team-list">
              {calendarTeam.roster.map((person, index) => (
                <li
                  key={`${person.code}-${person.name}`}
                  className={index === calendarTeam.commanderIndex ? "team-item is-commander" : "team-item"}
                >
                  <div>
                    <span>{person.code} -</span>
                    <strong>{person.name}</strong>
                  </div>
                  {index === calendarTeam.commanderIndex && <small>Comandante da guarda</small>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

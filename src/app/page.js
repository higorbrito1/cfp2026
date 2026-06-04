"use client";

import { useEffect, useMemo, useState } from "react";

const GROUPS = ["A", "B", "C", "D", "E", "F"];
const EXAMPLE_DATE = "2026-06-08";
const EXAMPLE_GROUP = "D";
const PARANAVAI = {
  label: "Paranavai, PR",
  latitude: -23.07306,
  longitude: -52.46528
};

const today = formatYmd(new Date());

export default function Home() {
  const [referenceDate, setReferenceDate] = useState(EXAMPLE_DATE);
  const [referenceGroup, setReferenceGroup] = useState(EXAMPLE_GROUP);
  const [selectedDate, setSelectedDate] = useState(EXAMPLE_DATE);
  const [visibleMonth, setVisibleMonth] = useState(EXAMPLE_DATE.slice(0, 7));
  const [clock, setClock] = useState(new Date());
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    error: ""
  });

  const reference = useMemo(() => parseYmd(referenceDate), [referenceDate]);
  const selected = useMemo(() => parseYmd(selectedDate), [selectedDate]);
  const monthDate = useMemo(() => parseMonth(visibleMonth), [visibleMonth]);

  const selectedGroup = getGroupForDate(selected, reference, referenceGroup);
  const selectedText = formatLongDate(selected);
  const clockText = formatClock(clock);

  const monthCells = useMemo(
    () => buildMonthCells(monthDate, reference, referenceGroup, selected),
    [monthDate, reference, referenceGroup, selected]
  );

  const monthTitle = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(monthDate);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
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

  function loadExample() {
    setReferenceDate(EXAMPLE_DATE);
    setReferenceGroup(EXAMPLE_GROUP);
    setSelectedDate(EXAMPLE_DATE);
    setVisibleMonth(EXAMPLE_DATE.slice(0, 7));
  }

  function goToday() {
    setSelectedDate(today);
    setVisibleMonth(today.slice(0, 7));
  }

  function changeMonth(delta) {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1);
    setVisibleMonth(formatYmd(next).slice(0, 7));
  }

  function syncSelectedDate(value) {
    setSelectedDate(value);
    setVisibleMonth(value.slice(0, 7));
  }

  return (
    <main className="page-shell">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <p className="eyebrow">Escala de guarda do quartel</p>
          <h1>Escala de guarda do quartel</h1>
        </div>

        <div className="status-stack" aria-label="Informacoes do momento">
          <article className="status-card">
            <span className="status-label">Agora</span>
            <strong>{clockText}</strong>
          </article>

          <article className="status-card">
            <span className="status-label">Temperatura em Paranavai, PR</span>
            <strong>
              {weather.loading
                ? "Carregando..."
                : weather.temperature !== null
                ? `${Math.round(weather.temperature)} C`
                : "Indisponivel"}
            </strong>
            <small>{weather.error || "Atualizada em tempo real"}</small>
          </article>
        </div>
      </section>

      <section className="feature-card calendar-card">
        <div className="panel-heading">
          <div>
            <p className="card-label">Calendario</p>
            <h2>Escala diaria</h2>
          </div>
          <div className="month-actions">
            <button type="button" className="ghost-button" onClick={goToday}>
              Hoje
            </button>
            <button type="button" className="ghost-button" onClick={loadExample}>
              Exemplo
            </button>
          </div>
        </div>

        <p className="result-line">
          <strong>{selectedText}</strong>
          <span>Grupo {selectedGroup}</span>
        </p>

        <details className="config-details">
          <summary>Configuracao adicional</summary>
          <div className="control-grid">
            <label>
              Data de referencia
              <input
                type="date"
                value={referenceDate}
                onChange={(event) => setReferenceDate(event.target.value)}
              />
            </label>
            <label>
              Grupo da referencia
              <select
                value={referenceGroup}
                onChange={(event) => setReferenceGroup(event.target.value)}
              >
                {GROUPS.map((group) => (
                  <option key={group} value={group}>
                    Grupo {group}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="group-track" aria-label="Ordem dos grupos">
            {GROUPS.map((group) => (
              <span
                key={group}
                className={group === referenceGroup ? "group-pill is-active" : "group-pill"}
              >
                {group}
              </span>
            ))}
          </div>
        </details>

        <div className="calendar-toolbar">
          <button type="button" className="ghost-button" onClick={() => changeMonth(-1)}>
            Anterior
          </button>
          <p className="month-title">{monthTitle}</p>
          <button type="button" className="ghost-button" onClick={() => changeMonth(1)}>
            Proximo
          </button>
        </div>

        <div className="calendar-grid" role="grid" aria-label={`Calendario de ${monthTitle}`}>
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
                onClick={() => syncSelectedDate(formatYmd(cell.date))}
              >
                <strong>{cell.dayNumber}</strong>
                <span>Grupo {cell.group}</span>
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
    </main>
  );
}

function buildMonthCells(monthDate, referenceDate, referenceGroup, selectedDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((firstWeekday + lastDay.getDate()) / 7) * 7;
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - firstWeekday + 1;

    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      cells.push({ date: null });
      continue;
    }

    const date = new Date(year, month, dayNumber);
    cells.push({
      date,
      dayNumber,
      group: getGroupForDate(date, referenceDate, referenceGroup),
      isSelected: isSameDay(date, selectedDate)
    });
  }

  return cells;
}

function getGroupForDate(date, referenceDate, referenceGroup) {
  const referenceIndex = GROUPS.indexOf(referenceGroup);
  const offset = diffDays(referenceDate, date);
  const index = (referenceIndex + offset) % GROUPS.length;
  return GROUPS[(index + GROUPS.length) % GROUPS.length];
}

function parseYmd(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function diffDays(from, to) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatClock(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

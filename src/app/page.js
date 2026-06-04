"use client";

import { useEffect, useMemo, useState } from "react";

const GROUPS = ["A", "B", "C", "D", "E", "F"];
const EXAMPLE_DATE = "2026-06-08";
const EXAMPLE_GROUP = "D";
const FALLBACK_LOCATION = {
  label: "Brasilia, DF",
  latitude: -15.793889,
  longitude: -47.882778
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
    locationLabel: FALLBACK_LOCATION.label,
    error: ""
  });

  const reference = useMemo(() => parseYmd(referenceDate), [referenceDate]);
  const selected = useMemo(() => parseYmd(selectedDate), [selectedDate]);
  const monthDate = useMemo(() => parseMonth(visibleMonth), [visibleMonth]);

  const selectedGroup = getGroupForDate(selected, reference, referenceGroup);
  const selectedText = formatLongDate(selected);
  const clockText = formatClock(clock);

  const nextSevenDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(selected, index);
      return {
        date,
        group: getGroupForDate(date, reference, referenceGroup),
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, selected)
      };
    });
  }, [reference, referenceGroup, selected]);

  const monthCells = useMemo(
    () => buildMonthCells(monthDate, reference, referenceGroup, selected),
    [monthDate, reference, referenceGroup, selected]
  );

  const monthTitle = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(monthDate);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather(latitude, longitude, label) {
      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(latitude));
        url.searchParams.set("longitude", String(longitude));
        url.searchParams.set("current", "temperature_2m");
        url.searchParams.set("timezone", "auto");

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("weather");

        const data = await response.json();
        if (cancelled) return;

        setWeather({
          loading: false,
          temperature: data?.current?.temperature_2m ?? null,
          locationLabel: label,
          error: ""
        });
      } catch {
        if (cancelled) return;
        setWeather({
          loading: false,
          temperature: null,
          locationLabel: label,
          error: "Nao foi possivel carregar a temperatura agora."
        });
      }
    }

    setWeather((current) => ({ ...current, loading: true, error: "" }));

    if (!navigator.geolocation) {
      loadWeather(FALLBACK_LOCATION.latitude, FALLBACK_LOCATION.longitude, FALLBACK_LOCATION.label);
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadWeather(latitude, longitude, "Localizacao do celular");
      },
      () => {
        loadWeather(FALLBACK_LOCATION.latitude, FALLBACK_LOCATION.longitude, FALLBACK_LOCATION.label);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 30 * 60 * 1000 }
    );

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
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Escala de guarda do quartel</p>
          <h1>Rotacao automatica entre os grupos A, B, C, D, E e F</h1>
          <p className="lead">
            Defina uma data-base e o grupo inicial. O sistema calcula a escala diaria, a semana
            e o mes com rotacao continua.
          </p>
        </div>

        <div className="status-stack" aria-label="Informacoes do momento">
          <article className="status-card">
            <span className="status-label">Agora</span>
            <strong>{clockText}</strong>
          </article>

          <article className="status-card">
            <span className="status-label">Temperatura</span>
            <strong>
              {weather.loading
                ? "Carregando..."
                : weather.temperature !== null
                ? `${Math.round(weather.temperature)} C`
                : "Indisponivel"}
            </strong>
            <small>{weather.locationLabel}</small>
          </article>
        </div>

        <div className="reference-panel">
          <div className="panel-heading">
            <div>
              <p className="card-label">Base da escala</p>
              <h2>Defina a regra de rotacao</h2>
            </div>
            <div className="month-actions">
              <button type="button" className="ghost-button" onClick={loadExample}>
                Usar exemplo
              </button>
              <button type="button" className="ghost-button" onClick={goToday}>
                Ir para hoje
              </button>
            </div>
          </div>

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
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="feature-card spotlight">
          <div className="spotlight-header">
            <div>
              <p className="card-label">Opcao 1</p>
              <h2>Escala simples</h2>
              <p className="muted">
                Escolha uma data e veja imediatamente qual grupo fica responsavel.
              </p>
            </div>
            <label className="inline-date">
              <span>Dia selecionado</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => syncSelectedDate(event.target.value)}
              />
            </label>
          </div>

          <div className="result-pill">
            <span>{selectedText}</span>
            <strong>Grupo {selectedGroup}</strong>
          </div>

          <div className="week-strip" aria-label="Proximos 7 dias">
            {nextSevenDays.map((item) => {
              const label = formatShortDate(item.date);
              const weekday = formatWeekday(item.date);

              return (
                <button
                  key={formatYmd(item.date)}
                  type="button"
                  className={item.isSelected ? "day-chip is-selected" : "day-chip"}
                  onClick={() => syncSelectedDate(formatYmd(item.date))}
                >
                  <span>{weekday}</span>
                  <strong>{label}</strong>
                  <small>{item.isToday ? "Hoje" : `Grupo ${item.group}`}</small>
                </button>
              );
            })}
          </div>
        </article>

        <article className="feature-card">
          <div className="panel-heading">
            <div>
              <p className="card-label">Opcao 2</p>
              <h2>Calendario mensal</h2>
            </div>
            <div className="month-actions">
              <button type="button" className="ghost-button" onClick={() => changeMonth(-1)}>
                Anterior
              </button>
              <button type="button" className="ghost-button" onClick={() => changeMonth(1)}>
                Proximo
              </button>
            </div>
          </div>

          <p className="month-title">{monthTitle}</p>

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
        </article>
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

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
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

function formatShortDate(date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

function formatClock(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

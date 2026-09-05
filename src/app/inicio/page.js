"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildMonthCells,
  buildGuardSchedule,
  countRemainingGuardsForGroup,
  COURSE_START_DATE,
  STAGE_START_DATE,
  TOTAL_COURSE_WEEKS,
  diffDays,
  formatLongDate,
  formatGuardDuration,
  formatGuardScheduleForWhatsApp,
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

const DRIVE_URL = "https://drive.google.com/drive/folders/1sbsmA7awmdsV2fN7xrAKko_yO4OcyMIE";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const WEEK_ONE_START = new Date(2026, 4, 17); // Semana 1 inicia em 17/05/2026
const SERVICE_NAMES = [
  "Rancho",
  "Banheiro rancho",
  "Alojamento masculino",
  "Alojamento feminino",
  "Apoio aos lixos",
  "Bandeira"
];

function calculateCourseDays(today) {
  // Contagem de dias corridos inicia em 05/05/2026, conforme solicitado.
  const diff = today - COURSE_START_DATE;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfWeek(date) {
  const day = date.getDay();
  return addDays(startOfDay(date), -day); // Sunday = 0
}

function calculateCurrentCourseWeek(today) {
  const weekStart = startOfWeek(today);
  const weekIndex = Math.floor(diffDays(WEEK_ONE_START, weekStart) / 7) + 1;
  if (weekIndex < 1) {
    return 1;
  }
  return Math.min(TOTAL_COURSE_WEEKS, weekIndex);
}

function calculateStageCountdown(today) {
  const todayStart = startOfDay(today);
  const calendarDays = Math.max(0, diffDays(todayStart, STAGE_START_DATE));
  let weekdayDays = 0;

  for (let cursor = addDays(todayStart, 1); cursor <= STAGE_START_DATE; cursor = addDays(cursor, 1)) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      weekdayDays += 1;
    }
  }

  return {
    calendarDays,
    weekdayDays
  };
}

function downloadScheduleImage(slots, selected, group, serviceRows) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = 900;
  const rowHeight = 142;
  const headerHeight = 125;
  canvas.width = width;
  const serviceStart = headerHeight + (slots.length + 1) * rowHeight + 35;
  canvas.height = serviceStart + (serviceRows.length + 1) * 105 + 45;

  context.fillStyle = "#f5f8f6";
  context.fillRect(0, 0, width, canvas.height);
  context.fillStyle = "#164f3b";
  context.fillRect(0, 0, width, headerHeight);
  context.fillStyle = "#ffffff";
  context.font = "700 30px Arial";
  context.fillText("ESCALA DE GUARDA", 30, 48);
  context.font = "500 19px Arial";
  context.fillText(`${formatLongDate(selected)} · Grupo ${group}`, 30, 86);

  const columns = [30, 250, 470, 690];
  const labels = ["HORÁRIO", "P1", "P2", "P3"];
  context.font = "700 18px Arial";
  labels.forEach((label, index) => context.fillText(label, columns[index], headerHeight - 18));

  slots.forEach((slot, index) => {
    const y = headerHeight + index * rowHeight;
    context.fillStyle = index % 2 === 0 ? "#ffffff" : "#e8f0eb";
    context.fillRect(20, y, width - 40, rowHeight - 6);
    context.fillStyle = "#164f3b";
    context.font = "700 18px Arial";
    context.fillText(`Horário ${index + 1}`, columns[0], y + 32);
    context.font = "500 16px Arial";
    context.fillText(`${slot.start}–${slot.end}`, columns[0], y + 61);
    slot.posts.forEach((post, postIndex) => {
      const member = post[0];
      context.fillStyle = member ? "#17372c" : "#87958d";
      context.font = "600 17px Arial";
      context.fillText(member ? `${member.code} - ${member.name}` : "Não definido", columns[postIndex + 1], y + 45);
    });
  });

  context.fillStyle = "#164f3b";
  context.font = "700 24px Arial";
  context.fillText("SERVIÇOS ADICIONAIS", 30, serviceStart + 28);
  const serviceHeaderY = serviceStart + 45;
  context.font = "700 17px Arial";
  context.fillText("SERVIÇO", columns[0], serviceHeaderY + 25);
  context.fillText("INTEGRANTES", columns[1], serviceHeaderY + 25);
  serviceRows.forEach((row, index) => {
    const y = serviceHeaderY + 105 + index * 105;
    context.fillStyle = index % 2 === 0 ? "#ffffff" : "#e8f0eb";
    context.fillRect(20, y, width - 40, rowHeight - 6);
    context.fillStyle = "#17372c";
    context.font = "700 17px Arial";
    context.fillText(row.service, columns[0], y + 38);
    context.font = "500 16px Arial";
    context.fillText(row.members || "Não definido", columns[1], y + 38);
  });

  const link = document.createElement("a");
  link.download = `escala-guarda-${formatYmd(selected)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
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
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("06:00");
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const [slotMembers, setSlotMembers] = useState([]);
  const [autoFillSchedule, setAutoFillSchedule] = useState(false);
  const [serviceMembers, setServiceMembers] = useState(() => Object.fromEntries(SERVICE_NAMES.map((name) => [name, ["", "", ""]])));

  const referenceDate = useMemo(() => parseYmd(REFERENCE_DATE), []);
  const today = now;
  const currentCourseWeek = useMemo(() => calculateCurrentCourseWeek(today), [today]);
  const stageCountdown = useMemo(() => calculateStageCountdown(today), [today]);
  const courseDays = useMemo(() => calculateCourseDays(today), [today]);

  const selected = useMemo(() => parseYmd(selectedDate), [selectedDate]);
  const monthDate = useMemo(() => parseMonth(visibleMonth), [visibleMonth]);
  const selectedGroup = getGroupForDate(selected, referenceDate, REFERENCE_GROUP);
  const calendarTeam = getTeamForDate(selected, referenceDate, REFERENCE_GROUP);
  const defaultPosts = useMemo(
    () => Object.fromEntries(calendarTeam.roster.map((person) => [person.code, "-1"])),
    [calendarTeam.roster]
  );
  const assignedPosts = defaultPosts;
  const guardSchedule = useMemo(
    () => buildGuardSchedule(startTime, endTime, assignedPosts, calendarTeam.roster, autoFillSchedule),
    [startTime, endTime, assignedPosts, calendarTeam.roster, autoFillSchedule]
  );
  const editableSchedule = useMemo(
    () => guardSchedule.slots.map((slot, slotIndex) => ({
      ...slot,
      posts: (slotMembers[slotIndex] || slot.posts.map((post) => post[0] || null)).map((member) => member ? [member] : [])
    })),
    [guardSchedule.slots, slotMembers]
  );
  const whatsappSchedule = useMemo(
    () => {
      const services = SERVICE_NAMES.map((service) => {
        const members = (serviceMembers[service] || [])
          .filter(Boolean)
          .map((code) => calendarTeam.roster.find((person) => person.code === code))
          .filter(Boolean)
          .map((person) => `${person.code} - ${person.name}`)
          .join(", ");
        return `${service}: ${members || "Não definido"}`;
      });
      return `${formatGuardScheduleForWhatsApp(editableSchedule, selected, calendarTeam.group)}\n\n*SERVIÇOS ADICIONAIS*\n${services.join("\n")}`;
    },
    [editableSchedule, selected, calendarTeam.group, serviceMembers, calendarTeam.roster]
  );
  const serviceRows = useMemo(
    () => SERVICE_NAMES.map((service) => ({
      service,
      members: (serviceMembers[service] || [])
        .filter(Boolean)
        .map((code) => calendarTeam.roster.find((person) => person.code === code))
        .filter(Boolean)
        .map((person) => `${person.code} - ${person.name}`)
        .join(", ")
    })),
    [serviceMembers, calendarTeam.roster]
  );
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
    setSlotMembers(guardSchedule.slots.map((slot) => slot.posts.map((post) => post[0] || null)));
  }, [guardSchedule.slots]);

  useEffect(() => {
    setAutoFillSchedule(false);
    setServiceMembers(Object.fromEntries(SERVICE_NAMES.map((name) => [name, ["", "", ""]])));
  }, [calendarTeam.group]);

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
              <strong>{currentCourseWeek} / {TOTAL_COURSE_WEEKS}</strong>
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
            <Link className="secondary-button" href="/rifa">
              Rifa CFP 2026/2027
            </Link>
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

            <div className="modal-date-heading">
              <div>
                <p className="card-label">Equipe de guarda ({formatLongDate(selected)})</p>
                <h3>Grupo {calendarTeam.group}</h3>
              </div>
              <div className="selected-note" aria-live="polite">
                <strong>{selectedGroupGuardsRemaining}</strong>
                <span>guardas restantes até o estágio</span>
              </div>
            </div>

            <details className="roster-details">
              <summary>Ver integrantes da guarda</summary>
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
                    {index === calendarTeam.commanderIndex && <small>Comandante</small>}
                  </li>
                ))}
              </ul>
            </details>

            <details className="guard-schedule-details">
              <summary>Ver rotação dos postos</summary>
              <section className="guard-schedule-panel" aria-labelledby="modal-schedule-title">
                <div>
                  <p className="card-label">Rotação dos postos</p>
                  <h3 id="modal-schedule-title">Configurar horários</h3>
                </div>

              <div className="guard-time-fields">
                <label>
                  Início da guarda
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </label>
                <label>
                  Fim da guarda
                  <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                </label>
              </div>

              <p className="schedule-help">Clique em cada quadrado para escolher o integrante. Há um integrante por posto em cada horário.</p>

              {guardSchedule.error ? (
                <p className="schedule-error" role="alert">{guardSchedule.error}</p>
              ) : (
                <div className="rotation-list">
                  <p className="schedule-summary">
                    {guardSchedule.slots.length} períodos · {formatGuardDuration(guardSchedule.slots[0]?.duration || 0)} por período
                  </p>
                  <div className="rotation-table" role="table" aria-label="Tabela de rotação dos postos">
                    <div className="rotation-table-row rotation-table-header" role="row">
                      <strong role="columnheader">Horário</strong>
                      <strong role="columnheader">P1</strong>
                      <strong role="columnheader">P2</strong>
                      <strong role="columnheader">P3</strong>
                    </div>
                    {editableSchedule.map((slot, index) => (
                      <div className="rotation-table-row" role="row" key={`table-${slot.start}-${slot.end}`}>
                        <strong role="cell">Horário {index + 1}<small>{slot.start}–{slot.end}</small></strong>
                        {[0, 1, 2].map((postIndex) => (
                          <label className="rotation-cell" role="cell" key={postIndex}>
                            <span className="sr-only">Horário {index + 1}, P{postIndex + 1}</span>
                            <select
                              value={slotMembers[index]?.[postIndex]?.code || ""}
                              onChange={(event) => {
                                const member = calendarTeam.roster.find((person) => person.code === event.target.value) || null;
                                setSlotMembers((current) => current.map((posts, rowIndex) => rowIndex === index
                                  ? posts.map((currentMember, currentPost) => currentPost === postIndex ? member : currentMember)
                                  : posts));
                              }}
                            >
                              <option value="">Selecionar</option>
                              {calendarTeam.roster.map((person) => (
                                <option value={person.code} key={person.code}>{person.code} - {person.name}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="service-table-wrap">
                    <h3 className="service-table-title">Serviços adicionais</h3>
                    <div className="service-table" role="table" aria-label="Serviços adicionais da guarda">
                      <div className="service-table-row service-table-header" role="row">
                        <strong role="columnheader">Serviço</strong>
                        <strong role="columnheader">Integrantes</strong>
                      </div>
                      {SERVICE_NAMES.map((service) => (
                        <div className="service-table-row" role="row" key={service}>
                          <strong role="cell">{service}</strong>
                          <div className="service-member-selects" role="cell">
                            {[0, 1, 2].map((index) => (
                              <select
                                key={index}
                                aria-label={`${service}, integrante ${index + 1}`}
                                value={serviceMembers[service]?.[index] || ""}
                                onChange={(event) => setServiceMembers((current) => ({
                                  ...current,
                                  [service]: current[service].map((member, memberIndex) => memberIndex === index ? event.target.value : member)
                                }))}
                              >
                                <option value="">Selecionar</option>
                                {calendarTeam.roster.map((person) => (
                                  <option value={person.code} key={person.code}>{person.code} - {person.name}</option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="schedule-export-actions">
                    <button
                      type="button"
                      className="primary-action"
                      disabled={!guardSchedule.slots.length}
                      onClick={() => setAutoFillSchedule(true)}
                    >
                      Autopreencher horários e postos
                    </button>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => setServiceMembers(Object.fromEntries(SERVICE_NAMES.map((service, serviceIndex) => {
                        const memberCount = [2, 1, 3, 3, 3, 3][serviceIndex];
                        return [service, Array.from({ length: memberCount }, (_, offset) => calendarTeam.roster[(serviceIndex * 2 + offset) % calendarTeam.roster.length].code)];
                      })))}
                    >
                      Autopreencher serviços
                    </button>
                    <button
                      type="button"
                      className="primary-action"
                      disabled={!guardSchedule.slots.length}
                      onClick={() => {
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappSchedule)}`;
                        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                        setWhatsappOpened(true);
                        window.setTimeout(() => setWhatsappOpened(false), 2200);
                      }}
                    >
                      {whatsappOpened ? "WhatsApp aberto!" : "Enviar no WhatsApp"}
                    </button>
                    <button
                      type="button"
                      className="primary-action"
                      disabled={!guardSchedule.slots.length}
                      onClick={() => downloadScheduleImage(editableSchedule, selected, calendarTeam.group, serviceRows)}
                    >
                      Baixar imagem completa
                    </button>
                  </div>
                </div>
              )}
              </section>
            </details>
          </div>
        </div>
      )}
    </main>
  );
}

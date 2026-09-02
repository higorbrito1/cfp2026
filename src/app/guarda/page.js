"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildMonthCells,
  buildGuardSchedule,
  formatGuardDuration,
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

export default function GuardaPage() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(formatYmd(today));
  const [visibleMonth, setVisibleMonth] = useState(formatYmd(today).slice(0, 7));
  const [showTeam, setShowTeam] = useState(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("06:00");
  const [initialPosts, setInitialPosts] = useState({});
  const referenceDate = useMemo(() => parseYmd(REFERENCE_DATE), []);

  const selected = useMemo(() => parseYmd(selectedDate), [selectedDate]);
  const monthDate = useMemo(() => parseMonth(visibleMonth), [visibleMonth]);
  const selectedGroup = getGroupForDate(selected, referenceDate, REFERENCE_GROUP);
  const team = getTeamForDate(selected, referenceDate, REFERENCE_GROUP);
  const defaultPosts = useMemo(
    () => Object.fromEntries(team.roster.map((person, index) => [person.code, index < 3 ? String(index) : "-1"])),
    [team.roster]
  );
  useEffect(() => {
    setInitialPosts({});
  }, [team.group]);
  const assignedPosts = Object.keys(initialPosts).length ? initialPosts : defaultPosts;
  const guardSchedule = useMemo(
    () => buildGuardSchedule(startTime, endTime, assignedPosts, team.roster),
    [startTime, endTime, assignedPosts, team.roster]
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

  return (
    <main className="page-shell">
      <section className="feature-card calendar-card">
        <div className="panel-heading">
          <div>
            <p className="card-label">Escala de guarda</p>
            <h2>Calendário diário</h2>
          </div>
          <Link className="ghost-button home-link" href="/inicio">
            Voltar
          </Link>
        </div>

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

        <button type="button" className="primary-action" onClick={() => setShowTeam((value) => !value)}>
          {showTeam ? "Ocultar equipe de guarda" : "Ver equipe de guarda"}
        </button>

        {showTeam && (
          <section className="team-panel" aria-label="Equipe de guarda do dia">
            <div className="team-panel-header">
              <div>
                <p className="card-label">Equipe do dia</p>
                <h3>Grupo {team.group}</h3>
              </div>
              <div className="team-commander">
                <span>Comandante</span>
                <strong>
                  {team.commander ? `${team.commander.code} - ${team.commander.name}` : "Indisponível"}
                </strong>
              </div>
            </div>

            <ul className="team-list">
              {team.roster.map((person, index) => (
                <li
                  key={`${person.code}-${person.name}`}
                  className={index === team.commanderIndex ? "team-item is-commander" : "team-item"}
                >
                  <span>{person.code} -</span>
                  <strong>{person.name}</strong>
                  {index === team.commanderIndex && <small>Comandante da guarda</small>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="guard-schedule-panel" aria-labelledby="guard-schedule-title">
          <div className="panel-heading">
            <div>
              <p className="card-label">Rotação dos postos</p>
              <h2 id="guard-schedule-title">Configurar escala</h2>
            </div>
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

          <p className="schedule-help">A escala tem no mínimo 6 horários, com cada período de no máximo 2 horas e um integrante em cada posto. Os demais entram no rodízio para equilibrar as horas.</p>

          <div className="member-post-fields">
            {team.roster.map((person) => (
              <label key={person.code}>
                <span>{person.code} - {person.name}</span>
                <select
                  value={assignedPosts[person.code] ?? "-1"}
                  onChange={(event) => setInitialPosts((current) => ({
                    ...assignedPosts,
                    ...current,
                    [person.code]: event.target.value
                  }))}
                >
                  <option value="-1">Não inicia</option>
                  <option value="0">Começa no P1</option>
                  <option value="1">Começa no P2</option>
                  <option value="2">Começa no P3</option>
                </select>
              </label>
            ))}
          </div>

          {guardSchedule.error ? (
            <p className="schedule-error" role="alert">{guardSchedule.error}</p>
          ) : (
            <div className="rotation-list">
              <p className="schedule-summary">
                {guardSchedule.slots.length} períodos · {formatGuardDuration(guardSchedule.slots[0]?.duration || 0)} por período
              </p>
              {guardSchedule.slots.map((slot, index) => (
                <div className="rotation-row" key={`${slot.start}-${slot.end}`}>
                  <div className="rotation-time"><strong>{slot.start}–{slot.end}</strong><small>{formatGuardDuration(slot.duration)}</small></div>
                  {["P1", "P2", "P3"].map((post, postIndex) => (
                    <div className="rotation-post" key={post}>
                      <strong>{post}</strong>
                      <span>{slot.posts[postIndex].map((member) => member.name).join(", ") || "Sem membro"}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

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

            const today = isSameDay(cell.date, new Date());
            const group = getGroupForDate(cell.date, referenceDate, REFERENCE_GROUP);

            return (
              <button
                key={formatYmd(cell.date)}
                type="button"
                className={
                  cell.isSelected
                    ? "calendar-day is-selected"
                    : today
                    ? "calendar-day is-today"
                    : "calendar-day"
                }
                onClick={() => syncSelectedDate(formatYmd(cell.date))}
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
    </main>
  );
}

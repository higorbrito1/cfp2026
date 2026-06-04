"use client";

import { useMemo, useState } from "react";
import {
  buildMonthCells,
  formatLongDate,
  formatYmd,
  getGroupForDate,
  isSameDay,
  parseMonth,
  parseYmd,
  REFERENCE_DATE,
  REFERENCE_GROUP
} from "../../lib/scale";

export default function GuardaPage() {
  const [selectedDate, setSelectedDate] = useState(REFERENCE_DATE);
  const [visibleMonth, setVisibleMonth] = useState(REFERENCE_DATE.slice(0, 7));
  const referenceDate = useMemo(() => parseYmd(REFERENCE_DATE), []);

  const selected = useMemo(() => parseYmd(selectedDate), [selectedDate]);
  const monthDate = useMemo(() => parseMonth(visibleMonth), [visibleMonth]);
  const selectedGroup = getGroupForDate(selected, referenceDate, REFERENCE_GROUP);
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
            <h2>Calendario diário</h2>
          </div>
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

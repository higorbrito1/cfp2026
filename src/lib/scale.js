export const GROUPS = ["A", "B", "C", "D", "E", "F"];

export const REFERENCE_DATE = "2026-06-08";
export const REFERENCE_GROUP = "D";

export function getGroupForDate(date, referenceDate = parseYmd(REFERENCE_DATE), referenceGroup = REFERENCE_GROUP) {
  const referenceIndex = GROUPS.indexOf(referenceGroup);
  const offset = diffDays(referenceDate, date);
  const index = (referenceIndex + offset) % GROUPS.length;
  return GROUPS[(index + GROUPS.length) % GROUPS.length];
}

export function buildMonthCells(monthDate, referenceDate, referenceGroup, selectedDate) {
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

export function parseYmd(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function parseMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function diffDays(from, to) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatClock(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

export function formatWeekday(date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

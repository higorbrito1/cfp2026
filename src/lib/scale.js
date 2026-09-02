export const GROUPS = ["A", "B", "C", "D", "E", "F"];

export const COURSE_START_DATE = new Date(2026, 4, 5);
export const TOTAL_COURSE_WEEKS = 40;
export const STAGE_START_DATE = addDays(COURSE_START_DATE, TOTAL_COURSE_WEEKS * 7);

export const GROUP_ROSTERS = {
  A: [
    { code: "113", name: "HERNATZKI" },
    { code: "121", name: "NEVES" },
    { code: "211", name: "MATEUS" },
    { code: "216", name: "PRESS" },
    { code: "122", name: "MASSARENTI" },
    { code: "120", name: "ASBAHR" },
    { code: "107", name: "BIANCATO" },
    { code: "218", name: "CAMPOS" },
    { code: "115", name: "MARTINS" },
    { code: "103", name: "RAFAELA" }
  ],
  B: [
    { code: "225", name: "MENDONCA" },
    { code: "130", name: "SOUZA" },
    { code: "207", name: "AUGUSTO" },
    { code: "222", name: "MULLER" },
    { code: "205", name: "SILVA" },
    { code: "212", name: "QUEIROZ" },
    { code: "215", name: "FERMIANO" },
    { code: "226", name: "VANESSA" },
    { code: "114", name: "BASILIO" },
    { code: "228", name: "BREYNNER" }
  ],
  C: [
    { code: "110", name: "DOBBINS" },
    { code: "118", name: "RANGEL" },
    { code: "213", name: "EDUARDO IGOR" },
    { code: "106", name: "BOZELLI" },
    { code: "102", name: "PALMA" },
    { code: "111", name: "MARQUES" },
    { code: "129", name: "ALINE" },
    { code: "124", name: "LANZA" },
    { code: "105", name: "FERRONI" },
    { code: "108", name: "ALENCAR" }
  ],
  D: [
    { code: "220", name: "BELIZARIO" },
    { code: "217", name: "ARAUJO" },
    { code: "230", name: "JESSICA S." },
    { code: "202", name: "DIOGO" },
    { code: "221", name: "CORREIA" },
    { code: "126", name: "RAMOS" },
    { code: "127", name: "NOBRE" },
    { code: "224", name: "RAYSSA" },
    { code: "229", name: "ESCORPIONI" },
    { code: "208", name: "LADEIRA" }
  ],
  E: [
    { code: "125", name: "CASTANHEIRA" },
    { code: "101", name: "GOMES" },
    { code: "112", name: "MEURER" },
    { code: "117", name: "DOS SANTOS" },
    { code: "104", name: "ARCANJO" },
    { code: "128", name: "GALLETI" },
    { code: "119", name: "LOMES" },
    { code: "116", name: "AMARAL" },
    { code: "123", name: "SANTANA" },
    { code: "109", name: "RODRIGUES" }
  ],
  F: [
    { code: "209", name: "ALVES" },
    { code: "204", name: "CUCATO" },
    { code: "206", name: "YGOR ALVES" },
    { code: "210", name: "RONISE" },
    { code: "214", name: "MENIN" },
    { code: "203", name: "DORNELES" },
    { code: "223", name: "PARDINHO" },
    { code: "219", name: "GRAF" },
    { code: "201", name: "ALMEIDA" },
    { code: "227", name: "TRINDADE" }
  ]
};

export const REFERENCE_DATE = "2026-06-08";
export const REFERENCE_GROUP = "D";

export function getGroupForDate(date, referenceDate = parseYmd(REFERENCE_DATE), referenceGroup = REFERENCE_GROUP) {
  const referenceIndex = GROUPS.indexOf(referenceGroup);
  const offset = diffDays(referenceDate, date);
  const index = (referenceIndex + offset) % GROUPS.length;
  return GROUPS[(index + GROUPS.length) % GROUPS.length];
}

export function getCommanderForDate(date, referenceDate = parseYmd(REFERENCE_DATE), referenceGroup = REFERENCE_GROUP) {
  const group = getGroupForDate(date, referenceDate, referenceGroup);
  const roster = GROUP_ROSTERS[group] || [];
  const offset = diffDays(referenceDate, date);
  const startOffset = (GROUPS.indexOf(group) - GROUPS.indexOf(referenceGroup) + GROUPS.length) % GROUPS.length;
  const guardTurns = Math.floor((offset - startOffset) / GROUPS.length);
  const commanderIndex = mod(3 + guardTurns, roster.length || 1);
  return roster[commanderIndex] || null;
}

export function getTeamForDate(date, referenceDate = parseYmd(REFERENCE_DATE), referenceGroup = REFERENCE_GROUP) {
  const group = getGroupForDate(date, referenceDate, referenceGroup);
  const roster = GROUP_ROSTERS[group] || [];
  const commander = getCommanderForDate(date, referenceDate, referenceGroup);
  return {
    group,
    roster,
    commander,
    commanderIndex: commander ? roster.findIndex((person) => person.code === commander.code) : -1
  };
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

export function countRemainingGuardsForGroup(
  date,
  referenceDate = parseYmd(REFERENCE_DATE),
  referenceGroup = REFERENCE_GROUP,
  horizonDate = STAGE_START_DATE
) {
  const group = getGroupForDate(date, referenceDate, referenceGroup);
  const start = startOfDay(date);
  const end = startOfDay(horizonDate);

  if (start >= end) {
    return 0;
  }

  let count = 0;

  for (let cursor = addDays(start, 1); cursor <= end; cursor = addDays(cursor, 1)) {
    if (getGroupForDate(cursor, referenceDate, referenceGroup) === group) {
      count += 1;
    }
  }

  return count;
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

export function buildGuardSchedule(startTime, endTime, initialPosts, roster = [], autoFill = false) {
  const startMinutes = parseTime(startTime);
  let endMinutes = parseTime(endTime);

  if (startMinutes === null || endMinutes === null) {
    return { error: "Informe horários válidos.", slots: [] };
  }

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalMinutes = endMinutes - startMinutes;
  if (totalMinutes <= 0 || totalMinutes > 24 * 60) {
    return { error: "O período deve ter entre 1 minuto e 24 horas.", slots: [] };
  }

  const slotCount = Math.max(6, Math.ceil(totalMinutes / 120));
  const baseDuration = Math.floor(totalMinutes / slotCount);
  const extraMinutes = totalMinutes % slotCount;
  const slots = [];
  const initialMembers = [null, null, null];
  const initialCodes = new Set();

  Object.entries(initialPosts).forEach(([code, postIndex]) => {
    const index = Number(postIndex);
    if (index >= 0 && index < 3 && !initialMembers[index] && !initialCodes.has(code)) {
      const member = roster.find((person) => person.code === code);
      if (member) {
        initialMembers[index] = member;
        initialCodes.add(code);
      }
    }
  });

  const orderedRoster = [
    ...initialMembers.filter(Boolean),
    ...roster.filter((person) => !initialCodes.has(person.code))
  ];

  if (orderedRoster.length < 3) {
    return { error: "É necessário ter pelo menos 3 integrantes.", slots: [] };
  }

  let cursor = startMinutes;

  for (let index = 0; index < slotCount; index += 1) {
    const duration = baseDuration + (index < extraMinutes ? 1 : 0);
    const slotStart = cursor;
    const slotEnd = cursor + duration;
    const rotatedPosts = !autoFill && initialCodes.size === 0
      ? [[], [], []]
      : [0, 1, 2].map((postIndex) => {
        const memberIndex = (index * 3 + postIndex) % orderedRoster.length;
        const targetPost = (postIndex + index) % 3;
        return { targetPost, member: orderedRoster[memberIndex] };
      }).reduce((posts, { targetPost, member }) => {
        posts[targetPost].push(member);
        return posts;
      }, [[], [], []]);

    slots.push({
      start: formatTime(slotStart),
      end: formatTime(slotEnd),
      duration,
      posts: rotatedPosts
    });
    cursor = slotEnd;
  }

  return { error: "", slots, totalMinutes };
}

function parseTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes) {
  const normalized = totalMinutes % (24 * 60);
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatGuardDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours}h`;
  return `${hours}h${String(remainingMinutes).padStart(2, "0")}`;
}

export function formatGuardScheduleForWhatsApp(slots, date, group) {
  const lines = [
    `*ESCALA DE GUARDA*`,
    `${formatLongDate(date)} · Grupo ${group}`,
    ""
  ];

  slots.forEach((slot, index) => {
    lines.push(`*HORÁRIO ${index + 1}:* ${slot.start} às ${slot.end} (${formatGuardDuration(slot.duration)})`);
    ["P1", "P2", "P3"].forEach((post, postIndex) => {
      const members = slot.posts[postIndex].map((member) => `${member.code} - ${member.name}`).join(", ") || "Sem membro";
      lines.push(`${post}: ${members}`);
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

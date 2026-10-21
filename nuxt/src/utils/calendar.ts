export function parseCalendarMonth(
  value: unknown,
): { year: number; month: number; key: string } | null {
  if (
    typeof value !== 'string' ||
    !/^[1-9]\d{3}-(?:0[1-9]|1[0-2])$/.test(value)
  )
    return null;
  return {
    year: Number(value.slice(0, 4)),
    month: Number(value.slice(5)),
    key: value,
  };
}

export function shiftCalendarMonth(key: string, offset: -1 | 1): string | null {
  const current = parseCalendarMonth(key);
  if (!current) return null;
  const ordinal = current.year * 12 + current.month - 1 + offset;
  const year = Math.floor(ordinal / 12);
  if (year < 1000 || year > 9999) return null;
  return `${year}-${String((ordinal % 12) + 1).padStart(2, '0')}`;
}

export function monthWeeks(
  year: number,
  month: number,
): Array<Array<string | null>> {
  const firstWeekday =
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from(
    { length: Math.ceil((firstWeekday + days) / 7) * 7 },
    (_, index) => {
      const day = index - firstWeekday + 1;
      return day < 1 || day > days
        ? null
        : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },
  );
  return Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );
}

const luminance = (hex: string): number => {
  const channels = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
};

export function calendarTextColor(background: string): string {
  const light = luminance(background);
  const navy = luminance('#0e2138');
  const navyContrast =
    (Math.max(light, navy) + 0.05) / (Math.min(light, navy) + 0.05);
  const whiteContrast = 1.05 / (light + 0.05);
  if (Math.max(whiteContrast, navyContrast) < 4.5) return '#000000';
  return whiteContrast > navyContrast ? '#ffffff' : '#0e2138';
}

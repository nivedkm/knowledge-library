const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatRelativeDate(value: string): string {
  const differenceInSeconds = (new Date(value).getTime() - Date.now()) / 1000;
  const intervals: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, seconds] of intervals) {
    if (Math.abs(differenceInSeconds) >= seconds) {
      return relativeFormatter.format(
        Math.round(differenceInSeconds / seconds),
        unit,
      );
    }
  }

  return "just now";
}


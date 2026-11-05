const HEADER_PATTERN = /^(\w{3} \d{2} \d{2}:\d{2}:\d{2}\.\d+)\s+(\w+)\s+(.*)$/;
const FIELD_PATTERN = /^\s*([\w-]+): (.*)$/;

export const STARTUP_FIELDS = [
  "method",
  "url",
  "path",
  "content-type",
  "route",
  "rank",
  "auto_log",
  "auto_log_overlaps",
];

export const REQUEST_FIELDS = [
  "size",
  "uri",
  "method",
  "path",
  "route",
  "rank",
  "code",
  "reason",
  "content-type",
  "user-agent",
];

// A segment without "key: " belongs to the previous value (e.g. commas inside user-agent).
function parseLine(line) {
  const [head, ...segments] = line.split(",");
  const header = HEADER_PATTERN.exec(head);
  const entry = header
    ? { time: header[1], level: header[2], message: header[3] }
    : { time: "", level: "", message: head };
  const fields = {};
  let lastKey = null;
  segments.forEach((segment) => {
    const match = FIELD_PATTERN.exec(segment);
    if (match) {
      lastKey = match[1];
      fields[lastKey] = match[2];
    } else if (lastKey) {
      fields[lastKey] += `,${segment}`;
    }
  });
  return { ...entry, fields };
}

function toRow(entry, knownFields) {
  const details = Object.entries(entry.fields)
    .filter(([key]) => !knownFields.includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return { ...entry, details };
}

// Startup = every line before the first Request/Response line.
export function parseLogs(text) {
  const entries = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map(parseLine);
  const firstRequest = entries.findIndex(
    (e) => e.message === "Request" || e.message === "Response",
  );
  const split = firstRequest === -1 ? entries.length : firstRequest;
  return {
    startup: entries.slice(0, split).map((e) => toRow(e, STARTUP_FIELDS)),
    requests: entries.slice(split).map((e) => toRow(e, REQUEST_FIELDS)),
  };
}

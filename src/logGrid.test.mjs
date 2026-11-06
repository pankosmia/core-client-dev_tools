import assert from "node:assert/strict";
import { test } from "node:test";
import { getGridStringOperators } from "@mui/x-data-grid";
import { readFileSync } from "node:fs";
import { gridLocaleText, logGridColumns, toggleSelection } from "./logGrid.js";
import { parseLogs, REQUEST_FIELDS, STARTUP_FIELDS } from "./parseLogs.js";

const { startup, requests } = parseLogs([
  "Nov 06 10:00:00.000 WARN Route overlap, url: /api",
  "Nov 06 10:00:01.000 INFO Request, method: GET, uri: /api",
  "Nov 06 10:00:02.000 ERROR Response, code: 500, reason: Internal Server Error, trace: abc",
].join("\n"));
const columns = logGridColumns(REQUEST_FIELDS);

test("all log fields are available with raw names and time cannot be hidden", () => {
  assert.deepEqual(
    columns.map(({ field }) => field),
    ["time", "level", "message", ...REQUEST_FIELDS, "details"],
  );
  assert.equal(columns[0].hideable, false);
  assert.ok(columns.slice(1).every(({ hideable }) => hideable));
  assert.ok(columns.every(({ field, headerName }) => headerName === field));
});

test("columns share the available width", () => {
  assert.ok(columns.every(({ flex, width }) => flex === 1 && width === undefined));
  assert.ok(columns.every(({ minWidth }) => minWidth > 0));
});

test("column values expose nested fields and unknown details to DataGrid", () => {
  const value = (field, row) =>
    columns.find((column) => column.field === field).valueGetter(undefined, row);
  assert.equal(value("level", requests[1]), "ERROR");
  assert.equal(value("code", requests[1]), "500");
  assert.equal(value("details", requests[1]), "trace: abc");
  assert.equal(value("code", requests[0]), "");
});

test("native DataGrid string operators filter parsed logs", () => {
  const column = columns.find(({ field }) => field === "reason");
  for (const [operator, value, expected] of [
    ["contains", "server", true],
    ["equals", "Internal Server Error", true],
    ["startsWith", "Internal", true],
    ["endsWith", "Error", true],
    ["equals", "OK", false],
    ["isEmpty", undefined, false],
  ]) {
    const apply = getGridStringOperators()
      .find((item) => item.value === operator)
      .getApplyFilterFn({ field: "reason", operator, value }, column);
    assert.ok(apply);
    assert.equal(apply(column.valueGetter(undefined, requests[1])), expected);
  }
  const isEmpty = getGridStringOperators()
    .find(({ value }) => value === "isEmpty")
    .getApplyFilterFn({ field: "reason", operator: "isEmpty" }, column);
  assert.equal(isEmpty(column.valueGetter(undefined, requests[0])), true);
});

test("sorting preserves natural numeric comparison", () => {
  const column = columns.find(({ field }) => field === "code");
  assert.ok(column.sortComparator("50", "200") < 0);
  assert.equal(column.sortComparator("", ""), 0);
});

test("startup columns expose their own nested fields", () => {
  const column = logGridColumns(STARTUP_FIELDS)
    .find(({ field }) => field === "url");
  assert.equal(column.valueGetter(undefined, startup[0]), "/api");
});

const metadata = JSON.parse(
  readFileSync(new URL("../pankosmia_metadata.json", import.meta.url), "utf8"),
);

function translator(lang) {
  const used = new Set();
  const text = (key, values = []) => {
    used.add(key);
    const entry = metadata.i18n[key];
    assert.ok(entry?.en && entry?.fr, `missing en/fr translation for ${key}`);
    return entry[lang].replace(/%(\d+)%/g, (_m, n) => values[n - 1]);
  };
  return { text, used };
}

test("every DataGrid text comes from i18n metadata in English and French", () => {
  const { text, used } = translator("fr");
  const locale = gridLocaleText(text);
  locale.toolbarFiltersTooltipActive(1);
  locale.toolbarFiltersTooltipActive(2);
  locale.columnMenuAriaLabel("code");
  locale.paginationDisplayedRows({ from: 1, to: 25, count: 80 });
  ["first", "last", "next", "previous"].forEach(locale.paginationItemAriaLabel);
  const declared = Object.keys(metadata.i18n).filter((key) => key.startsWith("grid_"));
  assert.deepEqual([...used].sort(), declared.sort());
});

test("French DataGrid texts are interpolated", () => {
  const locale = gridLocaleText(translator("fr").text);
  assert.equal(locale.filterPanelOperator, "Opérateur");
  assert.equal(locale.filterOperatorContains, "contient");
  assert.equal(locale.toolbarFiltersTooltipActive(1), "1 filtre actif");
  assert.equal(locale.toolbarFiltersTooltipActive(3), "3 filtres actifs");
  assert.equal(locale.columnMenuAriaLabel("code"), "Menu de la colonne code");
  assert.equal(
    locale.paginationDisplayedRows({ from: 1, to: 25, count: 80 }),
    "1–25 sur 80",
  );
  assert.equal(locale.paginationItemAriaLabel("next"), "Aller à la page suivante");
});

test("clicking a row selects it and clicking it again deselects it", () => {
  assert.equal(toggleSelection(null, 3), 3);
  assert.equal(toggleSelection(3, 3), null);
  assert.equal(toggleSelection(3, 0), 0);
  assert.equal(toggleSelection(0, 0), null);
});

const GRID_TEXT_KEYS = {
  noRowsLabel: "grid_no_rows",
  noResultsOverlayLabel: "grid_no_results",
  toolbarColumns: "grid_columns",
  toolbarColumnsLabel: "grid_columns",
  toolbarFilters: "grid_filters",
  toolbarFiltersLabel: "grid_show_filters",
  toolbarQuickFilterPlaceholder: "grid_search_placeholder",
  toolbarQuickFilterLabel: "grid_search",
  toolbarQuickFilterDeleteIconLabel: "grid_clear",
  columnsManagementSearchTitle: "grid_search",
  columnsManagementNoColumns: "grid_no_columns",
  columnsManagementShowHideAllText: "grid_show_hide_all",
  columnsManagementReset: "grid_reset",
  columnsManagementDeleteIconLabel: "grid_clear",
  filterPanelAddFilter: "grid_add_filter",
  filterPanelRemoveAll: "grid_remove_all",
  filterPanelDeleteIconLabel: "grid_delete",
  filterPanelOperator: "grid_operator",
  filterPanelColumn: "grid_column",
  filterPanelInputLabel: "grid_value",
  filterPanelInputPlaceholder: "grid_value_placeholder",
  filterOperatorContains: "grid_contains",
  filterOperatorDoesNotContain: "grid_does_not_contain",
  filterOperatorEquals: "grid_equals",
  filterOperatorDoesNotEqual: "grid_does_not_equal",
  filterOperatorStartsWith: "grid_starts_with",
  filterOperatorEndsWith: "grid_ends_with",
  filterOperatorIsEmpty: "grid_is_empty",
  filterOperatorIsNotEmpty: "grid_is_not_empty",
  filterOperatorIsAnyOf: "grid_is_any_of",
  columnMenuLabel: "grid_menu",
  columnMenuShowColumns: "grid_show_columns",
  columnMenuManageColumns: "grid_manage_columns",
  columnMenuFilter: "grid_filter",
  columnMenuHideColumn: "grid_hide_column",
  columnMenuUnsort: "grid_unsort",
  columnMenuSortAsc: "grid_sort_asc",
  columnMenuSortDesc: "grid_sort_desc",
  columnHeaderFiltersLabel: "grid_show_filters",
  columnHeaderSortIconLabel: "grid_sort",
  paginationRowsPerPage: "grid_rows_per_page",
};

const PAGE_KEYS = {
  first: "grid_first_page",
  last: "grid_last_page",
  next: "grid_next_page",
  previous: "grid_previous_page",
};

// text(key, values) returns the translation of key, with %1%, %2%… replaced by values.
export function gridLocaleText(text) {
  const activeFilters = (count) =>
    text(count === 1 ? "grid_active_filter" : "grid_active_filters", [
      String(count),
    ]);
  return {
    ...Object.fromEntries(
      Object.entries(GRID_TEXT_KEYS).map(([gridKey, key]) => [gridKey, text(key)]),
    ),
    toolbarFiltersTooltipActive: activeFilters,
    columnHeaderFiltersTooltipActive: activeFilters,
    columnMenuAriaLabel: (columnName) =>
      text("grid_column_menu", [String(columnName)]),
    paginationDisplayedRows: ({ from, to, count }) =>
      text("grid_displayed_rows", [String(from), String(to), String(count)]),
    paginationItemAriaLabel: (type) => text(PAGE_KEYS[type] ?? PAGE_KEYS.previous),
  };
}

export function toggleSelection(selectedId, id) {
  return selectedId === id ? null : id;
}

export function logGridColumns(fields) {
  return ["time", "level", "message", ...fields, "details"].map((field) => ({
    field,
    headerName: field,
    type: "string",
    flex: 1,
    minWidth: field === "time" ? 170 : 100,
    hideable: field !== "time",
    valueGetter: (_value, row) =>
      (fields.includes(field) ? row.fields[field] : row[field]) ?? "",
    sortComparator: (a, b) =>
      String(a).localeCompare(String(b), undefined, { numeric: true }),
  }));
}

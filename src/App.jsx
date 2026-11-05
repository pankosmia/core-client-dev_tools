import { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import Check from "@mui/icons-material/Check";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { doI18n } from "pankosmia-lib/i18n";
import { getText } from "pankosmia-lib/http";
import { i18nContext, PanMenuWrapper, ScrollableBody } from "pankosmia-rcl";
import { parseLogs, REQUEST_FIELDS, STARTUP_FIELDS } from "./parseLogs";

const LOGS_URL = "/api/system/log";
const I18N_COLUMNS = ["time", "level", "message", "details"];
const STARTUP_VISIBLE = ["time", "url", "details"];
const REQUESTS_VISIBLE = [
  "time",
  "uri",
  "method",
  "reason",
  "content-type",
  "details",
];

function columnLabel(col, i18nRef) {
  return I18N_COLUMNS.includes(col)
    ? doI18n(`pages:dev_tools:${col}`, i18nRef.current)
    : col;
}

function TabPanel({ value, index, children }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {children}
    </div>
  );
}

function LogTable({ title, rows, fields, visibleColumns, i18nRef }) {
  const allColumns = ["time", "level", "message", ...fields, "details"];
  const [hiddenFields, setHiddenFields] = useState(() =>
    allColumns.filter((col) => !visibleColumns.includes(col)),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sort, setSort] = useState({ column: null, direction: "asc" });
  // time is always shown, so it is not offered in the menu
  const columns = allColumns.filter((col) => !hiddenFields.includes(col));
  const toggleableColumns = allColumns.filter((col) => col !== "time");

  const cellValue = (row, col) =>
    (fields.includes(col) ? row.fields[col] : row[col]) ?? "";

  const sortedRows = sort.column
    ? [...rows].sort((a, b) => {
        const result = String(cellValue(a, sort.column)).localeCompare(
          String(cellValue(b, sort.column)),
          undefined,
          { numeric: true },
        );
        return sort.direction === "asc" ? result : -result;
      })
    : rows;

  const handleSort = (col) => {
    setSort((prev) =>
      prev.column === col && prev.direction === "asc"
        ? { column: col, direction: "desc" }
        : { column: col, direction: "asc" },
    );
  };

  const handleToggle = (col) => {
    setHiddenFields((prev) =>
      prev.includes(col) ? prev.filter((item) => item !== col) : [...prev, col],
    );
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">
          {title} ({rows.length})
        </Typography>
        <IconButton
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
            setIsOpen(true);
          }}
        >
          <ViewColumnIcon />
        </IconButton>
        <PanMenuWrapper
          anchorEl={anchorEl}
          setIsOpen={setIsOpen}
          isOpen={isOpen}
        >
          {toggleableColumns.map((col) => (
            <MenuItem
              key={col}
              onClick={() => handleToggle(col)}
              selected={!hiddenFields.includes(col)}
            >
              <ListItemIcon>
                {!hiddenFields.includes(col) ? <Check fontSize="small" /> : null}
              </ListItemIcon>
              <ListItemText>{columnLabel(col, i18nRef)}</ListItemText>
            </MenuItem>
          ))}
        </PanMenuWrapper>
      </Box>
      <TableContainer sx={{ maxHeight: "calc(100vh - 220px)" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sort.column === col}
                    direction={sort.column === col ? sort.direction : "asc"}
                    onClick={() => handleSort(col)}
                  >
                    {columnLabel(col, i18nRef)}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      fontFamily: "monospace",
                      wordBreak: "break-word",
                      verticalAlign: "top",
                    }}
                  >
                    {cellValue(row, col)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function App() {
  const { i18nRef } = useContext(i18nContext);
  const [logs, setLogs] = useState({ startup: [], requests: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    const response = await getText(LOGS_URL);
    if (response.ok) {
      setLogs(parseLogs(response.text));
    } else {
      setLogs({ startup: [], requests: [] });
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const isEmpty = logs.startup.length === 0 && logs.requests.length === 0;

  return (
    <ScrollableBody>
      <Box sx={{ mx: 2, my: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchLogs}
            disabled={loading}
          >
            {doI18n("pages:dev_tools:refresh", i18nRef.current)}
          </Button>
          {loading && <CircularProgress size={24} />}
        </Box>
        {error && (
          <Alert severity="error">
            {doI18n("pages:dev_tools:load_error", i18nRef.current)}
          </Alert>
        )}
        {!error && !loading && isEmpty && (
          <Typography>
            {doI18n("pages:dev_tools:no_logs", i18nRef.current)}
          </Typography>
        )}
        {!isEmpty && (
          <>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs
                value={tab}
                onChange={(event, newValue) => setTab(newValue)}
                textColor="secondary"
                indicatorColor="secondary"
              >
                <Tab
                  label={doI18n(
                    "pages:dev_tools:startup_title",
                    i18nRef.current,
                  )}
                />
                <Tab
                  label={doI18n(
                    "pages:dev_tools:requests_title",
                    i18nRef.current,
                  )}
                />
              </Tabs>
            </Box>
            <TabPanel value={tab} index={0}>
              <LogTable
                title={doI18n(
                  "pages:dev_tools:startup_title",
                  i18nRef.current,
                )}
                rows={logs.startup}
                fields={STARTUP_FIELDS}
                visibleColumns={STARTUP_VISIBLE}
                i18nRef={i18nRef}
              />
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <LogTable
                title={doI18n(
                  "pages:dev_tools:requests_title",
                  i18nRef.current,
                )}
                rows={logs.requests}
                fields={REQUEST_FIELDS}
                visibleColumns={REQUESTS_VISIBLE}
                i18nRef={i18nRef}
              />
            </TabPanel>
          </>
        )}
      </Box>
    </ScrollableBody>
  );
}

export default App;

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";
import { doI18n } from "pankosmia-lib/i18n";
import { getText } from "pankosmia-lib/http";
import { i18nContext, ScrollableBody } from "pankosmia-rcl";
import { parseLogs, REQUEST_FIELDS, STARTUP_FIELDS } from "./parseLogs";
import { gridLocaleText, logGridColumns, toggleSelection } from "./logGrid";

const LOGS_URL = "/api/system/log";
const SELECTED_ROW_CLASS = "log-row--selected";
const STARTUP_VISIBLE = ["time", "url", "details"];
const REQUESTS_VISIBLE = [
  "time",
  "uri",
  "method",
  "reason",
  "content-type",
  "details",
];

function TabPanel({ value, index, children }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {children}
    </div>
  );
}

function LogTable({ title, rows, fields, visibleColumns, i18nRef }) {
  const translations = i18nRef.current;
  const columns = useMemo(() => logGridColumns(fields), [fields]);
  const gridRows = useMemo(
    () => rows.map((row, id) => ({ ...row, id })),
    [rows],
  );
  const localeText = useMemo(
    () =>
      gridLocaleText((key, values = []) =>
        doI18n(`pages:dev_tools:${key}`, translations).replace(
          /%(\d+)%/g,
          (placeholder, position) => values[position - 1] ?? placeholder,
        ),
      ),
    [translations],
  );
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId !== null && selectedId < rows.length;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title} ({rows.length})
      </Typography>
      <Box sx={{ height: "max(320px, calc(100vh - 250px))", width: "100%" }}>
        <DataGrid
          aria-label={title}
          rows={gridRows}
          columns={columns}
          density="compact"
          showToolbar
          rowSelection={false}
          onRowClick={({ id }) => setSelectedId((prev) => toggleSelection(prev, id))}
          getRowClassName={({ id }) =>
            selected && id === selectedId ? SELECTED_ROW_CLASS : ""
          }
          getRowHeight={() => "auto"}
          pageSizeOptions={[25, 50, 100]}
          localeText={localeText}
          initialState={{
            columns: {
              columnVisibilityModel: Object.fromEntries(
                columns.map(({ field }) => [field, visibleColumns.includes(field)]),
              ),
            },
            filter: {
              filterModel: { items: [], quickFilterExcludeHiddenColumns: false },
            },
            pagination: { paginationModel: { pageSize: 100, page: 0 } },
          }}
          slotProps={{
            toolbar: {
              csvOptions: { disableToolbarButton: true },
              printOptions: { disableToolbarButton: true },
            },
          }}
          sx={{
            "& .MuiDataGrid-cell": {
              fontFamily: "monospace",
              whiteSpace: "normal",
              wordBreak: "break-word",
              py: 1,
            },
            "& .MuiDataGrid-row": { cursor: "pointer" },
            [`& .${SELECTED_ROW_CLASS}, & .${SELECTED_ROW_CLASS}:hover`]: {
              backgroundColor: (theme) =>
                alpha(theme.palette.secondary.main, 0.3),
            },
          }}
        />
      </Box>
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

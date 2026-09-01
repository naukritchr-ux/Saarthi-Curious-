import test from "node:test";
import assert from "node:assert/strict";
import { buildApiUrl } from "./reportsService.js";

test("buildApiUrl appends user_id for authenticated requests", () => {
  const url = buildApiUrl("/reports/ai-summary", {}, 42);
  assert.equal(url, "http://127.0.0.1:8000/reports/ai-summary?user_id=42");
});

test("buildApiUrl preserves existing query params", () => {
  const url = buildApiUrl(
    "/reports/preview/my_learning_report",
    { period_start: "2024-01-01" },
    7,
  );
  assert.equal(
    url,
    "http://127.0.0.1:8000/reports/preview/my_learning_report?period_start=2024-01-01&user_id=7",
  );
});

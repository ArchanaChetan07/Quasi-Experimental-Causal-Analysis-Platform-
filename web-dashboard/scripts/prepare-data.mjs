// Converts the raw analysis outputs (CSV/TXT produced by the Python
// pipeline) into a single JSON bundle that the Next.js app serves via
// /api/results. Run with `npm run prepare-data` whenever the upstream
// analysis is re-run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "analysis-source");
const OUT = path.join(__dirname, "..", "data", "results.json");

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      const raw = (values[i] ?? "").trim();
      const num = Number(raw);
      row[h] = raw !== "" && !Number.isNaN(num) ? num : raw;
    });
    return row;
  });
}

function readCSV(name) {
  const p = path.join(SRC, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing expected analysis output: ${name}`);
  }
  const rows = parseCSV(fs.readFileSync(p, "utf-8"));
  if (rows.length === 0) {
    throw new Error(`Analysis output is empty: ${name}`);
  }
  return rows;
}

function readText(name) {
  const p = path.join(SRC, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing expected analysis output: ${name}`);
  }
  return fs.readFileSync(p, "utf-8");
}

function matchNumber(text, regex) {
  const m = text.match(regex);
  return m ? Number(m[1]) : null;
}

function matchCI(text, regex) {
  const m = text.match(regex);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function requireNumber(value, label) {
  if (value === null || Number.isNaN(value)) {
    throw new Error(`Failed to parse required number: ${label}`);
  }
  return value;
}

function requireCI(value, label) {
  if (!value || value.length !== 2 || value.some((n) => Number.isNaN(n))) {
    throw new Error(`Failed to parse required CI: ${label}`);
  }
  return value;
}

const twfeText = readText("twfe_result.txt");
const ptText = readText("parallel_trends_test.txt");
const psmText = readText("psm_summary.txt");
const pretrendText = readText("cohort_pretrend_pvalues.txt");

const twfe = {
  att: requireNumber(
    matchNumber(twfeText, /ATT estimate \(log points\):\s*(-?\d+\.?\d*)/),
    "twfe.att",
  ),
  se: requireNumber(
    matchNumber(twfeText, /SE \(clustered by market\):\s*(-?\d+\.?\d*)/),
    "twfe.se",
  ),
  ci: requireCI(matchCI(twfeText, /95% CI:\s*\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/), "twfe.ci"),
  impliedPct: requireNumber(
    matchNumber(twfeText, /Implied %+ effect on GMV:\s*(-?\d+\.?\d*)/),
    "twfe.impliedPct",
  ),
};

const pValue = requireNumber(matchNumber(ptText, /p-value:\s*(-?\d+\.?\d*)/), "parallelTrends.pValue");

const cohortPretrendPValues = pretrendText
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    const m = line.match(/^(\w+):\s*pre-trend joint p-value = (-?\d+\.?\d*)/);
    return m ? { cohort: m[1], pValue: Number(m[2]) } : null;
  })
  .filter(Boolean);

if (cohortPretrendPValues.length === 0) {
  throw new Error("Failed to parse cohort_pretrend_pvalues.txt");
}

const bundle = {
  generatedAt: new Date().toISOString(),
  eventStudy: {
    pooled: readCSV("event_study_pooled.csv"),
    early: readCSV("event_study_early.csv"),
    mid: readCSV("event_study_mid.csv"),
    late: readCSV("event_study_late.csv"),
  },
  cohortAtt: readCSV("cohort_clean_att.csv"),
  psm: {
    balanceBefore: readCSV("psm_balance_before.csv"),
    balanceAfter: readCSV("psm_balance_after.csv"),
    matchedPairs: readCSV("psm_matched_pairs.csv"),
  },
  summary: {
    twfe,
    parallelTrends: {
      fStat: requireNumber(matchNumber(ptText, /F-statistic:\s*(-?\d+\.?\d*)/), "parallelTrends.fStat"),
      pValue,
      rejected: ptText.includes("REJECT") || pValue < 0.05,
    },
    cohortPretrendPValues,
    psm: {
      att: requireNumber(
        matchNumber(psmText, /ATT \(post-period log GMV\).*matching:\s*(-?\d+\.?\d*)/),
        "psm.att",
      ),
      se: requireNumber(matchNumber(psmText, /^SE:\s*(-?\d+\.?\d*)/m), "psm.se"),
      ci: requireCI(matchCI(psmText, /95%+ CI:\s*\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/), "psm.ci"),
      impliedPct: requireNumber(
        matchNumber(psmText, /Implied %+ effect:\s*(-?\d+\.?\d*)/),
        "psm.impliedPct",
      ),
    },
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(bundle, null, 2));
console.log(`Wrote ${OUT}`);

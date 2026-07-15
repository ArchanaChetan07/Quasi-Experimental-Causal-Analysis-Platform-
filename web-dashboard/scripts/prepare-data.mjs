// Converts the raw analysis outputs (CSV/TXT produced by the Python
// pipeline in `causal_project/code/`) into a single JSON bundle that the
// Next.js app serves via /api/results. Run with `npm run prepare-data`
// whenever the upstream analysis is re-run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "analysis-source");
const OUT = path.join(__dirname, "..", "data", "results.json");

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      const raw = values[i];
      const num = Number(raw);
      row[h.trim()] = raw !== "" && !Number.isNaN(num) ? num : raw;
    });
    return row;
  });
}

function readCSV(name) {
  const p = path.join(SRC, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing expected analysis output: ${name}`);
  }
  return parseCSV(fs.readFileSync(p, "utf-8"));
}

function readText(name) {
  const p = path.join(SRC, name);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
}

// Precise extractors for known, fixed-format lines (more reliable than a
// generic "first number after label" search when a line contains several
// numbers, e.g. "SE: 0.0234" vs "SE (clustered by market): 0.0234").
function matchNumber(text, regex) {
  const m = text.match(regex);
  return m ? Number(m[1]) : null;
}

function matchCI(text, regex) {
  const m = text.match(regex);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

const twfeText = readText("twfe_result.txt");
const ptText = readText("parallel_trends_test.txt");
const psmText = readText("psm_summary.txt");

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
    twfe: {
      att: matchNumber(twfeText, /ATT estimate \(log points\):\s*(-?\d+\.?\d*)/),
      se: matchNumber(twfeText, /SE \(clustered by market\):\s*(-?\d+\.?\d*)/),
      ci: matchCI(twfeText, /95% CI:\s*\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/),
      impliedPct: matchNumber(twfeText, /Implied %+ effect on GMV:\s*(-?\d+\.?\d*)/),
    },
    parallelTrends: {
      fStat: matchNumber(ptText, /F-statistic:\s*(-?\d+\.?\d*)/),
      pValue: matchNumber(ptText, /p-value:\s*(-?\d+\.?\d*)/),
      rejected: ptText.includes("REJECT"),
    },
    cohortPretrendPValues: readText("cohort_pretrend_pvalues.txt")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(\w+):\s*pre-trend joint p-value = (-?\d+\.?\d*)/);
        return m ? { cohort: m[1], pValue: Number(m[2]) } : null;
      })
      .filter(Boolean),
    psm: {
      att: matchNumber(psmText, /ATT \(post-period log GMV\).*matching:\s*(-?\d+\.?\d*)/),
      se: matchNumber(psmText, /^SE:\s*(-?\d+\.?\d*)/m),
      ci: matchCI(psmText, /95%+ CI:\s*\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/),
      impliedPct: matchNumber(psmText, /Implied %+ effect:\s*(-?\d+\.?\d*)/),
    },
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(bundle, null, 2));
console.log(`Wrote ${OUT}`);

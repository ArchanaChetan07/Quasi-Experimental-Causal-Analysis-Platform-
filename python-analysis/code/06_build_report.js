const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, AlignmentType, Header, Footer,
  PageNumber
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const FIG = path.join(ROOT, "figures");
const OUT = path.join(ROOT, "output");
fs.mkdirSync(OUT, { recursive: true });

function h1(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } }); }
function h2(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }); }
function p(text, opts = {}) { return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } }); }
function pRuns(runs, opts = {}) { return new Paragraph({ children: runs, spacing: { after: 120 }, ...opts }); }
function bullet(text) { return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } }); }

function img(path, width, height) {
  const data = fs.readFileSync(path);
  return new Paragraph({
    children: [new ImageRun({ data, transformation: { width, height }, type: "png" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120, before: 120 },
  });
}

function caption(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 20, color: "555555" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "2E4057" } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), bold: !!opts.header, color: opts.header ? "FFFFFF" : "000000", size: 20 })],
    })],
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function table(headers, rows, widths) {
  const headerRow = new TableRow({ children: headers.map((h_, i) => cell(h_, { header: true, width: widths[i] })) });
  const bodyRows = rows.map(r => new TableRow({ children: r.map((v, i) => cell(v, { width: widths[i] })) }));
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

const doc = new Document({
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        children: [new TextRun({ text: "Causal Inference Beyond A/B Testing", size: 18, color: "888888" })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })],
      })] }),
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "Causal Inference Beyond A/B Testing", bold: true, size: 44, color: "1A2B4C" })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Estimating the Effect of a Staggered Marketplace Feature Rollout Without Randomization", italics: true, size: 26, color: "444444" })],
        spacing: { after: 400 },
      }),

      h1("1. Executive Summary"),
      p("This project estimates the causal effect of a marketplace feature (an \"instant checkout\" capability) that was rolled out to geographic markets in three waves rather than through a randomized experiment. Because rollout timing was chosen by the product team \u2014 not assigned randomly \u2014 a naive before/after or pooled difference-in-differences (DiD) comparison risks confounding the treatment effect with pre-existing differences in market trajectories."),
      p("Using a difference-in-differences design with explicit parallel-trends testing, and propensity score matching (PSM) as a robustness check, we find:"),
      bullet("A naive pooled two-way-fixed-effects (TWFE) DiD estimate suggests a +15.6% effect on GMV \u2014 but this estimate is built on a violated parallel-trends assumption and is not trustworthy as stated."),
      bullet("Splitting by rollout cohort reveals the 'early' cohort was launched in markets that were already accelerating before go-live (a textbook selection confound). Its event-study pre-trend is clearly non-flat, and its naive DiD estimate (+22.7%) is inflated by this pre-existing trend, not just the feature."),
      bullet("The 'mid' and 'late' cohorts, launched on an engineering-capacity schedule, show much smaller (and more plausible) pre-trend deviations. Their cohort-specific estimates (+8.3% and +6.3%) are the more credible readout of the feature's true effect, which by simulation construction is +9%, +8%, and +6% for the three cohorts respectively \u2014 i.e., the cohort-robust estimator recovers the truth much more closely than pooled TWFE."),
      bullet("A propensity-score-matched cross-sectional comparison, built only from pre-period market averages/trends/volatility, gives a directionally similar but far less precise estimate (+11.7%, 95% CI roughly \u22124% to +30%), and covariate balance remains imperfect after matching \u2014 a warning sign that PSM's identifying assumption (selection on observables) is not fully met here either."),
      p("The bottom line: the headline number depends heavily on method and on which assumption tests are run. We do not present a single causal estimate as unconditionally valid; we present a range bounded by what the assumption tests can and cannot rule out."),

      h1("2. Scenario and Method Selection Rationale"),
      h2("2.1 Why not a simple A/B test?"),
      p("Feature rollouts of this kind are frequently launched market-by-market for engineering, support-capacity, and go-to-market reasons \u2014 not via random assignment. In our scenario, 24 of 40 markets eventually received the feature across three launch waves (week 30, week 55, week 75 of a 104-week panel); 16 markets never received it. Random assignment was never performed, and re-running the rollout as a true experiment was not an option after the fact, which is common in industry settings: leadership will not delay or randomize a launch for the sake of measurement purity. This rules out a standard A/B test and motivates quasi-experimental methods."),
      h2("2.2 Why difference-in-differences?"),
      p("We have panel data: weekly GMV for every market both before and after each cohort's launch, plus a set of markets that never launched. DiD is the natural first choice because it can net out (a) fixed differences between markets (via market fixed effects) and (b) common time shocks affecting all markets equally (via week fixed effects), isolating the change in treated markets' trajectories relative to untreated markets' trajectories around each launch."),
      p("However, staggered adoption is a known trap for the 'naive' two-way-fixed-effects DiD regression: when treatment effects are dynamic or heterogeneous across cohorts (as they are here \u2014 effects ramp in over 4 weeks and differ by cohort), the standard TWFE estimator implicitly uses already-treated units as comparison groups for later-treated units, which can bias the pooled estimate (the 'forbidden comparisons' problem documented in the Goodman-Bacon decomposition and the Callaway & Sant'Anna / de Chaisemartin & D'Haultf\u0153uille literature). We address this two ways: (i) an event-study specification to directly test parallel trends, run both pooled and separately per cohort; and (ii) a heterogeneity-robust estimator that compares each cohort only to not-yet-treated / never-treated markets over the same calendar window, then aggregates."),
      h2("2.3 Why also propensity score matching?"),
      p("DiD requires a clean pre-treatment panel. Many real analyses only have a post-period cross-section (e.g., a dashboard snapshot, or data retention limits). To illustrate what happens under that tighter constraint, we separately construct a cross-sectional matching exercise: match 'ever-treated' markets to 'never-treated' markets on pre-period observable characteristics (pre-period mean GMV, GMV trend, and GMV volatility), then compare post-period outcomes. This tests a different assumption \u2014 selection on observables \u2014 and lets us contrast two independent threats to validity side by side."),

      h1("3. Data"),
      p("We simulate a 40-market, 104-week weekly panel (see code/01_simulate_data.py for full generative model and random seed). Key design features, chosen specifically to create a realistic and instructive validity problem:"),
      bullet("8 markets launch in week 30 ('early'), 8 in week 55 ('mid'), 8 in week 75 ('late'), 16 never launch ('never-treated' control)."),
      bullet("True treatment effect on log(GMV) ramps in linearly over 4 weeks post-launch, then plateaus at +9% (early), +8% (mid), or +6% (late) \u2014 the ground truth we try to recover."),
      bullet("Common weekly shocks and mild seasonality affect all markets equally (absorbed by week fixed effects)."),
      bullet("Critical confound: 'early' markets were deliberately chosen by the (simulated) product team because they were already GMV-accelerating markets \u2014 an extra positive trend term is added only to that cohort. 'Mid' and 'late' markets are assigned on an engineering-schedule basis uncorrelated with performance."),
      p("A market-level covariate table (pre_gmv_mean, pre_gmv_trend, pre_gmv_vol, computed from weeks 0\u201319 only) is also built for the PSM exercise, along with a post-period average (weeks 90\u2013104, after all cohorts have launched) as the matching outcome."),

      h1("4. Difference-in-Differences Analysis"),
      h2("4.1 Naive pooled TWFE DiD"),
      p("Regressing log(GMV) on a treated indicator with market and week fixed effects, clustering standard errors by market, gives:"),
      table(["Estimate", "Value"], [
        ["ATT (log points)", "0.1452"],
        ["Clustered SE", "0.0234"],
        ["95% CI", "[0.0992, 0.1911]"],
        ["Implied % effect", "+15.6%"],
      ], [4500, 4500]),
      p(""),
      p("Taken at face value this looks like a strong, precisely estimated result. Section 4.2 shows why it should not be taken at face value."),

      h2("4.2 Parallel trends test (event study)"),
      p("We re-estimate the model with a full set of leads and lags around each market's launch week (relative event time \u201312 to +12), using never-treated markets as the comparison group throughout, and test whether the pre-treatment lead coefficients are jointly zero \u2014 the direct, testable implication of parallel trends."),
      img(`${FIG}/01_raw_trends_by_cohort.png`, 560, 311),
      caption("Figure 1. Raw mean log(GMV) by cohort. Note the 'early' cohort (red) is already trending up well before its week-30 launch (dashed red line), while 'mid' and 'late' cohorts track the never-treated group more closely before their own launches."),
      img(`${FIG}/02_event_study_pooled.png`, 560, 311),
      caption("Figure 2. Pooled event study. Pre-period coefficients are visibly non-flat, especially at longer lags \u2014 a first sign of trouble for the pooled estimate."),
      table(["Test", "Statistic", "p-value", "Conclusion"], [
        ["Pooled sample: joint pre-trend F-test", "F = 5.10", "0.0001", "Reject parallel trends"],
      ], [3500, 2000, 1800, 2700]),
      p("The pooled pre-trend test rejects flat pre-trends decisively. This alone should stop an analyst from reporting the pooled TWFE estimate as a clean causal effect. But pooling can also mask cohort-level heterogeneity in why the assumption fails, so we break it down by cohort next."),

      h2("4.3 Cohort-specific event studies"),
      img(`${FIG}/03_event_study_by_cohort.png`, 620, 207),
      caption("Figure 3. Event studies run separately for each cohort against the never-treated group. The early cohort (left) shows a clear, monotonic upward pre-trend \u2014 exactly the confound built into the simulation. Mid and late cohorts (center, right) are much flatter pre-launch, though not perfectly so."),
      table(["Cohort", "Joint pre-trend p-value", "Interpretation"], [
        ["Early", "< 0.0001", "Strong, systematic violation \u2014 matches known confound (PMs picked accelerating markets)"],
        ["Mid", "0.0063", "Statistically detectable but visually modest; plausibly small-sample noise given only 8 treated markets"],
        ["Late", "0.0110", "Statistically detectable but visually modest; same caveat as mid"],
      ], [1600, 2600, 4800]),
      p("This is an important nuance for the write-up: statistical significance of a pre-trend test is not the same as practical importance. The early cohort's violation is large in magnitude and monotonic \u2014 consistent with a real, structural confound. The mid and late cohorts' violations are statistically significant (partly because our joint tests have many pre-period coefficients, and with only 8 treated markets per cohort estimates are noisy) but small and non-monotonic in Figure 3, consistent with sampling variation rather than a systematic selection effect. A defensible analysis distinguishes these two situations rather than treating 'p < 0.05' as a binary pass/fail across the board."),

      h2("4.4 Heterogeneity-robust ATT (not-yet-treated comparisons)"),
      p("For each cohort we compute a clean 2\u00d72 DiD against not-yet-treated and never-treated markets over a matched pre/post calendar window, avoiding \"already-treated units as controls\" comparisons that bias pooled TWFE under staggered adoption with dynamic effects."),
      table(["Cohort", "ATT (log pts)", "SE", "95% CI", "Implied %", "True effect (by construction)"], [
        ["Early", "0.2046", "0.0118", "[0.181, 0.228]", "+22.7%", "+9%"],
        ["Mid", "0.0801", "0.0069", "[0.067, 0.094]", "+8.3%", "+8%"],
        ["Late", "0.0612", "0.0096", "[0.042, 0.080]", "+6.3%", "+6%"],
      ], [1400, 1700, 1300, 2200, 1600, 2300]),
      img(`${FIG}/04_att_comparison.png`, 480, 300),
      caption("Figure 4. Cohort-robust estimates vs. the naive pooled TWFE estimate. Mid and late cohorts recover the true simulated effect closely; the early cohort's estimate remains inflated even after switching to a not-yet-treated comparison, because its confound is a pre-existing trend, not a comparison-group artifact \u2014 no DiD variant fixes a violated parallel-trends assumption by itself."),
      p("This is the central methodological lesson: switching from naive pooled TWFE to a heterogeneity-robust, not-yet-treated estimator fixes the staggered-adoption bias (mid and late cohorts now land almost exactly on their true simulated effects), but it does NOT fix a genuine parallel-trends violation (the early cohort's estimate is still biased upward, because its markets were on a different trajectory before treatment for reasons unrelated to the feature). The equal-weighted average ATT across cohorts is +11.5% (log 0.1153) \u2014 still pulled upward by the early cohort's inflated number."),

      h1("5. Propensity Score Matching Analysis"),
      p("As a robustness/alternative exercise under a tighter data constraint (cross-section only), we match ever-treated to never-treated markets on three pre-period covariates using a logistic-regression propensity score, then 1:2 nearest-neighbor match with replacement."),
      h2("5.1 Covariate balance"),
      img(`${FIG}/05_psm_balance.png`, 520, 325),
      caption("Figure 5. Standardized mean differences (SMD) before and after matching. The common |SMD| < 0.10 balance threshold (dashed lines) is not achieved for any covariate, even after matching."),
      table(["Covariate", "SMD before", "SMD after"], [
        ["pre_gmv_mean", "0.379", "0.262"],
        ["pre_gmv_trend", "1.104", "1.027"],
        ["pre_gmv_vol", "1.097", "1.066"],
        ["propensity score", "1.203", "1.109"],
      ], [3000, 3000, 3000]),
      p("Matching only modestly improves balance and does not bring any covariate below the conventional 0.10 SMD threshold. With only 16 never-treated markets to match against 24 treated markets, and given that pre_gmv_trend is exactly the dimension on which the early cohort was selected, the pool of candidate controls simply does not contain enough close matches. This is a limited-overlap problem, and it is a genuine finding, not just an implementation shortcoming: it tells us PSM is not well suited to this dataset without either a richer covariate set, more control markets, or a coarser research question."),

      h2("5.2 Matched-sample effect estimate"),
      table(["Estimate", "Value"], [
        ["ATT (log points)", "0.1102"],
        ["SE", "0.0765"],
        ["95% CI", "[\u22120.0396, 0.2601]"],
        ["Implied % effect", "+11.6%"],
      ], [4500, 4500]),
      p("The point estimate (+11.6%) is directionally consistent with the DiD results, sitting between the mid/late cohort estimates and the inflated pooled/early numbers. But the confidence interval is wide and includes zero, and it rests on imperfect covariate balance \u2014 so on its own, this estimate would not be strong enough to support a confident business decision. Its main analytical value here is as a cross-check: it does not contradict the DiD story, but it also can't resolve which DiD number is closer to the truth."),

      h1("6. Threats to Validity and How They Would Change the Conclusion"),
      h2("6.1 DiD: parallel trends"),
      bullet("Confirmed violation (early cohort): The early cohort's markets were on a steeper growth trajectory before launch, most plausibly because the product team selected already-strong markets to go first. If this is right, the naive early-cohort DiD estimate (+22.7%) is an upper bound, not a point estimate \u2014 some or most of that gap reflects the pre-existing trend continuing, not the feature. A conservative business read should discount the early cohort's number heavily, or exclude it and lean on mid/late."),
      bullet("Unclear significance (mid/late cohorts): Statistically detectable pre-trend deviations exist but are small and non-monotonic. If these reflect real (if modest) confounding rather than noise, the mid/late estimates (+8.3%, +6.3%) would be modestly biased in an unknown direction; if they reflect noise, the estimates are close to unbiased. We cannot fully distinguish these with only 8 treated markets per cohort \u2014 more markets or a longer pre-period would sharpen this test."),
      bullet("Anticipation effects: If markets or users changed behavior in the weeks just before launch (e.g., because of internal announcements), the pre-trend test could show \u2014 and treatment estimates could reflect \u2014 anticipation rather than a true baseline violation. We did not simulate this, but a real analysis should check whether the pre-trend concentrates in the last 1\u20132 weeks before launch (anticipation) versus building gradually over months (structural selection, as we see for the early cohort here)."),
      bullet("SUTVA / spillovers: If never-treated markets compete with treated markets for the same sellers or buyers (cross-market spillovers), the 'control' group's outcomes would themselves be contaminated by treatment, and DiD would understate the true effect. Geographic marketplaces with overlapping seller bases are a plausible real-world case where this matters; we assumed no spillovers in the simulation."),

      h2("6.2 PSM: selection on observables"),
      bullet("Unobserved selection: PSM only balances on measured covariates. Here, the very dimension that drove selection into the early cohort (accelerating pre-trend) is one of our matching covariates, yet balance still isn't achieved \u2014 which means an even less complete covariate set (a common situation in practice, e.g., matching on demographics without a trend variable at all) would likely be worse. If unobserved factors (e.g., a strong local GM, an ongoing local marketing push) drove both selection into treatment and the outcome, the matched ATT is biased in the same direction as those factors."),
      bullet("Limited overlap: With only 16 control markets, achievable balance is mechanically constrained. A wider or more comparable control pool (e.g., matching to peer markets outside this product's addressable footprint) would let the balance diagnostics do their job better."),
      bullet("Matching outcome window: We used weeks 90\u2013104 (well after even the latest launch) as the post-period, which mixes different exposure durations across cohorts \u2014 early-cohort markets have had ~60 weeks of exposure by then, late-cohort markets only ~15\u201330. This could bias the pooled PSM estimate toward whichever cohort's effect happens to dominate the treated group's composition."),

      h2("6.3 How the headline number would change"),
      p("Depending on which assumption set an analyst is willing to accept, the plausible range for the true business effect spans from roughly +6% to +9% (mid/late DiD, closest to the ground truth by construction) up to +15\u201323% (pooled TWFE and early-cohort DiD, both of which rest on assumptions we can show are violated). Reporting only the naive pooled number, as a first pass at this data often would, overstates the effect by roughly 2\u20133x relative to the more defensible cohort-robust estimate."),

      h1("7. Recommendations for a Real Deployment"),
      bullet("Report the cohort-robust DiD estimate (not pooled TWFE) as the headline number, and show the event-study plot alongside it so stakeholders can see the pre-trend diagnostic, not just the point estimate."),
      bullet("Flag the early cohort's estimate as directionally biased upward and either exclude it from the headline number or present it as a bracket ('true effect likely closer to +6\u20138%, with pooled/early-cohort estimates as an upper bound')."),
      bullet("If the rollout is still in progress, prioritize launching the remaining markets on a schedule uncorrelated with recent performance (as mid/late already were) so the next wave doesn't reproduce the early cohort's problem, and so a future re-analysis has a cleaner comparison."),
      bullet("Treat the PSM result as a directional sanity check only, given the balance diagnostics; do not use it as the primary estimate for this dataset."),
      bullet("If decision-relevant precision is needed, consider a true randomized rollout for any future feature of this kind for at least a subset of markets \u2014 the entire exercise above is what practitioners do only because that option was foreclosed here."),

      h1("8. Appendix: Files and Reproducibility"),
      p("All code, data, and outputs are included alongside this report:"),
      bullet("code/01_simulate_data.py \u2014 generates the panel and covariate data (seeded, fully reproducible)"),
      bullet("code/02_did_analysis.py \u2014 TWFE, event studies, parallel-trends tests, cohort-robust ATT"),
      bullet("code/03_plots.py, code/05_psm_plot.py \u2014 all figures in this report"),
      bullet("code/04_psm_analysis.py \u2014 propensity score estimation, matching, balance tables"),
      bullet("data/panel_data.csv, data/market_covariates.csv \u2014 simulated inputs"),
      bullet("output/*.csv, output/*.txt \u2014 all numeric results underlying the tables above"),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = path.join(OUT, "Causal_Inference_Report.docx");
  fs.writeFileSync(outPath, buf);
  console.log("Report written to", outPath);
});

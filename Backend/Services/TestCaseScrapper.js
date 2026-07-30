import * as cheerio from "cheerio";

const SCRAPE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function extractPreText($, preEl) {
  if (!preEl) return null;
  const $pre = $(preEl);

  // New-style: each line is a <div>
  const directDivs = $pre.children("div");
  if (directDivs.length > 0) {
    return directDivs
      .map((_, el) => $(el).text())
      .get()
      .join("\n")
      .trim();
  }

  // Old-style: <br> separated
  let inner = $pre.html() || "";
  inner = inner
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();

  return inner;
}

/**
 * Extracts inner HTML from a cheerio element while preserving LaTeX math
 * notation ($...$, $$$...$$$ etc.) intact for the frontend formatter.
 * Does NOT call .text() — that would destroy all math structure.
 */
function htmlToText($, el) {
  el.find(".section-title").remove();

  // Replace block-level tags with newlines so paragraph breaks survive
  el.find("p, div").each((_, node) => {
    $(node).before("\n").after("\n");
  });
  el.find("br").each((_, node) => {
    $(node).replaceWith("\n");
  });

  // Get raw inner HTML — keeps $...$, \(...\), \frac{}{} etc.
  let html = el.html() || "";

  // Decode entities (cheerio re-encodes some characters)
  html = html
    .replace(/&amp;/g, "&") // must come first
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&times;/g, "×")
    .replace(/&le;/g, "≤")
    .replace(/&ge;/g, "≥");
  // NOTE: do NOT decode &lt; / &gt; here — they may appear inside math
  // and the frontend formatter handles them correctly in context

  // Collapse excess blank lines
  html = html.replace(/\n{3,}/g, "\n\n").trim();

  return html;
}

function parseTimeLimitToMs(text) {
  const match = text.match(/([\d.]+)\s*second/);
  if (match) return Math.round(parseFloat(match[1]) * 1000);
  return 2000;
}

function parseMemLimitToMb(text) {
  const match = text.match(/(\d+)\s*megabyte/);
  if (match) return parseInt(match[1]);
  return 256;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── SCRAPE FUNCTIONS ─────────────────────────────────────────────────────────

async function scrapeTestCases(contestId, index) {
  const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
  const res = await fetch(url, { headers: SCRAPE_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  const $ = cheerio.load(await res.text());
  const testCases = [];

  $(".sample-tests .sample-test").each((_, block) => {
    const inputPre = $(block).find(".input  > pre").first();
    const outputPre = $(block).find(".output > pre").first();
    if (!inputPre.length || !outputPre.length) return;

    const input = extractPreText($, inputPre[0]);
    const expectedOutput = extractPreText($, outputPre[0]);
    if (input !== null && expectedOutput !== null) {
      testCases.push({ input, expectedOutput });
    }
  });

  if (!testCases.length) {
    throw new Error(`No test cases found for ${contestId}${index}`);
  }
  return testCases;
}

async function scrapeProblemMeta(contestId, index) {
  const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
  const res = await fetch(url, { headers: SCRAPE_HEADERS });
  const $ = cheerio.load(await res.text());

  const timeLimitText = $(".time-limit")
    .text()
    .replace("time limit per test", "")
    .trim();
  const memLimitText = $(".memory-limit")
    .text()
    .replace("memory limit per test", "")
    .trim();

  return {
    timeLimitMs: parseTimeLimitToMs(timeLimitText),
    memLimitMb: parseMemLimitToMb(memLimitText),
    timeLimitText,
    memLimitText,
  };
}

async function scrapeFullProblemData(contestId, index) {
  const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
  const res = await fetch(url, { headers: SCRAPE_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  const $ = cheerio.load(await res.text());

  // ── Test cases ──────────────────────────────────────────────────────────────
  const testCases = [];
  $(".sample-tests .sample-test").each((_, block) => {
    const inputPre = $(block).find(".input  > pre").first();
    const outputPre = $(block).find(".output > pre").first();
    if (!inputPre.length || !outputPre.length) return;

    const input = extractPreText($, inputPre[0]);
    const expectedOutput = extractPreText($, outputPre[0]);
    if (input !== null && expectedOutput !== null) {
      testCases.push({ input, expectedOutput });
    }
  });

  if (!testCases.length) {
    throw new Error(`No test cases found for ${contestId}${index}`);
  }

  // ── Meta ────────────────────────────────────────────────────────────────────
  const timeLimitText = $(".time-limit")
    .text()
    .replace("time limit per test", "")
    .trim();
  const memLimitText = $(".memory-limit")
    .text()
    .replace("memory limit per test", "")
    .trim();
  const timeLimitMs = parseTimeLimitToMs(timeLimitText);
  const memLimitMb = parseMemLimitToMb(memLimitText);

  // ── Statement sections (returns HTML with math intact) ──────────────────────
  const sectionToHTML = (selector) => {
    const el = $(selector);
    if (!el.length) return "";
    return htmlToText($, el.clone());
  };

  // Main statement body = everything in .problem-statement that is NOT a named section
  const NAMED_SECTIONS = [
    "header",
    "input-specification",
    "output-specification",
    "sample-tests",
    "note",
  ];

  let statementBody = "";
  $(".problem-statement")
    .children()
    .each((_, el) => {
      const cls = $(el).attr("class") || "";
      const isNamed = NAMED_SECTIONS.some((c) => cls.includes(c));
      if (!isNamed) {
        statementBody += htmlToText($, $(el).clone()) + "\n\n";
      }
    });

  return {
    testCases,
    meta: { timeLimitMs, memLimitMb, timeLimitText, memLimitText },
    statement: {
      isHTML: true, // tells frontend: run formatProblemStatement on this
      body: statementBody.trim(),
      inputSpec: sectionToHTML(".input-specification"),
      outputSpec: sectionToHTML(".output-specification"),
      note: sectionToPlainText($, ".note"),
    },
  };
}
function sectionToPlainText($, selector) {
  const el = $(selector);
  if (!el.length) return "";

  const clone = el.clone();

  clone.find(".section-title").remove();
  clone.find("img").remove();
  clone.find("center").remove();
  clone.find("script").remove();
  clone.find("style").remove();

  clone.find("br").replaceWith("\n");

  clone.find("p, div").each((_, node) => {
    $(node).before("\n").after("\n");
  });

  let text = clone.text();

  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}
async function scrapeAllProblems(problems, concurrency = 3) {
  const results = new Array(problems.length);
  const errors = [];

  for (let i = 0; i < problems.length; i += concurrency) {
    const chunk = problems.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map((p, j) =>
        scrapeFullProblemData(p.contestId, p.index).then((data) => ({
          index: i + j,
          data,
        })),
      ),
    );

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results[result.value.index] = { success: true, ...result.value.data };
      } else {
        const failedIdx = chunkResults.indexOf(result);
        const failedProblem = chunk[failedIdx];
        errors.push({
          problem: `${failedProblem.contestId}${failedProblem.index}`,
          error: result.reason.message,
        });
        results[i + failedIdx] = { success: false, testCases: [], meta: null };
      }
    }

    console.log(
      `Scraped ${i + 1}–${Math.min(i + concurrency, problems.length)}` +
        ` of ${problems.length}. Errors so far: ${errors.length}`,
    );

    if (i + concurrency < problems.length) await sleep(500);
  }

  return { results, errors };
}

export {
  scrapeTestCases,
  scrapeProblemMeta,
  scrapeFullProblemData,
  scrapeAllProblems,
};

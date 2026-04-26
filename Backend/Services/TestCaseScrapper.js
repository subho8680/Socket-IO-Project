import * as cheerio from "cheerio";
const SCRAPE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

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
  const html = await res.text();
  const $ = cheerio.load(html);

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

  return { timeLimitMs, memLimitMb, timeLimitText, memLimitText };
}

async function scrapeFullProblemData(contestId, index) {
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

  const sectionToText = (selector) => {
    const el = $(selector);
    if (!el.length) return "";
    const clone = el.clone();
    clone.find(".section-title").remove();
    return htmlToText($, clone);
  };

  const NAMED = [
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
      const isNamed = NAMED.some((c) => cls.includes(c));
      if (!isNamed) {
        statementBody += htmlToText($, $(el)) + "\n\n";
      }
    });

  return {
    testCases,
    meta: {
      timeLimitMs,
      memLimitMb,
      timeLimitText,
      memLimitText,
    },
    statement: {
      body: statementBody.trim(),
      inputSpec: sectionToText(".input-specification"),
      outputSpec: sectionToText(".output-specification"),
      note: sectionToText(".note"),
    },
  };
}

function htmlToText($, el) {
  el.find("p, div").each((_, node) => {
    $(node).after("\n");
  });

  let text = el.text();

  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&le;/g, "≤")
    .replace(/&ge;/g, "≥")
    .replace(/&mdash;/g, "—")
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
        const failedProblem = chunk[chunkResults.indexOf(result)];
        errors.push({
          problem: `${failedProblem.contestId}${failedProblem.index}`,
          error: result.reason.message,
        });
        results[i + chunkResults.indexOf(result)] = {
          success: false,
          testCases: [],
          meta: null,
        };
      }
    }
    console.log(
      `Scraped problems ${i + 1} to ${Math.min(i + concurrency, problems.length)}. Errors so far: ${errors.length}`,
    );
    if (i + concurrency < problems.length) {
      await sleep(500);
    }
  }

  return { results, errors };
}

function extractPreText($, preEl) {
  if (!preEl) return null;
  const $pre = $(preEl);

  let inner = $pre.html() || "";
  const directDivs = $pre.children("div");
  if (directDivs.length > 0) {
    return directDivs
      .map((_, el) => $(el).text())
      .get()
      .join("\n")
      .trim();
  }

  inner = inner
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  inner = inner
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");

  return inner;
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

export {
  scrapeTestCases,
  scrapeProblemMeta,
  scrapeFullProblemData,
  scrapeAllProblems,
};

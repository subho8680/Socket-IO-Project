const CF_API = "https://codeforces.com/api/problemset.problems";

async function fetchProblems({ minRating, maxRating, count, tags = [], excludeIds = [] }) {
  const tagQuery = tags.length ? `?tags=${tags.join(";")}` : "";
  const url = `${CF_API}${tagQuery}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "OK") {
    throw new Error(`CF API error: ${json.comment}`);
  }

  const { problems, problemStatistics } = json.result;

  const statsMap = {};
  for (const stat of problemStatistics) {
    statsMap[`${stat.contestId}_${stat.index}`] = stat.solvedCount;
  }

  const filtered = problems.filter(p => {
    if (!p.rating) return false; 
    if (p.rating < minRating || p.rating > maxRating) return false;
    if (excludeIds.includes(p.contestId)) return false;
    return true;
  });

  if (filtered.length < count) {
    throw new Error(
      `Only ${filtered.length} problems found in rating range ${minRating}–${maxRating}. ` +
      `Requested ${count}. Broaden the range or reduce problem count.`
    );
  }

  const selected = shuffleAndPick(filtered, count);

  return selected.map(p => ({
    contestId:  p.contestId,
    index:      p.index,
    name:       p.name,
    rating:     p.rating,
    tags:       p.tags,
    solvedCount: statsMap[`${p.contestId}_${p.index}`] ?? 0,
    url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
  }));
}

function shuffleAndPick(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export { fetchProblems };
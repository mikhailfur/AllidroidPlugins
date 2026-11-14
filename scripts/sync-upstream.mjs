import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AllidroidPlugins-upstream-sync"
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function json(url) {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
    return response.json();
}

const [commit, contents] = await Promise.all([
    json("https://api.github.com/repos/Vendicated/Vencord/commits/main"),
    json("https://api.github.com/repos/Vendicated/Vencord/contents/src/plugins?ref=main")
]);

const plugins = contents
    .filter(entry => entry.type === "dir" && !entry.name.startsWith("_"))
    .map(entry => entry.name)
    .sort();

const next = {
    checkedAt: new Date().toISOString(),
    repo: "Vendicated/Vencord",
    branch: "main",
    commit: commit.sha,
    commitDate: commit.commit?.committer?.date ?? null,
    commitMessage: commit.commit?.message?.split("\n")[0] ?? "",
    pluginCount: plugins.length,
    plugins
};

let previous = null;
if (existsSync("upstream.json")) {
    try {
        previous = JSON.parse(await readFile("upstream.json", "utf8"));
    } catch { }
}

const changed = !previous || previous.commit !== next.commit || previous.pluginCount !== next.pluginCount;
const added = previous ? plugins.filter(name => !previous.plugins?.includes(name)) : [];
const removed = previous ? (previous.plugins ?? []).filter(name => !plugins.includes(name)) : [];

next.changes = { changed, added, removed };
await writeFile("upstream.json", `${JSON.stringify(next, null, 2)}\n`);

console.log(`Vencord ${next.commit.slice(0, 10)} · ${plugins.length} plugins · changed=${changed}`);
if (added.length) console.log(`added: ${added.join(", ")}`);
if (removed.length) console.log(`removed: ${removed.join(", ")}`);
if (process.env.GITHUB_OUTPUT) {
    const fs = await import("node:fs");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `commit=${next.commit}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `added=${added.join(",")}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `removed=${removed.join(",")}\n`);
}

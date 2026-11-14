import { readFile, writeFile } from "node:fs/promises";

const upstream = JSON.parse(await readFile("upstream.json", "utf8"));
const plugins = JSON.parse(await readFile("plugins.json", "utf8"));
const roadmap = JSON.parse(await readFile("roadmap.json", "utf8"));

const ported = new Map(plugins.plugins.map(p => [p.id, p]));
const portedByName = new Map(plugins.plugins.map(p => [p.upstream, p]));

const norm = value => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const explicit = new Map();
for (const item of [...roadmap.top30, ...roadmap.items]) {
    explicit.set(item.name, item);
    explicit.set(norm(item.name), item);
    if (item.pluginId) {
        explicit.set(item.pluginId, item);
        explicit.set(norm(item.pluginId), item);
    }
    if (item.upstream) explicit.set(item.upstream, item);
}

const notPortable = new Set([
    "arRPC.web", "betterSettings", "consoleJanitor", "consoleShortcuts", "customRPC",
    "f8break", "fixSpotifyEmbeds.desktop", "fixYoutubeEmbeds.desktop", "noDeepLinks.web",
    "noDevtoolsWarning", "noF1", "noMaskedUrlPaste", "noMosaic", "noSystemBadge.discordDesktop",
    "oneko", "pictureInPicture", "previewMessage", "quickReply", "themeAttributes",
    "vencordToolbox", "volumeBooster", "webContextMenus", "webKeybinds", "spotifyControls"
]);

const builtin = new Set([
    "callTimer", "experiments", "imageZoom", "openInApp", "typingIndicator", "voiceMessages"
]);

const desktopSuffix = /\.(web|desktop|discordDesktop)$/;

const order = ["ported", "beta", "bonus", "builtin", "planned", "not-portable", "backlog"];
const labels = {
    ported: "✅ Портирован",
    beta: "🧪 Beta",
    bonus: "🧩 Бонус",
    builtin: "⚪ Уже в Allidroid",
    planned: "🛠 Запланирован",
    "not-portable": "⛔ Не портируется",
    backlog: "📋 Бэклог"
};

const rows = upstream.plugins.map(name => {
    const mapped = portedByName.get(name);
    const plan = explicit.get(name)
        ?? explicit.get(norm(name))
        ?? (mapped ? explicit.get(mapped.id) ?? explicit.get(norm(mapped.id)) : null);

    let status = plan?.status ?? "backlog";
    if (mapped && status !== "beta" && status !== "bonus") status = mapped.status ?? "ported";
    if (notPortable.has(name)) status = "not-portable";
    if (builtin.has(name)) status = "builtin";
    if (desktopSuffix.test(name) && status === "backlog") status = "not-portable";

    const reason = plan?.reason
        ?? (status === "not-portable"
            ? (desktopSuffix.test(name)
                ? "Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте."
                : "Опирается на десктопные API, DOM или локальный RPC.")
            : status === "builtin"
                ? "Функция уже есть в мобильном Discord / Allidroid."
                : status === "ported" || status === "beta" || status === "bonus"
                    ? "Работает как user plugin, установка по ссылке."
                    : status === "planned"
                        ? "Технически возможен, но требует отдельного мобильного patch-а."
                        : "Не входит в топ-30. Порт возможен после разбора мобильных модулей.");

    return {
        name,
        status,
        label: labels[status],
        pluginId: mapped?.id ?? null,
        reason,
        top: roadmap.top30.some(item => item.name === name || item.pluginId === mapped?.id)
    };
});

rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.name.localeCompare(b.name));

const counts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
}, {});

const summary = order
    .filter(status => counts[status])
    .map(status => `| ${labels[status]} | ${counts[status]} |`)
    .join("\n");

const table = rows.map(row => {
    const install = row.pluginId
        ? `[raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/${row.pluginId}/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/${row.pluginId}/)`
        : "—";
    return `| ${row.top ? "★ " : ""}${row.name} | ${row.label} | ${row.reason} | ${install} |`;
}).join("\n");

const content = `# Анализ плагинов Vencord → Allidroid

Снимок Vencord: \`${upstream.commit.slice(0, 10)}\` от ${upstream.commitDate ?? "—"} · ${upstream.pluginCount} плагинов.

Это полный разбор списка \`src/plugins\` Vencord. Статусы:

| Статус | Кол-во |
| --- | ---: |
${summary}

- **Портирован / Beta / Бонус** — код лежит в этом репозитории и ставится как user plugin.
- **Уже в Allidroid** — функция есть в мобильном клиенте, дублировать её плагином не нужно.
- **Запланирован** — технически возможен, но требует отдельного мобильного patch-а и тестов.
- **Не портируется** — опирается на десктопный DOM, CSS, локальный RPC или API, которых нет на мобильном.
- **Бэклог** — не входит в топ-30; порт возможен, но приоритет ниже.

## Полная таблица

| Плагин | Статус | Почему | Установка |
| --- | --- | --- | --- |
${table}

> ★ — плагин из топ-30. Полная интерактивная карта: https://mikhailfur.github.io/AllidroidPlugins/
>
> PronounDB и MoveAllVoice не входят в список 168: PronounDB — community-порт с pronoundb.org, MoveAllVoice — бонус из отдельного репозитория.
`;

await writeFile("ANALYSIS.md", content);
await writeFile("docs/analysis.json", JSON.stringify({ upstream: upstream.commit, pluginCount: rows.length, counts, rows }, null, 2) + "\n");
console.log(`ANALYSIS.md: ${rows.length} plugins`);

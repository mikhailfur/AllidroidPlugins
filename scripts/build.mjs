import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex !== -1 ? process.argv[onlyIndex + 1] : null;
const check = process.argv.includes("--check");

const shared = join(root, "packages/shared/src/index.tsx");

async function pluginDirs() {
    const entries = await readdir(join(root, "plugins"), { withFileTypes: true });
    return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => !only || name === only)
        .sort();
}

async function buildPlugin(id) {
    const dir = join(root, "plugins", id);
    const metaPath = join(dir, "plugin.json");
    if (!existsSync(metaPath)) return null;

    const meta = JSON.parse(await readFile(metaPath, "utf8"));
    const entry = join(dir, "src/index.tsx");
    if (!existsSync(entry)) {
        console.warn(`skip ${id}: no src/index.tsx`);
        return null;
    }

    const outfile = join(dir, "index.js");
    const result = await build({
        entryPoints: [entry],
        outfile,
        bundle: true,
        format: "iife",
        globalName: "$",
        banner: { js: "(()=>{" },
        footer: { js: "return $;})();" },
        target: "es2020",
        jsx: "transform",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment",
        legalComments: "none",
        minifyWhitespace: true,
        minifySyntax: true,
        alias: { "@shared": shared },
        inject: [join(root, "packages/shared/react-shim.ts")],
        logLevel: "silent"
    });

    if (result.errors?.length) {
        throw new Error(`${id}: ${result.errors.map(error => error.text).join("; ")}`);
    }

    const js = await readFile(outfile, "utf8");
    const hash = createHash("sha256").update(js).digest("hex");

    const manifest = {
        name: meta.name,
        description: meta.description,
        authors: meta.authors,
        main: "index.js",
        hash,
        vendetta: {
            icon: meta.icon ?? "PluginIcon"
        }
    };

    await writeFile(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`${id.padEnd(28)} ${(js.length / 1024).toFixed(1)} KiB  ${hash.slice(0, 12)}`);
    return { id, meta, manifest, size: js.length };
}

const ids = await pluginDirs();
const built = [];
for (const id of ids) {
    built.push(await buildPlugin(id));
}

await mkdir(join(root, "docs"), { recursive: true });

if (!only && !check) {
    const builtList = built.filter(Boolean).map(({ id, meta, manifest }) => ({
        id,
        name: meta.name,
        description: meta.description,
        authors: meta.authors,
        icon: meta.icon ?? null,
        category: meta.category ?? "Other",
        upstream: meta.upstream ?? null,
        status: meta.status ?? "ported",
        version: meta.version ?? "1.0.0",
        notes: meta.notes ?? null,
        hash: manifest.hash,
        raw: `https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/${id}/`,
        jsdelivr: `https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/${id}/`,
        stable: `https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@v${meta.version ?? "1.0.0"}/plugins/${id}/`
    }));

    let updatedAt = new Date().toISOString();
    const previousIndexPath = join(root, "plugins.json");
    if (existsSync(previousIndexPath)) {
        try {
            const previous = JSON.parse(await readFile(previousIndexPath, "utf8"));
            const signature = list => JSON.stringify((list ?? []).map(p => [p.id, p.hash, p.status, p.version]));
            if (signature(previous.plugins) === signature(builtList)) updatedAt = previous.updatedAt ?? updatedAt;
        } catch { }
    }

    const index = {
        schema: 1,
        updatedAt,
        repo: "mikhailfur/AllidroidPlugins",
        branch: "main",
        plugins: builtList
    };
    await writeFile(join(root, "plugins.json"), `${JSON.stringify(index, null, 2)}\n`);
    await writeFile(join(root, "docs/plugins.json"), `${JSON.stringify(index, null, 2)}\n`);

    const roadmap = JSON.parse(await readFile(join(root, "roadmap.json"), "utf8"));
    const installed = new Map(index.plugins.map(p => [p.id, p]));
    for (const item of [...roadmap.top30, ...roadmap.items]) {
        if (item.pluginId && installed.has(item.pluginId)) {
            const built = installed.get(item.pluginId);
            item.status = built.status ?? item.status;
            item.hash = built.hash;
            item.install = { raw: built.raw, jsdelivr: built.jsdelivr, stable: built.stable };
        }
    }
    roadmap.updatedAt = index.updatedAt;
    await writeFile(join(root, "docs/roadmap.json"), `${JSON.stringify(roadmap, null, 2)}\n`);

    const analysis = await import("./gen-analysis.mjs");
    void analysis;
}

if (check) {
    console.log("Build verification passed.");
}

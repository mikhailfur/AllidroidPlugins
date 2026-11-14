/*
 * FakeNitro for Allidroid
 * Based on the Vencord plugin and the Vendetta port by janisslsm.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, safeFindByName, safeFindByProps, safeStore,
    SettingsPage, Section, SwitchRow, RadioGroup, toast, logger
} from "@shared";

const RowManager = safeFindByName("RowManager");
const EmojiStore = safeStore("EmojiStore");
const UserStore = safeStore("UserStore");
const nitroInfo = safeFindByProps("canUseEmojisEverywhere");
const messageModule = safeFindByProps("sendMessage", "receiveMessage");
const uploadModule = safeFindByProps("uploadLocalFiles");
const catalog = safeFindByProps("canUserUse");

const emojiRegex = /https:\/\/cdn\.discordapp\.com\/emojis\/(\d+)\.\w+/;

let unpatch: (() => void)[] = [];

function isFree() {
    try {
        return UserStore?.getCurrentUser?.()?.premiumType == null;
    } catch {
        return false;
    }
}

function emojiName(url: string) {
    const match = url.match(emojiRegex);
    if (!match) return "<emoji>";
    try {
        const emoji = EmojiStore?.getCustomEmojiById?.(match[1]);
        if (emoji?.name) return emoji.name;
    } catch { }
    return `<emoji:${match[1]}>`;
}

function modify(message: any) {
    if (!message || typeof message.content !== "string") return;
    if (!message.content.match(emojiRegex)) return;

    const urls = [...message.content.matchAll(new RegExp(emojiRegex, "g"))].map(match => match[0]);
    if (!urls.length) return;

    if (plugin.storage.transformEmoji !== false) {
        let content = message.content;
        for (const url of urls) content = content.replace(url, "").trim();
        message.content = `${content}${content ? "\n" : ""}${urls.join("\n")}`;
    }

    message.invalidEmojis = [];
}

function patchSend() {
    if (messageModule?.sendMessage) {
        unpatch.push(patcher.before("sendMessage", messageModule, (args: any[]) => {
            if (isFree()) modify(args[1]);
        }));
    }

    if (uploadModule?.uploadLocalFiles) {
        unpatch.push(patcher.before("uploadLocalFiles", uploadModule, (args: any[]) => {
            if (isFree()) modify(args[0]?.parsedMessage);
        }));
    }
}

function patchChecks() {
    for (const key of ["canUseEmojisEverywhere", "canUseAnimatedEmojis", "canUseStickersEverywhere"]) {
        if (typeof nitroInfo?.[key] !== "function") continue;
        unpatch.push(patcher.instead(key, nitroInfo, function (args: any[], original: any) {
            if (!isFree()) return original.apply(this, args);
            return true;
        }));
    }

    if (catalog?.canUserUse) {
        unpatch.push(patcher.instead("canUserUse", catalog, function (args: any[], original: any) {
            if (!isFree()) return original.apply(this, args);
            const product = args[0];
            if (plugin.storage.themes !== false && product === this?.CLIENT_THEMES) return true;
            if (plugin.storage.themes !== false && product === this?.APP_ICONS) return true;
            if (plugin.storage.stream !== false && (product === this?.STREAM_MID_QUALITY || product === this?.STREAM_HIGH_QUALITY)) return true;
            return original.apply(this, args);
        }));
    }
}

function patchRender() {
    if (!RowManager?.prototype?.generate) return;

    unpatch.push(patcher.after("generate", RowManager.prototype, ([data]: any[], row: any) => {
        if (data?.rowType !== 1 || !row?.message || !Array.isArray(row.message.content)) return row;
        if (plugin.storage.transformEmoji === false) return row;

        const content = row.message.content;
        const jumbo = content.every((node: any) =>
            (node?.type === "link" && emojiRegex.test(node.target))
            || (node?.type === "text" && node.content === " ")
        );

        for (let i = 0; i < content.length; i++) {
            const node = content[i];
            if (node?.type !== "link" || typeof node.target !== "string") continue;
            const match = node.target.match(emojiRegex);
            if (!match) continue;

            const animated = node.target.includes("animated=true") || node.target.endsWith(".gif");
            const size = Math.max(16, Math.min(128, Number(plugin.storage.emojiSize) || 48));
            const base = `https://cdn.discordapp.com/emojis/${match[1]}`;

            content[i] = {
                type: "customEmoji",
                id: match[1],
                alt: emojiName(node.target),
                src: `${base}.${animated ? "gif" : "webp"}?size=${size}`,
                frozenSrc: `${base}.webp?size=${size}`,
                jumboable: jumbo || undefined
            };
        }

        return row;
    }));
}

function apply() {
    if (!messageModule?.sendMessage) toast("FakeNitro: sendMessage not found", "WarningIcon");
    patchSend();
    patchChecks();
    patchRender();
    logger.info("[FakeNitro] loaded");
}

const SIZES = [
    { label: "16", value: "16" },
    { label: "32", value: "32" },
    { label: "48", value: "48" },
    { label: "64", value: "64" },
    { label: "96", value: "96" },
    { label: "128", value: "128" }
];

function Settings() {
    return (
        <SettingsPage>
            <Section title="Эмодзи">
                <SwitchRow setting="transformEmoji" fallback={true} label="Превращать ссылки в эмодзи" subLabel="Отправленные ссылки на кастомные эмодзи рендерятся как картинки." icon="EmojiIcon" />
                <RadioGroup title="Размер эмодзи" setting="emojiSize" fallback="48" options={SIZES} />
            </Section>
            <Section title="Nitro">
                <SwitchRow setting="themes" fallback={true} label="Nitro-темы и иконки" subLabel="Включает проверки CLIENT_THEMES и APP_ICONS." icon="NitroWheelIcon" />
                <SwitchRow setting="stream" fallback={true} label="Качество стрима" subLabel="Разрешает среднее и высокое качество трансляции." icon="ScreenIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.emojiSize === undefined) plugin.storage.emojiSize = 48;
        if (plugin.storage.transformEmoji === undefined) plugin.storage.transformEmoji = true;
        if (plugin.storage.themes === undefined) plugin.storage.themes = true;
        if (plugin.storage.stream === undefined) plugin.storage.stream = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

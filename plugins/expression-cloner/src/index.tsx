/*
 * ExpressionCloner for Allidroid
 * Based on the Vencord plugin and the Vendetta stealmoji port by fierdetta.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, findInReactTree, safeFindByProps, safeFindByTypeName, safeFindByName, safeStore,
    allByPath, showSimpleActionSheet, hideActionSheet, toast, table, SettingsPage, Section, SwitchRow, patchComponent,
    applyWithRetry
} from "@shared";

const HTTP = safeFindByProps("getAPIBaseURL", "post");
const GuildStore = safeStore("GuildStore");
const PermissionStore = safeStore("PermissionStore");
let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        } catch (error) {
            reject(error);
        }
    });
}

async function fetchDataURL(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    return blobToDataURL(blob);
}

function canManage(guild: any) {
    try {
        const permission = 1n << 30n; // MANAGE_GUILD_EXPRESSIONS
        return PermissionStore?.can?.(permission, { guild_id: guild.id }) ?? true;
    } catch {
        return true;
    }
}

function clone(emoji: any, guild: any) {
    hideActionSheet();

    const name = String(emoji.name ?? emoji.alt ?? "emoji").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32) || "emoji";
    const src = emoji.src ?? (emoji.id ? `https://cdn.discordapp.com/emojis/${emoji.id}.${String(emoji.src ?? "").includes(".gif") ? "gif" : "webp"}?size=128` : null);
    if (!src) {
        toast("Не удалось получить картинку эмодзи", "WarningIcon");
        return;
    }

    toast("Клонирую эмодзи…", "ClockIcon");

    fetchDataURL(src)
        .then(image => HTTP?.post?.({
            url: `/guilds/${guild.id}/emojis`,
            body: { image, name },
            oldFormErrors: true,
            rejectWithError: true
        }))
        .then(() => toast(`Эмодзи добавлен на «${guild.name}»`, "CheckmarkSmallIcon"))
        .catch((error: any) => toast(error?.message ?? "Не удалось клонировать эмодзи", "WarningIcon"));
}

function showGuilds(emoji: any) {
    const guilds = Object.values(GuildStore?.getGuilds?.() ?? {}).filter(canManage);
    if (!guilds.length) {
        toast("Нет серверов с правом управления эмодзи", "WarningIcon");
        return;
    }

    showSimpleActionSheet({
        key: "ExpressionClonerGuilds",
        header: {
            title: "Клонировать эмодзи на сервер",
            onClose: hideActionSheet
        },
        options: guilds.slice(0, 30).map((guild: any) => ({
            label: guild.name,
            onPress: () => clone(emoji, guild)
        }))
    });
}

function appendRow(tree: any, node: any) {
    if (!node?.id || !node?.src) return tree;

    const array = findInReactTree(tree, (candidate: any) =>
        Array.isArray(candidate)
        && candidate.length >= 2
        && candidate.some((child: any) => child?.props?.onPress || child?.props?.IconComponent)
    );
    if (!Array.isArray(array)) return tree;
    if (array.some((child: any) => child?.key === "expression-cloner")) return tree;

    const { TableRowGroup, TableRow } = table();
    if (!TableRowGroup || !TableRow) return tree;

    array.push(
        <TableRowGroup key="expression-cloner">
            <TableRow
                label="Клонировать эмодзи"
                subLabel={node.name ?? node.alt}
                arrow
                onPress={() => showGuilds(node)}
            />
        </TableRowGroup>
    );
    return tree;
}

function patchEmojiModule(module: any) {
    if (!module?.default) return;
    try {
        unpatch.push(...patchComponent(module, "after", ([props]: any[], tree: any) =>
            props?.emojiNode ? appendRow(tree, props.emojiNode) : tree
        ));
    } catch (error) {
        console.warn("[ExpressionCloner] patch failed", error);
    }
}

function apply() {
    const component = safeFindByTypeName("CustomEmojiContent", false)
        ?? safeFindByName("CustomEmojiContent", false);
    if (component) patchEmojiModule(component);

    for (const path of ["modules/messages/native/emoji/CustomEmojiContent.tsx"]) {
        for (const module of allByPath(path)) patchEmojiModule(module);
    }

    if (!unpatch.length) toast("ExpressionCloner: emoji sheet not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Клонирование">
                <SwitchRow setting="enabled" fallback={true} label="Включить клонирование эмодзи" icon="EmojiIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.enabled === undefined) plugin.storage.enabled = true;
        retryCancel = applyWithRetry(apply, () => unpatch.length > 0);
    },
    onUnload() {
        retryCancel?.();
        retryCancel = null;
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

/*
 * CopyEmojiMarkdown for Allidroid
 * Based on the Vencord plugin by HappyEnderman and Vishnya.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, copy, findInReactTree, safeFindByTypeName, allByPath,
    SettingsPage, Section, SwitchRow, toast, table,
    applyWithRetry
} from "@shared";

let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function markdown(node: any) {
    if (!node) return null;
    if (!node.id) {
        return plugin.storage.copyUnicode !== false
            ? node.surrogate ?? node.content ?? `:${node.name ?? node.alt}:`
            : `:${node.name ?? node.alt}:`;
    }
    const animated = String(node.src ?? "").includes(".gif") || node.animated === true;
    return `<${animated ? "a" : ""}:${node.name ?? node.alt}:${node.id}>`;
}

function appendRow(tree: any, node: any) {
    const value = markdown(node);
    if (!value) return tree;

    const array = findInReactTree(tree, (candidate: any) =>
        Array.isArray(candidate)
        && candidate.length >= 2
        && candidate.some((child: any) => child?.props?.onPress || child?.props?.IconComponent)
    );
    if (!Array.isArray(array)) return tree;
    if (array.some((child: any) => child?.key === "copy-emoji-markdown")) return tree;

    const { TableRowGroup, TableRow } = table();
    if (!TableRowGroup || !TableRow) return tree;

    array.push(
        <TableRowGroup key="copy-emoji-markdown">
            <TableRow
                label="Скопировать markdown эмодзи"
                subLabel={value}
                arrow
                onPress={() => copy(value, "Markdown эмодзи скопирован")}
            />
        </TableRowGroup>
    );
    return tree;
}

function patchComponent(module: any) {
    if (!module?.default) return;
    try {
        unpatch.push(patcher.after("default", module, ([props]: any[], tree: any) => {
            const node = props?.emojiNode;
            return node ? appendRow(tree, node) : tree;
        }));
    } catch (error) {
        console.warn("[CopyEmojiMarkdown] patch failed", error);
    }
}

function apply() {
    for (const name of ["CustomEmojiContent", "StandardEmojiContent"]) {
        const component = safeFindByTypeName(name, false);
        if (component) patchComponent(component);
    }

    for (const path of [
        "modules/messages/native/emoji/CustomEmojiContent.tsx",
        "modules/messages/native/emoji/StandardEmojiContent.tsx"
    ]) {
        for (const module of allByPath(path)) patchComponent(module);
    }

    if (!unpatch.length) toast("CopyEmojiMarkdown: emoji sheet not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Эмодзи">
                <SwitchRow
                    setting="copyUnicode"
                    fallback={true}
                    label="Копировать Unicode для обычных эмодзи"
                    subLabel="Если выключено, копируется :name: вместо символа."
                    icon="EmojiIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.copyUnicode === undefined) plugin.storage.copyUnicode = true;
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

/*
 * PronounDB for Allidroid
 * Based on the Vencord plugin and the Vendetta port by acquitelol / Rosie.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, findInReactTree, safeFindByTypeName, safeStore, findByPath,
    SettingsPage, Section, SwitchRow, toast, logger, patchComponent,
    applyWithRetry
} from "@shared";

const UserStore = safeStore("UserStore");
const { DCDChatManager } = RN.NativeModules ?? {};

const REFERENCE: Record<string, string> = {
    hh: "he/him", hi: "he/it", hs: "he/she", ht: "he/they",
    ih: "it/him", ii: "it/its", is: "it/she", it: "it/they",
    shh: "she/he", sh: "she/her", si: "she/it", st: "she/they",
    th: "they/he", ti: "they/it", ts: "they/she", tt: "they/them",
    any: "any", other: "other", ask: "ask", avoid: "avoid, use name",
    unspecified: "unspecified"
};

const map: Record<string, string> = {};
const queue: string[] = [];
let fetching = false;

async function flush() {
    if (fetching || !queue.length) return;
    const ids = [...new Set(queue.splice(0, 49))].filter(id => !map[id]);
    if (!ids.length) return;

    fetching = true;
    try {
        const response = await fetch(
            `https://pronoundb.org/api/v1/lookup-bulk?platform=discord&ids=${ids.join(",")}`,
            { headers: { Accept: "application/json", "X-PronounDB-Source": "Allidroid" } }
        );
        const json = await response.json();
        Object.assign(map, json);
        logger.info(`[PronounDB] loaded ${Object.keys(json).length} pronouns`);
    } catch (error) {
        logger.warn("[PronounDB] lookup failed", error);
    } finally {
        fetching = false;
        if (queue.length) void flush();
    }
}

function queueUser(userId?: string) {
    if (!userId || map[userId] || queue.includes(userId)) return;
    queue.push(userId);
    void flush();
}

function pronoun(userId?: string) {
    if (!userId) return null;
    const value = map[userId];
    if (!value || value === "unspecified") return null;
    return value.split(",").map((part: string) => REFERENCE[part.trim()] ?? part.trim()).join(", ");
}

function PronounBadge({ userId }: { userId: string }) {
    const value = pronoun(userId);
    if (!value) return null;

    return (
        <RN.View style={{ marginTop: 6, marginBottom: 6 }}>
            <RN.Text style={{ color: "#b5bac1", fontSize: 14 }}>
                <RN.Text style={{ color: "#dbdee1", fontWeight: "600" }}>Pronouns: </RN.Text>
                {value}
            </RN.Text>
        </RN.View>
    );
}

function appendToProfile(tree: any, userId: string) {
    const sections = findInReactTree(tree, (node: any) =>
        node?.type?.displayName === "View"
        && Array.isArray(node?.props?.children)
        && node.props.children.some((child: any) =>
            child?.type?.name === "UserProfileBio" || child?.type?.name === "UserProfileAboutMeCard"
        )
    )?.props?.children;

    if (Array.isArray(sections) && !sections.some((child: any) => child?.key === "pronoundb-badge")) {
        sections.unshift(<PronounBadge key="pronoundb-badge" userId={userId} />);
    }
    return tree;
}

let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function patchProfile(name: string) {
    const paths: Record<string, string> = {
        UserProfileContent: "modules/user_profile/native/UserProfileContent.tsx",
        SimplifiedUserProfileContent: "modules/user_profile/native/SimplifiedUserProfileContent.tsx"
    };
    const component = safeFindByTypeName(name, false)
        ?? (paths[name] ? findByPath(paths[name], false) : null);
    if (!component) return;

    unpatch.push(...patchComponent(component, "after", ([props]: any[], tree: any) => {
        const userId = props?.userId ?? props?.user?.id ?? props?.displayProfile?.userId;
        if (userId) queueUser(userId);
        return userId ? appendToProfile(tree, userId) : tree;
    }));
}

function patchChat() {
    if (!DCDChatManager?.updateRows) return;

    unpatch.push(patcher.before("updateRows", DCDChatManager, (args: any[]) => {
        if (plugin.storage.inChat === false) return;

        let rows: any;
        try {
            rows = JSON.parse(args[1]);
        } catch {
            return;
        }
        if (!Array.isArray(rows)) return;

        for (const row of rows) {
            if (row?.type !== 1 || !row?.message) continue;
            const authorId = row.message.authorId ?? row.message.author?.id;
            if (!authorId) continue;
            queueUser(authorId);

            const value = pronoun(authorId);
            if (!value) continue;

            if (plugin.storage.asTimestamp !== false && row.message.timestamp) {
                row.message.timestamp += ` • ${value}`;
                continue;
            }

            if (row.message.opTagText) {
                row.message.tagText = `${row.message.tagText ? row.message.tagText + " • " : ""}${row.message.opTagText}`;
            }
            row.message.opTagText = value;
            row.message.opTagTextColor = RN.processColor("#dbdee1");
            row.message.opTagBackgroundColor = RN.processColor("#4e5058");
        }

        args[1] = JSON.stringify(rows);
    }));
}

function apply() {
    try {
        unpatch.push(patcher.before("getUser", UserStore, (args: any[]) => {
            queueUser(args[0]);
        }));
    } catch { }

    for (const name of ["UserProfile", "UserProfileContent", "SimplifiedUserProfileContent"]) {
        try { patchProfile(name); } catch { }
    }

    patchChat();

    if (!unpatch.length) toast("PronounDB: profile module not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Где показывать">
                <SwitchRow setting="inChat" fallback={true} label="В сообщениях" subLabel="Местоимения добавляются к времени или OP-тегу." icon="ChatIcon" />
                <SwitchRow setting="asTimestamp" fallback={true} label="Рядом со временем" subLabel="Если выключено, используется OP-тег рядом с именем." icon="ClockIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.inChat === undefined) plugin.storage.inChat = true;
        if (plugin.storage.asTimestamp === undefined) plugin.storage.asTimestamp = true;
        retryCancel = applyWithRetry(apply, () => unpatch.length > 0);
    },
    onUnload() {
        retryCancel?.();
        retryCancel = null;
        unpatch.forEach(fn => fn());
        unpatch = [];
        queue.length = 0;
    },
    settings: Settings
};

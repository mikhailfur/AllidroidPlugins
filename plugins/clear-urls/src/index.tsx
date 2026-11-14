/*
 * ClearURLs for Allidroid
 * Based on the Vencord plugin by adryd and thororen.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, safeFindByProps, cleanMessageContent, SettingsPage, Section, SwitchRow, toast
} from "@shared";

let unpatch: (() => void)[] = [];

function clean(target: any) {
    if (plugin.storage.enabled === false) return;
    if (target && typeof target.content === "string") {
        target.content = cleanMessageContent(target.content);
    }
}

function apply() {
    const sender = safeFindByProps("sendMessage", "receiveMessage");
    if (sender?.sendMessage) {
        unpatch.push(patcher.before("sendMessage", sender, (args: any[]) => {
            clean(args[1]);
        }));
    }

    for (const key of ["editMessage", "startEditMessage"]) {
        const mod = safeFindByProps(key);
        if (mod?.[key]) {
            unpatch.push(patcher.before(key, mod, (args: any[]) => {
                clean(args[2] ?? args[1]);
            }));
        }
    }

    if (!unpatch.length) toast("ClearURLs: sendMessage not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Ссылки">
                <SwitchRow
                    setting="enabled"
                    fallback={true}
                    label="Чистить ссылки перед отправкой"
                    subLabel="Убирает utm_*, fbclid, gclid, si, igshid и другие трекерные параметры."
                    icon="LinkIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.enabled === undefined) plugin.storage.enabled = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

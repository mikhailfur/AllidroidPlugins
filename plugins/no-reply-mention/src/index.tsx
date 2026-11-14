/*
 * NoReplyMention for Allidroid
 * Based on the Vencord plugin by DustyAngel47, rae, pylix and outfoxxed.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { patcher, plugin, safeFindByProps, SettingsPage, Section, SwitchRow, toast } from "@shared";

let unpatch: (() => void) | null = null;

function apply() {
    const reply = safeFindByProps("createPendingReply");
    if (!reply?.createPendingReply) {
        toast("NoReplyMention: createPendingReply not found", "WarningIcon");
        return;
    }

    unpatch = patcher.before("createPendingReply", reply, ([pending]: any[]) => {
        if (plugin.storage.enabled === false) return;
        if (pending && typeof pending === "object") pending.shouldMention = false;
    });
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Ответы">
                <SwitchRow
                    setting="enabled"
                    fallback={true}
                    label="Не пинговать при ответе"
                    subLabel="При свайпе-ответе автор сообщения не получит упоминание."
                    icon="MentionIcon"
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
        unpatch?.();
        unpatch = null;
    },
    settings: Settings
};

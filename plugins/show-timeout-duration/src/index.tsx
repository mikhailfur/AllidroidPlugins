/*
 * ShowTimeoutDuration for Allidroid
 * Based on the Vencord plugin by V and Sqaaakoi and the Revenge port by Palm.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, RN, safeFindByName, safeFindByProps, safeStore, formatDuration,
    SettingsPage, Section, SwitchRow, toast
} from "@shared";

const RowManager = safeFindByName("RowManager");
const GuildMemberStore = safeStore("GuildMemberStore");
const ChannelStore = safeStore("ChannelStore");
let unpatch: (() => void)[] = [];

function timeoutText(authorId: string, channelId: string) {
    try {
        const channel = ChannelStore?.getChannel?.(channelId);
        const guildId = channel?.guild_id;
        if (!guildId) return null;

        const member = GuildMemberStore?.getMember?.(guildId, authorId);
        const until = member?.communicationDisabledUntil;
        if (!until) return null;

        const ms = new Date(until).getTime() - Date.now();
        if (ms <= 0) return null;

        if (plugin.storage.remaining === false) {
            return `⏳ до ${new Date(until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        }
        return `⏳ ${formatDuration(Math.floor(ms / 1000), true)}`;
    } catch {
        return null;
    }
}

function apply() {
    if (!RowManager?.prototype?.generate) {
        toast("ShowTimeoutDuration: RowManager not found", "WarningIcon");
        return;
    }

    unpatch.push(patcher.after("generate", RowManager.prototype, ([data]: any[], row: any) => {
        if (data?.rowType !== 1 || !row?.message) return row;
        const authorId = row.message.authorId ?? row.message.author?.id;
        const channelId = row.message.channelId ?? row.message.channel_id;
        if (!authorId || !channelId) return row;

        const text = timeoutText(authorId, channelId);
        if (!text) return row;

        if (row.message.opTagText) {
            row.message.tagText = `${row.message.tagText ? row.message.tagText + " • " : ""}${row.message.opTagText}`;
        }
        row.message.opTagText = text;
        row.message.opTagTextColor = RN.processColor("#ffffff");
        row.message.opTagBackgroundColor = RN.processColor("#f23f43");
        return row;
    }));
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Тайм-ауты">
                <SwitchRow
                    setting="remaining"
                    fallback={true}
                    label="Показывать оставшееся время"
                    subLabel="Если выключено, показывается время окончания тайм-аута."
                    icon="ClockWarningIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.remaining === undefined) plugin.storage.remaining = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

/*
 * ShowHiddenChannels for Allidroid
 * Based on the Vencord plugin by V and the Vendetta port by c10udburst.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, Constants, safeFindByName, safeFindByProps, safeStore,
    SettingsPage, Section, SwitchRow, toast
,
    applyWithRetry
} from "@shared";

const Permissions = safeFindByProps("getChannelPermissions", "can");
const ChannelStore = safeStore("ChannelStore") ?? safeFindByProps("getChannel");
const { extractTimestamp } = safeFindByProps("extractTimestamp") ?? {};
const MessagesWrapper = safeFindByName("MessagesWrapperConnected", false)
    ?? safeFindByName("MessagesWrapperConnected", true);

const SKIP = new Set([1, 3, 4]);
let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function getChannel(channel: any) {
    if (!channel) return null;
    return typeof channel === "string" ? ChannelStore?.getChannel?.(channel) : channel;
}

function isHidden(channel: any) {
    const resolved = getChannel(channel);
    if (!resolved || SKIP.has(resolved.type)) return false;
    if (!Permissions?.can) return false;

    resolved.__shc_realCheck = true;
    let result = false;
    try {
        result = !Permissions.can(Constants.Permissions?.VIEW_CHANNEL ?? (1n << 10n), resolved);
    } finally {
        delete resolved.__shc_realCheck;
    }
    return result;
}

function formatDate(value: any) {
    try {
        return new Date(value).toLocaleString();
    } catch {
        return String(value);
    }
}

function HiddenChannel({ channel }: any) {
    const created = extractTimestamp ? new Date(extractTimestamp(channel.id)) : null;
    const last = channel.lastMessageId && extractTimestamp ? new Date(extractTimestamp(channel.lastMessageId)) : null;

    return (
        <RN.View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}>
            <RN.Text style={{ fontSize: 24, fontWeight: "600", color: "#f2f3f5", marginBottom: 16 }}>
                Скрытый канал
            </RN.Text>
            <RN.Text style={{ fontSize: 15, color: "#b5bac1", lineHeight: 22, textAlign: "center" }}>
                {plugin.storage.showTopic !== false ? `Тема: ${channel.topic || "нет"}\n\n` : ""}
                {plugin.storage.showDates !== false && created ? `Создан: ${formatDate(created)}\n` : ""}
                {plugin.storage.showLastMessage !== false && last ? `Последнее сообщение: ${formatDate(last)}\n` : ""}
                {plugin.storage.showLastMessage !== false ? `Последний пин: ${channel.lastPinTimestamp ? formatDate(channel.lastPinTimestamp) : "нет"}` : ""}
            </RN.Text>
        </RN.View>
    );
}

function apply() {
    if (!Permissions?.can) {
        toast("ShowHiddenChannels: Permissions module not found", "WarningIcon");
        return;
    }

    unpatch.push(patcher.after("can", Permissions, ([permission, channel]: any[], result: any) => {
        if (!channel?.__shc_realCheck && permission === (Constants.Permissions?.VIEW_CHANNEL ?? (1n << 10n))) return true;
        return result;
    }));

    if (MessagesWrapper) {
        const component = MessagesWrapper?.default ?? MessagesWrapper;
        const target = typeof component === "function" ? component : component?.type;
        if (target) {
            unpatch.push(patcher.instead("default", MessagesWrapper, function (args: any[], original: any) {
                const channel = args?.[0]?.channel;
                if (plugin.storage.enabled !== false && isHidden(channel)) {
                    return React.createElement(HiddenChannel, { channel });
                }
                return original.apply(this, args);
            }));
        }
    }

    if (!MessagesWrapper) toast("ShowHiddenChannels: MessagesWrapperConnected not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Скрытые каналы">
                <SwitchRow setting="enabled" fallback={true} label="Показывать скрытые каналы" icon="EyeIcon" />
                <SwitchRow setting="showTopic" fallback={true} label="Показывать тему" />
                <SwitchRow setting="showDates" fallback={true} label="Показывать даты" />
                <SwitchRow setting="showLastMessage" fallback={true} label="Показывать последнее сообщение и пин" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.enabled === undefined) plugin.storage.enabled = true;
        if (plugin.storage.showTopic === undefined) plugin.storage.showTopic = true;
        if (plugin.storage.showDates === undefined) plugin.storage.showDates = true;
        if (plugin.storage.showLastMessage === undefined) plugin.storage.showLastMessage = true;
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

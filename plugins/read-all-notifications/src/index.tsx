/*
 * ReadAllNotificationsButton for Allidroid
 * Based on the Vencord plugin by kemo.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, findInReactTree, safeFindByProps, safeStore, safeFindByName,
    getAssetID, toast, SettingsPage, Section, ActionRow, patchComponent
} from "@shared";

const GuildStore = safeStore("GuildStore");
const GuildChannelStore = safeStore("GuildChannelStore");
const ReadStateStore = safeStore("ReadStateStore");
const ReadStateActions = safeFindByProps("bulkAck");
let unpatch: (() => void)[] = [];

function collect() {
    const channels: any[] = [];
    const guilds = GuildStore?.getGuilds?.() ?? {};

    for (const guild of Object.values(guilds) as any[]) {
        const groups = GuildChannelStore?.getChannels?.(guild.id) ?? {};
        const selectable = groups.SELECTABLE ?? [];
        const vocal = groups.VOCAL ?? [];

        for (const entry of [...selectable, ...vocal]) {
            const channel = entry?.channel ?? entry;
            if (!channel?.id) continue;
            if (!ReadStateStore?.hasUnread?.(channel.id)) continue;

            channels.push({
                channelId: channel.id,
                messageId: ReadStateStore.lastMessageId?.(channel.id),
                readStateType: 0
            });
        }
    }

    return channels;
}

function readAll() {
    const channels = collect();
    if (!channels.length) {
        toast("Нет непрочитанных серверных каналов", "CheckmarkIcon");
        return;
    }

    try {
        if (ReadStateActions?.bulkAck) {
            ReadStateActions.bulkAck(channels);
        } else {
            const dispatcher = safeFindByProps("dispatch", "subscribe")?.dispatch;
            dispatcher?.({ type: "BULK_ACK", context: "APP", channels });
        }
        toast(`Прочитано каналов: ${channels.length}`, "CheckmarkIcon");
    } catch (error: any) {
        toast(error?.message ?? "Не удалось отметить всё прочитанным", "WarningIcon");
    }
}

function ReadAllIcon() {
    const id = getAssetID("CheckmarkLargeIcon") ?? getAssetID("CheckmarkIcon");
    return <RN.Image source={id} style={{ width: 20, height: 20, tintColor: "#dbdee1" }} />;
}

function patchHeader() {
    const header = safeFindByName("MessagesHeader", false) ?? safeFindByName("MessagesHeader");
    if (!header) return false;

    unpatch.push(...patchComponent(header, "after", (_args: any[], tree: any) => {
        const buttons = findInReactTree(tree, (node: any) =>
            Array.isArray(node)
            && node.length >= 2
            && node.some((child: any) => child?.type?.name === "IconButton" || child?.props?.variant === "secondary")
            && node.some((child: any) => child?.type?.name === "Button" || child?.props?.text)
        );

        if (!Array.isArray(buttons)) return tree;
        if (buttons.some((child: any) => child?.key === "read-all-button")) return tree;

        const IconButton = safeFindByProps("IconButton")?.IconButton;
        if (IconButton) {
            buttons.push(
                <IconButton
                    key="read-all-button"
                    variant="secondary"
                    size="sm"
                    icon={ReadAllIcon}
                    accessibilityLabel="Прочитать все уведомления"
                    onPress={readAll}
                />
            );
        }
        return tree;
    }));

    return true;
}

function apply() {
    if (!patchHeader()) {
        toast("ReadAllNotificationsButton: header not found — используйте настройки", "WarningIcon");
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Уведомления">
                <ActionRow
                    label="Отметить все серверы прочитанными"
                    subLabel="Работает как кнопка в шапке вкладки сообщений."
                    icon="CheckmarkIcon"
                    arrow
                    onPress={readAll}
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

/*
 * ReadAllNotificationsButton for Allidroid
 * Based on the Vencord plugin by kemo.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, findInReactTree, safeFindByProps, safeStore, safeFindByName,
    getAssetID, toast, SettingsPage, Section, ActionRow, SwitchRow, patchComponent, findByPath, safeFindByTypeName, appendActionSheetRow, actionSheetRow,
    applyWithRetry
} from "@shared";

const GuildStore = safeStore("GuildStore");
const GuildChannelStore = safeStore("GuildChannelStore");
const ReadStateStore = safeStore("ReadStateStore");
const PrivateChannelSortStore = safeStore("PrivateChannelSortStore") ?? safeFindByProps("getPrivateChannelIds");
const ReadStateActions = safeFindByProps("bulkAck");
let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function collect() {
    const byId = new Map<string, any>();

    const guilds = GuildStore?.getGuilds?.() ?? {};
    for (const guild of Object.values(guilds) as any[]) {
        const groups = GuildChannelStore?.getChannels?.(guild.id) ?? {};
        const entries = [...(groups.SELECTABLE ?? []), ...(groups.VOCAL ?? [])];

        for (const entry of entries) {
            const channel = entry?.channel ?? entry;
            if (!channel?.id) continue;
            if (!ReadStateStore?.hasUnread?.(channel.id)) continue;
            byId.set(channel.id, {
                channelId: channel.id,
                messageId: ReadStateStore.lastMessageId?.(channel.id),
                readStateType: 0
            });
        }
    }

    if (plugin.storage.includeDms !== false) {
        const ids = PrivateChannelSortStore?.getPrivateChannelIds?.() ?? [];
        for (const id of ids) {
            if (!ReadStateStore?.hasUnread?.(id)) continue;
            byId.set(id, {
                channelId: id,
                messageId: ReadStateStore.lastMessageId?.(id),
                readStateType: 0
            });
        }
    }

    return [...byId.values()];
}

function readAll() {
    const channels = collect();
    if (!channels.length) {
        toast("Нет непрочитанных каналов", "CheckmarkIcon");
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

function ReadAllIcon({ size = 20, tint = "#dbdee1" }: { size?: number; tint?: string }) {
    const id = getAssetID("CheckmarkLargeIcon") ?? getAssetID("CheckmarkIcon");
    return <RN.Image source={id} style={{ width: size, height: size, tintColor: tint }} />;
}

function ReadAllButton() {
    return (
        <RN.Pressable
            key="read-all-button"
            accessibilityLabel="Прочитать всё"
            onPress={readAll}
            style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(88,101,242,0.18)",
                borderWidth: 1,
                borderColor: "rgba(88,101,242,0.45)"
            }}
        >
            <ReadAllIcon />
        </RN.Pressable>
    );
}

function patchHeader() {
    const header = safeFindByName("MessagesHeader", false)
        ?? safeFindByTypeName("MessagesHeader", false)
        ?? findByPath("modules/main_tabs_v2/native/tabs/messages/MessagesHeader.tsx", false)
        ?? safeFindByName("MessagesHeader");
    if (!header) return false;

    const before = unpatch.length;
    unpatch.push(...patchComponent(header, "after", (_args: any[], tree: any) => {
        if (!React.isValidElement(tree)) return tree;
        if (findInReactTree(tree, (node: any) => node?.key === "read-all-button")) return tree;

        const buttons = findInReactTree(tree, (node: any) =>
            Array.isArray(node)
            && node.length >= 2
            && node.some((child: any) =>
                child?.type?.name === "IconButton"
                || child?.props?.variant === "secondary"
                || child?.props?.accessibilityLabel
                || child?.props?.icon
            )
        );

        if (!Array.isArray(buttons)) return tree;

        const IconButton = safeFindByProps("IconButton")?.IconButton;
        if (IconButton) {
            buttons.push(
                <IconButton
                    key="read-all-button"
                    variant="secondary"
                    size="sm"
                    icon={ReadAllIcon}
                    accessibilityLabel="Прочитать всё"
                    onPress={readAll}
                />
            );
        } else {
            buttons.push(<ReadAllButton key="read-all-button" />);
        }

        return tree;
    }));

    return unpatch.length > before;
}

function MessagesFab() {
    return (
        <RN.Pressable
            key="read-all-fab"
            accessibilityLabel="Прочитать всё"
            onPress={readAll}
            style={{
                position: "absolute",
                right: 16,
                bottom: 92,
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#5865f2",
                zIndex: 30,
                elevation: 10,
                shadowColor: "#000",
                shadowOpacity: 0.35,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 }
            }}
        >
            <ReadAllIcon size={24} tint="#ffffff" />
        </RN.Pressable>
    );
}

function patchFab() {
    const messages = findByPath("modules/main_tabs_v2/native/tabs/messages/Messages.tsx", false)
        ?? safeFindByTypeName("Messages", false)
        ?? safeFindByName("Messages", false);
    if (!messages) return false;

    const before = unpatch.length;
    unpatch.push(...patchComponent(messages, "after", (_args: any[], tree: any) => {
        if (!React.isValidElement(tree)) return tree;
        if (findInReactTree(tree, (node: any) => node?.key === "read-all-fab")) return tree;

        const children = React.Children.toArray(tree.props?.children);
        return React.cloneElement(tree as any, { children: [...children, <MessagesFab key="read-all-fab" />] });
    }));

    return unpatch.length > before;
}

function patchChannelSheet() {
    const sheet = safeFindByName("ChannelLongPressActionSheet", false)
        ?? safeFindByTypeName("ChannelLongPressActionSheet", false);
    if (!sheet) return false;

    const before = unpatch.length;
    unpatch.push(...patchComponent(sheet, "after", (_args: any[], tree: any) => {
        if (findInReactTree(tree, (node: any) => node?.key === "read-all-sheet-row")) return tree;
        const row = actionSheetRow("Прочитать всё", readAll, "CheckmarkIcon");
        if (row) {
            const keyed = React.cloneElement(row, { key: "read-all-sheet-row" });
            appendActionSheetRow(tree, keyed);
        }
        return tree;
    }));

    return unpatch.length > before;
}

function apply() {
    const header = patchHeader();
    const fab = patchFab();
    const sheet = patchChannelSheet();
    if (!header && !fab && !sheet) {
        toast("ReadAllNotificationsButton: кнопка не найдена — используйте настройки", "WarningIcon");
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Прочитать всё">
                <ActionRow
                    label="Отметить все каналы прочитанными"
                    subLabel="Серверные каналы, голосовые каналы и личные сообщения."
                    icon="CheckmarkIcon"
                    arrow
                    onPress={readAll}
                />
                <SwitchRow
                    setting="includeDms"
                    fallback={true}
                    label="Включать личные сообщения"
                    subLabel="Если выключено, отмечаются только серверные каналы."
                    icon="ChatIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.includeDms === undefined) plugin.storage.includeDms = true;
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

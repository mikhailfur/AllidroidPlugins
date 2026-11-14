/*
 * PinDMs for Allidroid
 * Based on the Vencord plugin and the Vendetta port by fres.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, FluxDispatcher, safeFindByName, safeFindByProps, safeStore,
    appendActionSheetRow, actionSheetRow, SettingsPage, Section, ActionRow, toast, patchComponent, safeFindByTypeName,
    applyWithRetry
} from "@shared";

const PrivateChannelSortStore = safeStore("PrivateChannelSortStore") ?? safeFindByProps("getPrivateChannelIds");
const ChannelStore = safeStore("ChannelStore");
let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function pinned(): string[] {
    if (!Array.isArray(plugin.storage.pinned)) plugin.storage.pinned = [];
    return plugin.storage.pinned;
}

function isPinned(channelId: string) {
    return pinned().includes(channelId);
}

function refresh() {
    try {
        PrivateChannelSortStore?.emitChange?.();
        FluxDispatcher?.dispatch?.({ type: "CHANNEL_UPDATES", channels: [] });
    } catch { }
}

function pin(channelId: string) {
    if (!channelId || isPinned(channelId)) return;
    plugin.storage.pinned = [channelId, ...pinned()];
    toast("ЛС закреплено", "PinIcon");
    refresh();
}

function unpin(channelId: string) {
    plugin.storage.pinned = pinned().filter(id => id !== channelId);
    toast("ЛС откреплено", "PinIcon");
    refresh();
}

function apply() {
    if (PrivateChannelSortStore?.getPrivateChannelIds) {
        unpatch.push(patcher.instead("getPrivateChannelIds", PrivateChannelSortStore, function (args: any[], original: any) {
            const ids = original.apply(this, args) ?? [];
            const order = pinned();
            if (!order.length) return ids;
            const set = new Set(order);
            return [...order.filter(id => ids.includes(id)), ...ids.filter((id: string) => !set.has(id))];
        }));
    }

    const sheet = safeFindByName("ChannelLongPressActionSheet", false)
        ?? safeFindByTypeName("ChannelLongPressActionSheet", false);
    if (sheet) {
        unpatch.push(...patchComponent(sheet, "after", ([props]: any[], tree: any) => {
            const channelId = props?.channelId ?? props?.channel?.id;
            const channel = ChannelStore?.getChannel?.(channelId);
            if (!channel || ![1, 3].includes(channel.type)) return tree;

            const row = actionSheetRow(
                isPinned(channelId) ? "Открепить ЛС" : "Закрепить ЛС",
                () => isPinned(channelId) ? unpin(channelId) : pin(channelId),
                "PinIcon"
            );
            return row ? appendActionSheetRow(tree, row) : tree;
        }));
    }

    if (!unpatch.length) toast("PinDMs: private channel list not found", "WarningIcon");
}

function Settings() {
    const list = pinned();

    return (
        <SettingsPage>
            <Section title="Закреплённые ЛС">
                <ActionRow
                    label={`Закреплено: ${list.length}`}
                    subLabel="Долгое нажатие на ЛС → «Закрепить ЛС»."
                    icon="PinIcon"
                />
                <ActionRow
                    label="Открепить все"
                    variant={list.length ? "danger" : undefined}
                    disabled={!list.length}
                    onPress={() => {
                        plugin.storage.pinned = [];
                        refresh();
                        toast("Все ЛС откреплены", "PinIcon");
                    }}
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (!Array.isArray(plugin.storage.pinned)) plugin.storage.pinned = [];
        retryCancel = applyWithRetry(apply, () => unpatch.length > 0);
    },
    onUnload() {
        retryCancel?.();
        retryCancel = null;
        unpatch.forEach(fn => fn());
        unpatch = [];
        refresh();
    },
    settings: Settings
};

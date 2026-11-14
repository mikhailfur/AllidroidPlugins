/*
 * HideAttachments (HideMedia) for Allidroid
 * Based on the Vencord plugin by V and c0nnorgg.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, FluxDispatcher, findInReactTree, safeFindByName,
    safeFindByTypeName, safeStore, SettingsPage, Section, ActionRow, appendActionSheetRow, findByPath,
    actionSheetGroup, actionSheetRow, toast, table, patchComponent,
    applyWithRetry
} from "@shared";

const RowManager = safeFindByName("RowManager");
const MessageStore = safeStore("MessageStore");
let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function hiddenIds(): string[] {
    if (!Array.isArray(plugin.storage.hidden)) plugin.storage.hidden = [];
    return plugin.storage.hidden;
}

function isHidden(id: string) {
    return hiddenIds().includes(id);
}

function toggle(message: any) {
    const id = message?.id;
    if (!id) return;

    const ids = hiddenIds();
    const index = ids.indexOf(id);
    if (index === -1) ids.push(id);
    else ids.splice(index, 1);

    plugin.storage.hidden = ids;
    const channelId = message.channel_id ?? message.channelId;
    try {
        FluxDispatcher.dispatch({ type: "MESSAGE_UPDATE", message, channelId });
    } catch { }
}

function hasMedia(message: any) {
    return Boolean(
        message?.attachments?.length
        || message?.embeds?.length
        || message?.stickerItems?.length
        || message?.components?.length
    );
}

function appendMenuRow(tree: any, message: any) {
    if (!hasMedia(message)) return tree;

    const label = isHidden(message.id) ? "Показать медиа" : "Скрыть медиа";
    const row = actionSheetRow(label, () => toggle(message), isHidden(message.id) ? "EyeIcon" : "EyeOffIcon");
    return row ? appendActionSheetRow(tree, row) : tree;
}

function apply() {
    if (RowManager?.prototype?.generate) {
        unpatch.push(patcher.after("generate", RowManager.prototype, ([data]: any[], row: any) => {
            const message = data?.message;
            if (!message || !isHidden(message.id)) return row;

            row.message.attachments = [];
            row.message.embeds = [];
            row.message.stickerItems = [];
            row.message.components = [];
            row.message.content = Array.isArray(row.message.content)
                ? row.message.content
                : row.message.content;
            return row;
        }));
    }

    const sheet = safeFindByName("MessageLongPressActionSheet", false)
        ?? safeFindByTypeName("MessageLongPressActionSheet", false)
        ?? findByPath("modules/messages/native/long_press/LongPressMessageActionSheet.tsx", false)
        ?? safeFindByName("LongPressMessageActionSheet", false);

    if (sheet) {
        unpatch.push(...patchComponent(sheet, "after", ([props]: any[], tree: any) =>
            appendMenuRow(tree, props?.message)
        ));
    }

    if (!unpatch.length) toast("HideAttachments: message modules not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Скрытые сообщения">
                <ActionRow
                    label={`Скрыто сообщений: ${hiddenIds().length}`}
                    subLabel="Список живёт до перезапуска приложения."
                    icon="ImageInvisibleIcon"
                />
                <ActionRow
                    label="Показать все"
                    variant={hiddenIds().length ? "danger" : undefined}
                    disabled={!hiddenIds().length}
                    onPress={() => {
                        plugin.storage.hidden = [];
                        for (const message of Object.values(MessageStore?._channelMessages ?? {}).flatMap((channel: any) => channel?._array ?? [])) {
                            try { FluxDispatcher.dispatch({ type: "MESSAGE_UPDATE", message, channelId: message.channel_id }); } catch { }
                        }
                        toast("Все медиа снова видны", "EyeIcon");
                    }}
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (!Array.isArray(plugin.storage.hidden)) plugin.storage.hidden = [];
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

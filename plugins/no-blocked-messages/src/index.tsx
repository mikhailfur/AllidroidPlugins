/*
 * NoBlockedMessages for Allidroid
 * Based on the Vencord plugin by V and the mobile ports by zykrah and Palm.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, FluxDispatcher, safeFindByName, safeStore, SettingsPage, Section, SwitchRow, toast
} from "@shared";

const RelationshipStore = safeStore("RelationshipStore") ?? safeStore("RelationshipStore");
const RowManager = safeFindByName("RowManager");
let unpatch: (() => void)[] = [];

function enabled(key: string) {
    return plugin.storage[key] !== false;
}

function hidden(userId?: string) {
    if (!userId) return false;
    try {
        if (enabled("blocked") && RelationshipStore?.isBlocked?.(userId)) return true;
        if (enabled("ignored") && RelationshipStore?.isIgnored?.(userId)) return true;
    } catch { }
    return false;
}

function apply() {
    if (!FluxDispatcher) {
        toast("NoBlockedMessages: FluxDispatcher not found", "WarningIcon");
        return;
    }

    unpatch.push(patcher.before("dispatch", FluxDispatcher, ([event]: any[]) => {
        if (!event) return;

        if (event.type === "LOAD_MESSAGES_SUCCESS" && Array.isArray(event.messages)) {
            if (!enabled("blocked") && !enabled("ignored")) return;
            event.messages = event.messages.filter((message: any) => {
                if (hidden(message?.author?.id)) return false;
                if (enabled("replies") && message?.referenced_message?.author?.id && hidden(message.referenced_message.author.id)) return false;
                return true;
            });
            return;
        }

        if (event.type === "MESSAGE_CREATE" || event.type === "MESSAGE_UPDATE") {
            const message = event.message;
            if (!message) return;
            if (hidden(message.author?.id)) {
                message.__nb_hidden = true;
            } else if (enabled("replies") && message.referenced_message?.author?.id && hidden(message.referenced_message.author.id)) {
                message.__nb_hidden = true;
            }
        }
    }));

    if (RowManager?.prototype?.generate) {
        unpatch.push(patcher.before("generate", RowManager.prototype, ([data]: any[]) => {
            if (!data?.message) return;
            if (!data.message.__nb_hidden && !hidden(data.message.author?.id)) return;

            data.renderContentOnly = true;
            data.message.content = [];
            data.message.attachments = [];
            data.message.embeds = [];
            data.message.reactions = [];
            data.message.components = [];
            data.message.stickerItems = [];
            data.message.backgroundHighlight = null;
        }));
    }

    if (!unpatch.length) toast("NoBlockedMessages: RowManager not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Что скрывать">
                <SwitchRow setting="blocked" fallback={true} label="Заблокированные" icon="DenyIcon" />
                <SwitchRow setting="ignored" fallback={true} label="Игнорируемые" icon="EyeOffIcon" />
                <SwitchRow setting="replies" fallback={false} label="Ответы на скрытых пользователей" subLabel="Прячет сообщения, которые отвечают заблокированному или игнорируемому." icon="ReplyIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.blocked === undefined) plugin.storage.blocked = true;
        if (plugin.storage.ignored === undefined) plugin.storage.ignored = true;
        if (plugin.storage.replies === undefined) plugin.storage.replies = false;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

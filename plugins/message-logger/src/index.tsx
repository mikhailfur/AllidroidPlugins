/*
 * MessageLogger for Allidroid
 * Based on the Vencord plugin by rushii, V, AutumnVN, Nickyux, Kyuuhachi,
 * sadan and f3tch, plus the Vendetta mobile ports by Angel~ and kasi.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, RN, FluxDispatcher, safeFindByName, safeFindByProps, safeStore,
    SettingsPage, Section, SwitchRow, toast, logger
} from "@shared";

const MessageStore = safeStore("MessageStore") ?? safeFindByProps("getMessage", "getMessages");
const ChannelStore = safeStore("ChannelStore") ?? safeFindByProps("getChannel", "getDMFromUserId");
const UserStore = safeStore("UserStore");
const RowManager = safeFindByName("RowManager");
const MessageRecordUtils = safeFindByProps("updateMessageRecord", "createMessageRecord");
const MessageRecord = safeFindByName("MessageRecord", false);

const deleted = new Set<string>();
const edited = new Set<string>();
let unpatch: (() => void)[] = [];

function setting(key: string, fallback = true) {
    const value = plugin.storage[key];
    return value === undefined ? fallback : Boolean(value);
}

function ignored(message: any) {
    if (!message?.author) return true;
    if (setting("ignoreBots", false) && message.author.bot) return true;
    if (setting("ignoreSelf", true) && message.author.id === UserStore?.getCurrentUser?.()?.id) return true;

    const list = plugin.storage.ignoredUsers;
    if (Array.isArray(list) && list.includes(message.author.id)) return true;

    return false;
}

function hasContent(message: any) {
    return Boolean(
        message?.content?.length
        || message?.attachments?.length
        || message?.embeds?.length
        || message?.stickerItems?.length
    );
}

function timeLabel(timestamp: number) {
    try {
        return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
        return new Date(timestamp).toISOString();
    }
}

function patchDeleted(event: any) {
    if (event.__ml_cleanup) return;

    const message = MessageStore?.getMessage?.(event.channelId, event.id);
    if (!message || !hasContent(message) || ignored(message)) return;

    const stamp = Date.now();
    const clone = typeof message.toJS === "function" ? message.toJS() : { ...message };
    clone.__ml_deleted = true;
    clone.__ml_deletedAt = stamp;

    if (setting("timestamps", true)) {
        clone.content = `${clone.content ?? ""}\n\n\`[deleted ${timeLabel(stamp)}]\``.trim();
    }

    deleted.add(event.id);
    logger.info("[MessageLogger] deleted", event.id);

    return [{
        type: "MESSAGE_UPDATE",
        channelId: event.channelId,
        message: clone,
        __ml_deleted: true
    }];
}

function patchEdited(event: any) {
    if (event.__ml_deleted || event.removeHistory) return;

    const message = event.message;
    if (!message?.id || !message?.channel_id) return;

    const original = MessageStore?.getMessage?.(message.channel_id, message.id);
    if (!original || !hasContent(original) || ignored(original)) return;
    if (typeof message.content !== "string" || typeof original.content !== "string") return;
    if (message.content === original.content) return;
    if (edited.has(message.id)) return;

    edited.add(message.id);
    message.__ml_edited = true;
    message.__ml_originalContent = original.content;

    if (setting("showEdits", true)) {
        message.content = `${message.content}\n\n\`[edited]\` ~~${original.content}~~`;
    }

    logger.info("[MessageLogger] edited", message.id);
}

function apply() {
    if (!MessageStore || !FluxDispatcher) {
        toast("MessageLogger: MessageStore not found", "WarningIcon");
        return;
    }

    unpatch.push(patcher.before("dispatch", FluxDispatcher, ([event]: any[]) => {
        if (!event || !setting("logDeleted", true) && event.type === "MESSAGE_DELETE") return;
        if (event.type === "MESSAGE_DELETE") return patchDeleted(event);
        if (event.type === "MESSAGE_UPDATE" && setting("logEdited", true)) patchEdited(event);
    }));

    if (RowManager?.prototype?.generate) {
        unpatch.push(patcher.after("generate", RowManager.prototype, ([data]: any[], row: any) => {
            if (!row?.message || !data?.message) return row;

            if (data.message.__ml_deleted) {
                row.message.edited = "deleted";
                row.backgroundHighlight = {
                    backgroundColor: RN.processColor("#da373c22"),
                    gutterColor: RN.processColor("#da373cff")
                };
            } else if (data.message.__ml_edited) {
                row.message.edited = "edited";
                row.backgroundHighlight = {
                    backgroundColor: RN.processColor("#f0b23222"),
                    gutterColor: RN.processColor("#f0b232ff")
                };
            }

            return row;
        }));
    }

    if (MessageRecordUtils?.updateMessageRecord) {
        unpatch.push(patcher.instead("updateMessageRecord", MessageRecordUtils, function ([oldRecord, newRecord]: any[], original: any) {
            if (newRecord?.__ml_deleted) {
                return MessageRecordUtils.createMessageRecord(newRecord, oldRecord?.reactions);
            }
            return original.apply(this, [oldRecord, newRecord]);
        }));

        unpatch.push(patcher.after("createMessageRecord", MessageRecordUtils, ([message]: any[], record: any) => {
            if (record) record.__ml_deleted = Boolean(message?.__ml_deleted);
        }));
    }

    if (MessageRecord) {
        unpatch.push(patcher.after("default", MessageRecord, ([props]: any[], record: any) => {
            if (record) record.__ml_deleted = Boolean(props?.__ml_deleted);
        }));
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Что логировать">
                <SwitchRow setting="logDeleted" fallback={true} label="Удалённые сообщения" icon="TrashIcon" />
                <SwitchRow setting="logEdited" fallback={true} label="Изменённые сообщения" icon="EditIcon" />
                <SwitchRow setting="showEdits" fallback={true} label="Показывать старый текст правки" subLabel="Добавляет зачёркнутый оригинал под новым текстом." icon="HistoryIcon" />
            </Section>
            <Section title="Фильтры">
                <SwitchRow setting="ignoreBots" fallback={false} label="Игнорировать ботов" icon="RobotIcon" />
                <SwitchRow setting="ignoreSelf" fallback={true} label="Игнорировать свои сообщения" icon="UserIcon" />
                <SwitchRow setting="timestamps" fallback={true} label="Показывать время удаления" icon="ClockIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.logDeleted === undefined) plugin.storage.logDeleted = true;
        if (plugin.storage.logEdited === undefined) plugin.storage.logEdited = true;
        if (plugin.storage.showEdits === undefined) plugin.storage.showEdits = true;
        if (plugin.storage.ignoreBots === undefined) plugin.storage.ignoreBots = false;
        if (plugin.storage.ignoreSelf === undefined) plugin.storage.ignoreSelf = true;
        if (plugin.storage.timestamps === undefined) plugin.storage.timestamps = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
        deleted.clear();
        edited.clear();
    },
    settings: Settings
};

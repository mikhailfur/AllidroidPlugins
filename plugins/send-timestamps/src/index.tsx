/*
 * SendTimestamps for Allidroid
 * Based on the Vencord plugin by V, Tyler and Grzesiek11.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, copy, getChatInput, safeFindByProps, safeStore, showSimpleActionSheet,
    hideActionSheet, toast, ChatButton, patchChatInput, SettingsPage, Section, SwitchRow
} from "@shared";

const SelectedChannelStore = safeStore("SelectedChannelStore");
const DraftStore = safeStore("DraftStore");
const messageModule = safeFindByProps("sendMessage", "receiveMessage");
let unpatch: (() => void)[] = [];

function parseTime(value: string) {
    const match = value.match(/^`(\d{1,2}):(\d{2})(?:\s?(AM|PM))?`$/i);
    if (!match) return value;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const suffix = match[3]?.toUpperCase();

    if (suffix === "PM" && hours < 12) hours += 12;
    if (suffix === "AM" && hours === 12) hours = 0;
    if (hours > 23 || minutes > 59) return value;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1);

    return `<t:${Math.round(date.getTime() / 1000)}:t>`;
}

function insert(text: string) {
    const input = getChatInput();
    const channelId = SelectedChannelStore?.getChannelId?.();

    if (input?.setText && channelId) {
        const draft = DraftStore?.getDraft?.(channelId, 0) ?? "";
        input.setText(channelId, `${draft}${text} `);
        return;
    }

    copy(text, "Таймстамп скопирован");
}

function openPicker() {
    const now = Math.floor(Date.now() / 1000);
    const plus = (minutes: number) => Math.floor(Date.now() / 1000) + minutes * 60;

    showSimpleActionSheet({
        key: "SendTimestamps",
        header: {
            title: "Вставить таймстамп",
            onClose: hideActionSheet
        },
        options: [
            { label: "Сейчас", onPress: () => { hideActionSheet(); insert(`<t:${now}:f>`); } },
            { label: "Через 5 минут", onPress: () => { hideActionSheet(); insert(`<t:${plus(5)}:t>`); } },
            { label: "Через 1 час", onPress: () => { hideActionSheet(); insert(`<t:${plus(60)}:t>`); } },
            { label: "Завтра в 9:00", onPress: () => {
                const date = new Date();
                date.setDate(date.getDate() + 1);
                date.setHours(9, 0, 0, 0);
                hideActionSheet();
                insert(`<t:${Math.round(date.getTime() / 1000)}:t>`);
            } },
            { label: "Только время", onPress: () => { hideActionSheet(); insert(`<t:${now}:t>`); } },
            { label: "Относительное (через 2 часа)", onPress: () => { hideActionSheet(); insert(`<t:${plus(120)}:R>`); } }
        ]
    });
}

function apply() {
    const button = <ChatButton icon="CalendarIcon" label="Вставить таймстамп" onPress={openPicker} />;
    unpatch.push(patchChatInput([
        "modules/chat_input/native/action_buttons/ChatInputActions.tsx",
        "modules/chat_input/native/action_buttons/ChatInputRightActions.tsx"
    ], button, "left"));

    if (messageModule?.sendMessage) {
        unpatch.push(patcher.before("sendMessage", messageModule, (args: any[]) => {
            if (plugin.storage.replaceMessageContents === false) return;
            const target = args[1];
            if (target && typeof target.content === "string") {
                target.content = target.content.replace(/`\d{1,2}:\d{2}(?:\s?(?:AM|PM))?`/gi, parseTime);
            }
        }));
    } else {
        toast("SendTimestamps: sendMessage not found", "WarningIcon");
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Таймстампы">
                <SwitchRow
                    setting="replaceMessageContents"
                    fallback={true}
                    label="Заменять `HH:MM` при отправке"
                    subLabel="Например, `17:30` превратится в локальный таймстамп Discord."
                    icon="CalendarIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.replaceMessageContents === undefined) plugin.storage.replaceMessageContents = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

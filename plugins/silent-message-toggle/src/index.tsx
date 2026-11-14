/*
 * SilentMessageToggle for Allidroid
 * Based on the Vencord plugin by Nuckyz and CatNoir.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, safeFindByProps, toast, ChatButton, patchChatInput,
    SettingsPage, Section, SwitchRow
} from "@shared";

const messageModule = safeFindByProps("sendMessage", "receiveMessage");
let unpatch: (() => void)[] = [];

function ToggleButton() {
    const [enabled, setEnabled] = React.useState(() => plugin.storage.toggleEnabled === true);

    return (
        <ChatButton
            icon={enabled ? "BellOffIcon" : "BellIcon"}
            label={enabled ? "Выключить тихое сообщение" : "Включить тихое сообщение"}
            active={enabled}
            onPress={() => {
                const next = !enabled;
                setEnabled(next);
                plugin.storage.toggleEnabled = next;
                toast(next ? "Тихое сообщение включено" : "Тихое сообщение выключено", next ? "BellOffIcon" : "BellIcon");
            }}
        />
    );
}

function apply() {
    unpatch.push(patchChatInput([
        "modules/chat_input/native/action_buttons/ChatInputActions.tsx",
        "modules/chat_input/native/action_buttons/ChatInputRightActions.tsx"
    ], <ToggleButton key="silent-message-toggle" />, "left"));

    if (messageModule?.sendMessage) {
        unpatch.push(patcher.before("sendMessage", messageModule, (args: any[]) => {
            if (!plugin.storage.toggleEnabled) return;
            const target = args[1];
            if (target && typeof target.content === "string" && !target.content.startsWith("@silent ")) {
                target.content = "@silent " + target.content;
            }
            if (plugin.storage.autoDisable !== false) {
                plugin.storage.toggleEnabled = false;
            }
        }));
    } else {
        toast("SilentMessageToggle: sendMessage not found", "WarningIcon");
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Тихие сообщения">
                <SwitchRow
                    setting="autoDisable"
                    fallback={true}
                    label="Выключать после отправки"
                    subLabel="Следующее сообщение снова будет обычным."
                    icon="BellOffIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.autoDisable === undefined) plugin.storage.autoDisable = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

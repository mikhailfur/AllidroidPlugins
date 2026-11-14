/*
 * CharacterCounter for Allidroid
 * Based on the Vencord plugin by thororen and creations.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, safeStore, useStore, patchChatInput,
    SettingsPage, Section, SwitchRow, toast
} from "@shared";

const DraftStore = safeStore("DraftStore");
const SelectedChannelStore = safeStore("SelectedChannelStore");
const UserStore = safeStore("UserStore");
let unpatch: (() => void)[] = [];

function color(percent: number) {
    if (plugin.storage.colorEffects === false) return "#b5bac1";
    if (percent < 50) return "#b5bac1";
    if (percent < 75) return "#f0b232";
    if (percent < 90) return "#f0a232";
    return "#f23f43";
}

function Counter() {
    const channelId = useStore(SelectedChannelStore, () => SelectedChannelStore?.getChannelId?.());
    const text = useStore(DraftStore, () => {
        if (!channelId) return "";
        return DraftStore?.getDraft?.(channelId, 0) ?? "";
    }, [channelId]);

    const max = (UserStore?.getCurrentUser?.()?.premiumType === 2 ? 4000 : 2000);
    const length = typeof text === "string" ? text.length : 0;

    if (!length) return null;

    return (
        <RN.Text
            key="allidroid-char-counter"
            accessibilityLabel="Character counter"
            style={{ color: color((length / max) * 100), fontSize: 12, marginHorizontal: 6 }}
        >
            {length}/{max}
        </RN.Text>
    );
}

function apply() {
    unpatch.push(patchChatInput([
        "modules/chat_input/native/action_buttons/ChatInputActions.tsx",
        "modules/chat_input/native/action_buttons/ChatInputRightActions.tsx"
    ], <Counter key="allidroid-char-counter" />, "right"));

    if (!DraftStore) toast("CharacterCounter: DraftStore not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Счётчик">
                <SwitchRow
                    setting="colorEffects"
                    fallback={true}
                    label="Менять цвет ближе к лимиту"
                    subLabel="Жёлтый после 50%, оранжевый после 75%, красный после 90%."
                    icon="TextIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.colorEffects === undefined) plugin.storage.colorEffects = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings,
    CharacterCounter: Counter
};

/*
 * SilentTyping for Allidroid
 * Based on the Vencord plugin by V, rini and Im_Banana.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { patcher, plugin, safeFindByProps, SettingsPage, Section, SwitchRow, toast } from "@shared";

let unpatch: (() => void)[] = [];

function apply() {
    const typing = safeFindByProps("startTyping") ?? safeFindByProps("sendTyping") ?? safeFindByProps("stopTyping");
    if (!typing) {
        toast("SilentTyping: typing module not found", "WarningIcon");
        return;
    }

    for (const key of ["startTyping", "sendTyping", "stopTyping"]) {
        if (typeof typing[key] !== "function") continue;
        unpatch.push(patcher.instead(key, typing, function (args: any[], original: any) {
            if (plugin.storage.enabled === false) return original.apply(this, args);
            return undefined;
        }));
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="SilentTyping">
                <SwitchRow
                    setting="enabled"
                    fallback={true}
                    label="Не отправлять индикатор печати"
                    subLabel="Другие не увидят, что вы печатаете. Работает и в ЛС, и на серверах."
                    icon="KeyboardIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.enabled === undefined) plugin.storage.enabled = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

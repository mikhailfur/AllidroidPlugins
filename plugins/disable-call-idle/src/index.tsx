/*
 * DisableCallIdle for Allidroid
 * Based on the Vencord plugin and the mobile port by k1ng_op.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { patcher, plugin, safeFindByProps, SettingsPage, Section, SwitchRow, toast } from "@shared";

let unpatch: (() => void)[] = [];

function apply() {
    const manager = safeFindByProps("idleTimeout", "handleVoiceStateUpdates");
    if (!manager?.idleTimeout) {
        toast("DisableCallIdle: CallIdleManager not found", "WarningIcon");
        return;
    }

    try {
        manager.idleTimeout.stop?.();
        if (typeof manager.idleTimeout.start === "function") {
            unpatch.push(patcher.instead("start", manager.idleTimeout, function (args: any[], original: any) {
                if (plugin.storage.enabled === false) return original.apply(this, args);
                return undefined;
            }));
        }
    } catch (error) {
        toast("DisableCallIdle: patch failed", "WarningIcon");
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Голосовые звонки">
                <SwitchRow
                    setting="enabled"
                    fallback={true}
                    label="Не отключать из пустого звонка"
                    subLabel="Discord обычно выкидывает из ЛС-звонка через 3 минуты, если вы остались одни."
                    icon="PhoneCallIcon"
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

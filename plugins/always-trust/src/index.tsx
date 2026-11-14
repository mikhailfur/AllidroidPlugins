/*
 * AlwaysTrust for Allidroid
 * Based on the Vencord plugin by zt and Trwy.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { patcher, plugin, safeFindByProps, SettingsPage, Section, SwitchRow, toast } from "@shared";

let unpatch: (() => void)[] = [];

function apply() {
    const store = safeFindByProps("isTrustedDomain") ?? safeFindByProps("isTrustedProtocol");
    if (!store) {
        toast("AlwaysTrust: MaskedLinkStore not found", "WarningIcon");
        return;
    }

    if (typeof store.isTrustedDomain === "function") {
        unpatch.push(patcher.instead("isTrustedDomain", store, function (args: any[], original: any) {
            if (plugin.storage.domain === false) return original.apply(this, args);
            return true;
        }));
    }

    if (typeof store.isTrustedProtocol === "function") {
        unpatch.push(patcher.instead("isTrustedProtocol", store, function (args: any[], original: any) {
            if (plugin.storage.file === false) return original.apply(this, args);
            return true;
        }));
    }
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Ссылки">
                <SwitchRow
                    setting="domain"
                    fallback={true}
                    label="Доверять всем доменам"
                    subLabel="Убирает диалог «Вы уверены, что хотите открыть эту ссылку?»"
                    icon="LinkIcon"
                />
                <SwitchRow
                    setting="file"
                    fallback={true}
                    label="Доверять протоколам"
                    subLabel="Убирает предупреждение для нестандартных протоколов."
                    icon="FileIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.domain === undefined) plugin.storage.domain = true;
        if (plugin.storage.file === undefined) plugin.storage.file = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

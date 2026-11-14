/*
 * NoPendingCount for Allidroid
 * Based on the Vencord plugin by amia.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, safeStore, SettingsPage, Section, SwitchRow, toast
} from "@shared";

let unpatch: (() => void)[] = [];

function apply() {
    const relationship = safeStore("RelationshipStore");
    if (relationship?.getPendingCount) {
        unpatch.push(patcher.instead("getPendingCount", relationship, function (args: any[], original: any) {
            if (plugin.storage.friendRequests === false) return original.apply(this, args);
            return 0;
        }));
    }

    const requestStore = safeStore("MessageRequestStore");
    if (requestStore?.getMessageRequestsCount) {
        unpatch.push(patcher.instead("getMessageRequestsCount", requestStore, function (args: any[], original: any) {
            if (plugin.storage.messageRequests === false) return original.apply(this, args);
            return 0;
        }));
    }

    if (!unpatch.length) toast("NoPendingCount: stores not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Счётчики">
                <SwitchRow
                    setting="friendRequests"
                    fallback={true}
                    label="Скрыть заявки в друзья"
                    subLabel="Красный бейдж на вкладке друзей больше не появляется."
                    icon="FriendsIcon"
                />
                <SwitchRow
                    setting="messageRequests"
                    fallback={false}
                    label="Скрыть запросы сообщений"
                    subLabel="Может также скрыть вкладку Message Requests, если в ней нет спама."
                    icon="ChatIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.friendRequests === undefined) plugin.storage.friendRequests = true;
        if (plugin.storage.messageRequests === undefined) plugin.storage.messageRequests = false;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

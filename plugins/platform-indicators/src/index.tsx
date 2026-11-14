/*
 * PlatformIndicators for Allidroid
 * Based on the Vencord plugin by V and the Vendetta port by MSMA (Martinz64).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, findInReactTree, safeStore, safeFindByTypeName, safeFindByName, findByPath,
    getAssetID, SettingsPage, Section, SwitchRow, toast, patchComponent,
    applyWithRetry
} from "@shared";

const PresenceStore = safeStore("PresenceStore");
const SessionsStore = safeStore("SessionsStore");
const UserStore = safeStore("UserStore");

const ICONS: Record<string, string> = {
    desktop: "ic_monitor_24px",
    web: "ic_globe_24px",
    mobile: "ic_mobile_device",
    embedded: "ic_monitor_24px",
    vr: "ic_vr_headset_24px"
};

const COLORS: Record<string, string> = {
    online: "#23a55a",
    idle: "#f0b232",
    dnd: "#f23f43",
    offline: "#80848e",
    streaming: "#593695"
};

function statusesFor(userId: string) {
    if (!userId) return {};

    try {
        const me = UserStore?.getCurrentUser?.()?.id;
        if (userId === me && SessionsStore?.getSessions) {
            const sessions = SessionsStore.getSessions();
            const out: Record<string, string> = {};
            for (const session of Object.values(sessions ?? {}) as any[]) {
                const client = session?.clientInfo?.client;
                if (client && client !== "unknown") out[client] = session.status ?? "online";
            }
            return out;
        }
        return PresenceStore?.getClientStatus?.(userId)
            ?? PresenceStore?.getState?.()?.clientStatuses?.[userId]
            ?? {};
    } catch {
        return {};
    }
}

function StatusIcons({ userId, size = 13 }: { userId: string; size?: number }) {
    const [statuses, setStatuses] = React.useState<Record<string, string>>(() => statusesFor(userId));

    React.useEffect(() => {
        setStatuses(statusesFor(userId));
        const update = () => setStatuses(statusesFor(userId));
        const subscribe = (PresenceStore?.addChangeListener ?? PresenceStore?.subscribe)?.bind(PresenceStore);
        const unsubscribe = (PresenceStore?.removeChangeListener ?? PresenceStore?.unsubscribe)?.bind(PresenceStore);
        if (subscribe) subscribe(update);
        return () => unsubscribe?.(update);
    }, [userId]);

    const entries = Object.entries(statuses);
    if (!entries.length) return null;

    return (
        <RN.View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 4 }}>
            {entries.map(([platform, status]) => {
                const id = getAssetID(ICONS[platform] ?? "ic_globe_24px");
                const color = COLORS[status] ?? COLORS.online;
                if (id) {
                    return (
                        <RN.Image
                            key={platform}
                            source={id}
                            style={{ width: size, height: size, tintColor: color }}
                        />
                    );
                }
                return (
                    <RN.View
                        key={platform}
                        style={{ width: size - 3, height: size - 3, borderRadius: 99, backgroundColor: color }}
                    />
                );
            })}
        </RN.View>
    );
}

function appendIcons(tree: any, userId: string) {
    if (!userId) return tree;
    const array = findInReactTree(tree, (node: any) =>
        Array.isArray(node) && node.some((child: any) => child?.type?.name === "DisplayName" || child?.props?.user?.id)
    );

    if (Array.isArray(array)) {
        if (!array.some((child: any) => child?.key === "allidroid-platforms")) {
            array.push(<StatusIcons key="allidroid-platforms" userId={userId} />);
        }
    }
    return tree;
}

let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function apply() {
    if (plugin.storage.profile !== false) {
        const profile = safeFindByTypeName("UserProfilePrimaryInfo", false)
            ?? safeFindByName("UserProfilePrimaryInfo", false)
            ?? findByPath("modules/user_profile/native/UserProfilePrimaryInfo.tsx", false);
        if (profile) {
            unpatch.push(...patchComponent(profile, "after", ([props]: any[], tree: any) =>
                appendIcons(tree, props?.user?.id)
            ));
        }
    }

    if (plugin.storage.dmList !== false) {
        const item = safeFindByTypeName("MessagesItemChannelContent", false)
            ?? safeFindByName("MessagesItemChannelContent", false)
            ?? findByPath("modules/main_tabs_v2/native/tabs/messages/items/channel/MessagesItemChannelContent.tsx", false);
        if (item) {
            unpatch.push(...patchComponent(item, "after", ([props]: any[], tree: any) => {
                const channel = props?.channel;
                const userId = channel?.recipients?.[0] ?? channel?.rawRecipients?.[0]?.id;
                return appendIcons(tree, userId);
            }));
        }
    }

    if (plugin.storage.memberList !== false) {
        const row = safeFindByTypeName("UserRow", false)
            ?? safeFindByName("UserRow", false)
            ?? findByPath("modules/main_tabs_v2/native/shared_components/user_list/UserRow.tsx", false);
        if (row) {
            unpatch.push(...patchComponent(row, "after", ([props]: any[], tree: any) =>
                appendIcons(tree, props?.user?.id ?? props?.type?.user?.id)
            ));
        }
    }

    if (!unpatch.length) toast("PlatformIndicators: UI modules not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Где показывать">
                <SwitchRow setting="profile" fallback={true} label="В профилях" icon="UserIcon" />
                <SwitchRow setting="dmList" fallback={true} label="В списке ЛС" icon="ChatIcon" />
                <SwitchRow setting="memberList" fallback={true} label="В списке участников" icon="FriendsIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.profile === undefined) plugin.storage.profile = true;
        if (plugin.storage.dmList === undefined) plugin.storage.dmList = true;
        if (plugin.storage.memberList === undefined) plugin.storage.memberList = true;
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

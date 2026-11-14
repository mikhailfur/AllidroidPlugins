/*
 * ViewIcons for Allidroid
 * Based on the Vencord plugin by V, TheKodeToad, Nuckyz and nyx.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, findInReactTree, safeFindByTypeName, safeStore, safeFindByProps, findByPath,
    openImageModal, copy, SettingsPage, Section, SwitchRow, toast, table, patchComponent,
    applyWithRetry
} from "@shared";

const UserStore = safeStore("UserStore");
const UserProfileStore = safeStore("UserProfileStore");
const GuildMemberStore = safeStore("GuildMemberStore");
let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function urls(userId: string, guildId?: string) {
    const user = UserStore?.getUser?.(userId);
    const profile = UserProfileStore?.getUserProfile?.(userId);
    const member = guildId ? GuildMemberStore?.getMember?.(guildId, userId) : null;

    const avatar = member?.avatar
        ? user?.getAvatarURL?.(guildId, 1024, true)
        : user?.getAvatarURL?.(guildId, 1024, true);
    const banner = profile?.getBannerURL?.({ size: 1024, canAnimate: true });

    return { avatar, banner };
}

function appendRows(tree: any, userId: string, guildId?: string) {
    const { avatar, banner } = urls(userId, guildId);
    if (!avatar && !banner) return tree;

    const { TableRowGroup, TableRow } = table();
    if (!TableRowGroup || !TableRow) return tree;
    if (findInReactTree(tree, (node: any) => node?.key === "view-icons-section")) return tree;

    const array = findInReactTree(tree, (node: any) =>
        Array.isArray(node)
        && node.length >= 2
        && node.some((child: any) => child?.props?.children || child?.props?.source)
    );
    if (!Array.isArray(array)) return tree;

    array.push(
        <TableRowGroup key="view-icons-section" title="Аватар и баннер">
            {avatar ? (
                <TableRow
                    label="Открыть аватар"
                    arrow
                    onPress={() => openImageModal(avatar, 512, 512)}
                />
            ) : null}
            {banner ? (
                <TableRow
                    label="Открыть баннер"
                    arrow
                    onPress={() => openImageModal(banner, 1024, 512)}
                />
            ) : null}
            {avatar ? (
                <TableRow
                    label="Скопировать ссылку на аватар"
                    onPress={() => copy(avatar, "Ссылка на аватар скопирована")}
                />
            ) : null}
            {banner ? (
                <TableRow
                    label="Скопировать ссылку на баннер"
                    onPress={() => copy(banner, "Ссылка на баннер скопирована")}
                />
            ) : null}
        </TableRowGroup>
    );

    return tree;
}

function apply() {
    const component = safeFindByTypeName("UserProfileActionSheet", false)
        ?? findByPath("modules/user_profile/native/UserProfileActionSheet.tsx", false);
    if (!component) {
        toast("ViewIcons: UserProfileActionSheet not found", "WarningIcon");
        return;
    }

    unpatch.push(...patchComponent(component, "after", ([props]: any[], tree: any) => {
        const userId = props?.userId ?? props?.user?.id;
        if (!userId) return tree;
        return appendRows(tree, userId, props?.channel?.guild_id ?? props?.guildId);
    }));
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Профиль">
                <SwitchRow setting="enabled" fallback={true} label="Добавлять раздел с аватаром и баннером" icon="ImageIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.enabled === undefined) plugin.storage.enabled = true;
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

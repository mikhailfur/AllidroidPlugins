/*
 * BetterFolders for Allidroid
 * Based on the Vencord plugin by V and the Vendetta port by fres.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, FluxDispatcher, safeFindByProps, safeFindByPropsAll,
    safeStore, SettingsPage, Section, SwitchRow, toast, getAssetID
} from "@shared";

const UserSettingsProtoStore = safeStore("UserSettingsProtoStore") ?? safeFindByProps("getGuildFolders");
const ExpandedGuildFolderStore = safeStore("ExpandedGuildFolderStore");
let unpatch: (() => void)[] = [];

function updateFolderIcons() {
    try {
        const folders = UserSettingsProtoStore?.getGuildFolders?.() ?? [];
        for (const folder of folders) {
            if (!folder?.folderId) continue;
            if (ExpandedGuildFolderStore?.isFolderExpanded?.(folder.folderId)) continue;
            FluxDispatcher.dispatch({ type: "TOGGLE_GUILD_FOLDER_EXPAND", folderId: folder.folderId });
            FluxDispatcher.dispatch({ type: "TOGGLE_GUILD_FOLDER_EXPAND", folderId: folder.folderId });
        }
    } catch (error) {
        console.warn("[BetterFolders] updateFolderIcons", error);
    }
}

function patchAutoCollapse() {
    if (!FluxDispatcher?.subscribe) return;

    const handler = ({ folderId }: any) => {
        if (plugin.storage.autoCollapse === false) return;
        if (!folderId || !ExpandedGuildFolderStore?.isFolderExpanded?.(folderId)) return;

        const folders = UserSettingsProtoStore?.getGuildFolders?.() ?? [];
        for (const folder of folders) {
            if (!folder?.folderId || folder.folderId === folderId) continue;
            if (!ExpandedGuildFolderStore.isFolderExpanded(folder.folderId)) continue;
            FluxDispatcher.dispatch({ type: "TOGGLE_GUILD_FOLDER_EXPAND", folderId: folder.folderId });
        }
    };

    FluxDispatcher.subscribe("TOGGLE_GUILD_FOLDER_EXPAND", handler);
    unpatch.push(() => FluxDispatcher.unsubscribe?.("TOGGLE_GUILD_FOLDER_EXPAND", handler));
}

function patchIcons() {
    if (plugin.storage.hideIcons === false) return;

    const modules = safeFindByPropsAll("GuildContainer");
    const module = modules?.[modules.length - 1];
    if (!module?.GuildContainer) return;

    const folderIcon = getAssetID("img_guild_folder");
    if (!folderIcon) return;

    unpatch.push(patcher.after("GuildContainer", module, ([props]: any[], tree: any) => {
        if (!props?.children || props.expanded) return tree;

        const folder = props?.children?.type;
        if (!folder) return tree;

        try {
            const color = folder?.props?.folderColor
                ? `#${folder.props.folderColor.toString(16).padStart(6, "0")}`
                : "#5865f2";

            return (
                <RN.View style={{ overflow: "hidden", borderRadius: 16, justifyContent: "center", alignItems: "center", height: 48, width: 48 }}>
                    <RN.Image source={folderIcon} style={{ width: 48, height: 48, tintColor: color }} />
                </RN.View>
            );
        } catch {
            return tree;
        }
    }));
}

function apply() {
    if (!FluxDispatcher?.dispatch) {
        toast("BetterFolders: FluxDispatcher not found", "WarningIcon");
        return;
    }
    patchAutoCollapse();
    patchIcons();
    updateFolderIcons();
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Папки серверов">
                <SwitchRow
                    setting="autoCollapse"
                    fallback={false}
                    label="Автозакрытие других папок"
                    subLabel="При открытии папки все остальные закрываются."
                    icon="FolderIcon"
                />
                <SwitchRow
                    setting="hideIcons"
                    fallback={false}
                    label="Скрывать иконки серверов"
                    subLabel="У свёрнутой папки показывается только значок папки."
                    icon="ImageIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.autoCollapse === undefined) plugin.storage.autoCollapse = false;
        if (plugin.storage.hideIcons === undefined) plugin.storage.hideIcons = false;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
        setTimeout(updateFolderIcons, 100);
    },
    settings: Settings
};

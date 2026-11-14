/*
 * MoveAllVoice for Allidroid
 * Copyright (c) 2026 mikhailfur and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Mobile port of the Vencord plugin: long-press a voice channel, pick a target
 * channel, and every member of the source channel is moved there.
 */

const { patcher, metro, ui, plugin, utils } = vendetta;

const React = metro.common.React;
const RN = metro.common.ReactNative;
const logger = vendetta.logger ?? console;

const { findByName, findByProps, findByStoreName } = metro;
const { showToast } = ui.toasts;
const { showConfirmationAlert } = ui.alerts;
const { getAssetIDByName } = ui.assets;

const ChannelLongPressActionSheet = findByName("ChannelLongPressActionSheet", false);
const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const HTTP = findByProps("getAPIBaseURL", "patch");
const { showSimpleActionSheet } = findByProps("showSimpleActionSheet") ?? {};
const actionSheetModule = findByProps("ActionSheetRow");
const tableRowGroupModule = findByProps("TableRowGroup");
const tableSwitchRowModule = findByProps("TableSwitchRow");
const ActionSheetRow = actionSheetModule?.ActionSheetRow;
const TableRowGroup = tableRowGroupModule?.TableRowGroup;
const TableSwitchRow = tableSwitchRowModule?.TableSwitchRow;

function store(name: string) {
    try {
        return findByStoreName(name);
    } catch {
        return null;
    }
}

const VoiceStateStore = store("VoiceStateStore");
const GuildChannelStore = store("GuildChannelStore");
const PermissionStore = store("PermissionStore");
const UserStore = store("UserStore");

const DEFAULT_SETTINGS = {
    confirm: false,
    includeBots: true,
    includeSelf: true,
    showCounts: true
};

type SettingKey = keyof typeof DEFAULT_SETTINGS;

// Fallback values, in case Discord's Permissions module is not where we expect it.
const PERMISSIONS = {
    VIEW_CHANNEL: 1n << 10n,
    CONNECT: 1n << 20n,
    MOVE_MEMBERS: 1n << 24n,
    ...(metro.common.constants?.Permissions ?? {})
};

const GUILD_VOICE = 2;
const GUILD_STAGE_VOICE = 13;

let moveInProgress = false;
let active = false;
let outerUnpatch: (() => void) | null = null;
let innerUnpatch: (() => void) | null = null;

function getSetting(key: SettingKey): boolean {
    const value = plugin.storage[key];
    return value === undefined ? DEFAULT_SETTINGS[key] : Boolean(value);
}

function setSetting(key: SettingKey, value: boolean) {
    plugin.storage[key] = value;
}

function icon(name: string): number | undefined {
    try {
        return getAssetIDByName(name);
    } catch {
        return undefined;
    }
}

function toast(text: string, asset?: number) {
    showToast(text, asset);
}

function isVoiceChannel(channel: any): boolean {
    return channel?.type === GUILD_VOICE || channel?.type === GUILD_STAGE_VOICE;
}

function guildIdOf(channel: any): string | null {
    return channel?.guild_id ?? channel?.guildId ?? channel?.getGuildId?.() ?? null;
}

function can(permission: bigint, channel: any): boolean {
    try {
        return Boolean(PermissionStore?.can?.(permission, channel));
    } catch {
        return false;
    }
}

function getMembers(channel: any): string[] {
    if (!VoiceStateStore) return [];

    const states = VoiceStateStore.getVoiceStatesForChannel(channel.id) ?? {};
    const myId = UserStore?.getCurrentUser?.()?.id;
    const includeBots = getSetting("includeBots");
    const includeSelf = getSetting("includeSelf");

    return Object.keys(states).filter(userId => {
        if (!includeSelf && userId === myId) return false;
        if (!includeBots && UserStore?.getUser?.(userId)?.bot) return false;
        return true;
    });
}

function countInChannel(channelId: string): number {
    if (!VoiceStateStore) return 0;
    return Object.keys(VoiceStateStore.getVoiceStatesForChannel(channelId) ?? {}).length;
}

function getTargetChannels(source: any): any[] {
    const guildId = guildIdOf(source);
    if (!guildId || !GuildChannelStore) return [];

    const guildChannels = GuildChannelStore.getChannels(guildId);
    const vocal = guildChannels?.VOCAL ?? guildChannels?.["VOCAL"] ?? [];

    return vocal
        .map((entry: any) => entry?.channel ?? entry)
        .filter((channel: any) =>
            channel
            && channel.id !== source.id
            && isVoiceChannel(channel)
            && can(PERMISSIONS.VIEW_CHANNEL, channel)
            && can(PERMISSIONS.CONNECT, channel)
        );
}

async function moveAll(source: any, target: any, userIds: string[]) {
    if (moveInProgress) return;
    moveInProgress = true;

    if (userIds.length > 5) {
        toast(`Перемещаю ${userIds.length} участников в «${target.name}»…`);
    }

    const guildId = guildIdOf(source);
    let moved = 0;
    const failed: string[] = [];

    for (const userId of userIds) {
        if (!active) break;

        try {
            // Discord has no bulk move endpoint. The client HTTP layer handles
            // rate limits and retries, so sequential requests are enough.
            await HTTP.patch({
                url: `/guilds/${guildId}/members/${userId}`,
                body: { channel_id: target.id },
                oldFormErrors: true,
                rejectWithError: true
            });
            moved++;
        } catch (error) {
            failed.push(userId);
            logger.error("[MoveAllVoice] Не удалось переместить", userId, error);
        }
    }

    moveInProgress = false;

    if (!active) return;

    toast(
        failed.length
            ? `Перемещено ${moved} из ${userIds.length}. Ошибок: ${failed.length} (скорее всего, нет прав на перемещение)`
            : `Готово: ${moved} чел. в «${target.name}»`,
        failed.length ? icon("WarningIcon") : icon("CheckmarkSmallIcon")
    );
}

function startMove(source: any, target: any) {
    if (moveInProgress) {
        toast("Перемещение уже выполняется");
        return;
    }

    const userIds = getMembers(source);
    if (!userIds.length) {
        toast("В канале никого нет", icon("WarningIcon"));
        return;
    }

    if (!getSetting("confirm")) {
        void moveAll(source, target, userIds);
        return;
    }

    showConfirmationAlert({
        title: "Перенести всех?",
        content: `Переместить ${userIds.length} участник(ов) из «${source.name}» в «${target.name}»?`,
        confirmText: "Перенести",
        cancelText: "Отмена",
        confirmColor: "red",
        onConfirm: () => void moveAll(source, target, userIds)
    });
}

function openTargetPicker(source: any) {
    const targets = getTargetChannels(source);
    if (!targets.length) {
        toast("Нет голосовых каналов, куда можно подключиться", icon("WarningIcon"));
        return;
    }

    const showCounts = getSetting("showCounts");

    showSimpleActionSheet({
        key: "moveallvoice-targets",
        header: {
            title: `Перенести всех из «${source.name}»`,
            onClose: () => LazyActionSheet?.hideActionSheet?.()
        },
        options: targets.map(target => ({
            label: showCounts ? `${target.name} (${countInChannel(target.id)})` : target.name,
            onPress: () => startMove(source, target)
        }))
    });
}

function addMoveRow(component: any, channel: any) {
    if (!ActionSheetRow) return;

    const group = utils.findInReactTree(
        component,
        (node: any) => Array.isArray(node) && node[0]?.type?.name === "ActionSheetRowGroup"
    );
    if (!group) return;

    const rowKey = "moveallvoice-row";
    if (group.some((node: any) => node?.key === rowKey)) return;

    const count = getMembers(channel).length;
    const source = icon("VoiceNormalIcon");
    const Icon = ActionSheetRow.Icon;

    group.unshift(
        <ActionSheetRow.Group key={rowKey}>
            <ActionSheetRow
                key="moveallvoice-row-item"
                label={`Перенести всех в… (${count})`}
                icon={source && Icon ? <Icon source={source} /> : undefined}
                onPress={() => openTargetPicker(channel)}
            />
        </ActionSheetRow.Group>
    );
}

function onLoad() {
    active = true;

    if (!ChannelLongPressActionSheet) {
        logger.error("[MoveAllVoice] ChannelLongPressActionSheet не найден");
        return;
    }

    if (!HTTP || !showSimpleActionSheet || !ActionSheetRow) {
        logger.error("[MoveAllVoice] Не найдены модули, нужные для работы плагина");
        return;
    }

    outerUnpatch = patcher.after("default", ChannelLongPressActionSheet, (_, ret: any) => {
        if (!active) return;

        const channel = ret?.props?.channel;
        if (!channel || !isVoiceChannel(channel) || !guildIdOf(channel)) return;
        if (!can(PERMISSIONS.MOVE_MEMBERS, channel)) return;
        if (!getMembers(channel).length) return;
        if (!getTargetChannels(channel).length) return;

        innerUnpatch?.();
        innerUnpatch = patcher.after("type", ret, (_, component: any) => {
            addMoveRow(component, channel);
            return component;
        });
    });
}

function onUnload() {
    active = false;
    moveInProgress = false;

    innerUnpatch?.();
    innerUnpatch = null;

    outerUnpatch?.();
    outerUnpatch = null;
}

function SettingSwitch({ setting, label }: { setting: SettingKey; label: string; }) {
    const [value, setValue] = React.useState(() => Boolean(getSetting(setting)));
    if (!TableSwitchRow) return null;

    return (
        <TableSwitchRow
            label={label}
            value={value}
            onValueChange={(next: boolean) => {
                setSetting(setting, next);
                setValue(next);
            }}
        />
    );
}

function Settings() {
    if (!TableRowGroup || !TableSwitchRow) {
        return (
            <RN.View style={{ padding: 24 }}>
                <RN.Text>Не удалось найти компоненты настроек Allidroid.</RN.Text>
            </RN.View>
        );
    }

    return (
        <RN.ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 12 }}
        >
            <TableRowGroup title="MoveAllVoice">
                <SettingSwitch
                    setting="confirm"
                    label="Спрашивать подтверждение перед перемещением"
                />
                <SettingSwitch
                    setting="includeBots"
                    label="Перемещать ботов вместе с людьми"
                />
                <SettingSwitch
                    setting="includeSelf"
                    label="Перемещать вас, если вы сидите в этом канале"
                />
                <SettingSwitch
                    setting="showCounts"
                    label="Показывать количество участников у каналов в списке"
                />
            </TableRowGroup>
        </RN.ScrollView>
    );
}

export default {
    onLoad,
    onUnload,
    settings: Settings
};

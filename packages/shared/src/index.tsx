/*
 * Shared runtime for Allidroid user plugins.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

declare const vendetta: any;

export const v: any = (globalThis as any).vendetta ?? vendetta;

export const patcher = v.patcher;
export const metro = v.metro;
export const ui = v.ui;
export const utils = v.utils;
export const plugin = v.plugin;
export const storage = v.plugin?.storage ?? {};
export const logger = v.logger ?? console;

export const React = metro.common.React;
export const RN = metro.common.ReactNative;
export const FluxDispatcher = metro.common.FluxDispatcher;
export const Constants = metro.common.constants ?? {};
export const clipboard = metro.common.clipboard;
export const navigation = metro.common.navigation;

export const {
    find,
    findByProps,
    findByPropsAll,
    findByName,
    findByNameAll,
    findByStoreName,
    findByTypeName,
    findByTypeNameAll
} = metro;

export const findInReactTree: (tree: any, filter: (node: any) => boolean) => any = utils.findInReactTree;

/* ------------------------------------------------------------------ */
/* Finders                                                             */
/* ------------------------------------------------------------------ */

export function safeFindByProps(...props: string[]): any {
    try {
        return findByProps(...props);
    } catch {
        return null;
    }
}

export function safeFindByPropsAll(...props: string[]): any[] {
    try {
        return findByPropsAll(...props) ?? [];
    } catch {
        return [];
    }
}

export function safeFindByName(name: string, defaultExport = true): any {
    try {
        return findByName(name, defaultExport);
    } catch {
        return null;
    }
}

export function safeFindByTypeName(name: string, defaultExport = true): any {
    try {
        return findByTypeName(name, defaultExport);
    } catch {
        return null;
    }
}

export function safeStore(name: string): any {
    try {
        return findByStoreName(name);
    } catch {
        return null;
    }
}

export function modulesAtPath(path: string): any[] {
    const modules = (metro as any).modules;
    if (!modules) return [];

    const found: any[] = [];

    for (const id in modules) {
        const filePath = modules[id]?.__filePath;
        if (typeof filePath !== "string") continue;
        if (filePath !== path && !filePath.endsWith("/" + path) && !filePath.endsWith(path)) continue;

        let exports = modules[id]?.publicModule?.exports ?? modules[id]?.exports;

        try {
            if (!exports || (typeof exports === "object" && Reflect.ownKeys(exports).length === 0)) {
                exports = (globalThis as any).__r?.(Number(id)) ?? exports;
            }
        } catch {
            // Module gets initialized on a later attempt.
        }

        if (exports) found.push(exports);
    }

    return found;
}

export function findByPath(path: string, defaultExport = false): any {
    for (const exports of modulesAtPath(path)) {
        if (!defaultExport) return exports;
        if (exports?.default) return exports.default;
        if (exports?.default?.default) return exports.default.default;
    }
    return null;
}

export function allByPath(path: string): any[] {
    return modulesAtPath(path);
}

export function applyWithRetry(
    apply: () => void,
    isDone: () => boolean,
    delays: number[] = [0, 700, 1800, 4000, 8000, 15000]
): () => void {
    let cancelled = false;
    let done = false;

    const run = () => {
        if (cancelled || done) return;
        if (isDone()) {
            done = true;
            return;
        }
        try {
            apply();
        } catch (error) {
            logger.warn("[AllidroidPlugins] delayed apply failed", error);
        }
        if (isDone()) done = true;
    };

    const timers = delays.map(delay => setTimeout(run, delay));

    return () => {
        cancelled = true;
        timers.forEach(timer => clearTimeout(timer));
    };
}

export function waitFor<T>(factory: () => T | null | undefined, tries = 20, delay = 750): Promise<T> {
    return new Promise((resolve, reject) => {
        let attempt = 0;
        const tick = () => {
            let value: T | null | undefined;
            try {
                value = factory();
            } catch {
                value = null;
            }
            if (value) return resolve(value);
            if (++attempt >= tries) return reject(new Error("waitFor timed out"));
            setTimeout(tick, delay);
        };
        tick();
    });
}

export function patchComponent(
    module: any,
    method: "before" | "after" | "instead",
    callback: (...args: any[]) => any
): (() => void)[] {
    const out: (() => void)[] = [];
    if (!module) return out;

    const add = (key: string, parent: any) => {
        try {
            const unpatch = (patcher as any)[method](key, parent, callback);
            if (typeof unpatch === "function") out.push(unpatch);
        } catch (error) {
            logger.warn("[AllidroidPlugins] component patch failed", key, error);
        }
    };

    const def = module.default ?? module;

    if (def && typeof def === "object" && typeof def.type === "function") {
        add("type", def);
    } else if (def && typeof def === "object" && def.type) {
        add("type", def);
    } else if (typeof def === "function") {
        if (def.prototype?.render) add("render", def.prototype);
        if (module.default) add("default", module);
    } else if (typeof module === "object" && typeof module.type === "function") {
        add("type", module);
    }

    return out;
}

export function patchChatInputPaths(paths: string[], method: "before" | "after" | "instead", callback: (...args: any[]) => any) {
    const out: (() => void)[] = [];
    for (const path of paths) {
        for (const mod of allByPath(path)) out.push(...patchComponent(mod, method, callback));
    }
    return out;
}

export function getAssetID(name: string): number | undefined {
    try {
        return ui.assets.getAssetIDByName(name);
    } catch {
        return undefined;
    }
}

/* ------------------------------------------------------------------ */
/* Small UI helpers                                                    */
/* ------------------------------------------------------------------ */

const recentToasts = new Map<string, number>();

export function toast(text: string, asset?: number | string) {
    try {
        const now = Date.now();
        if ((recentToasts.get(text) ?? 0) > now - 4000) return;
        recentToasts.set(text, now);
        const id = typeof asset === "string" ? getAssetID(asset) : asset;
        ui.toasts.showToast(text, id);
    } catch (error) {
        logger.warn("[AllidroidPlugins] toast failed", error);
    }
}

export function copy(text: string, message = "Copied to clipboard") {
    try {
        clipboard?.setString?.(text);
        toast(message, "ClipboardCheckIcon");
    } catch {
        toast("Could not copy", "WarningIcon");
    }
}

export function openURL(url: string) {
    try {
        const linking = RN?.Linking ?? metro.common.url;
        void linking.openURL(url);
    } catch (error) {
        logger.warn("[AllidroidPlugins] openURL failed", error);
    }
}

export function showConfirmation(options: any) {
    try {
        ui.alerts.showConfirmationAlert(options);
    } catch (error) {
        logger.warn("[AllidroidPlugins] confirmation failed", error);
    }
}

export function hideActionSheet() {
    try {
        safeFindByProps("openLazy", "hideActionSheet")?.hideActionSheet?.();
    } catch { }
}

export function showSimpleActionSheet(options: any) {
    const mod = safeFindByProps("showSimpleActionSheet");
    if (mod?.showSimpleActionSheet) {
        return mod.showSimpleActionSheet(options);
    }
    const fn = (metro.common as any).showSimpleActionSheet;
    return fn?.(options);
}

export function showActionSheet(component: any, props: any = {}) {
    const lazy = safeFindByProps("openLazy", "hideActionSheet");
    if (!lazy?.openLazy) return;
    lazy.openLazy(new Promise(resolve => resolve({ default: component })), "ActionSheet", props);
}

export function openImageModal(url: string, width = 1024, height?: number) {
    const media = safeFindByProps("openMediaModal");
    if (!media?.openMediaModal) {
        openURL(url);
        return;
    }

    RN.Image.getSize(
        url,
        (w: number, h: number) => {
            const { width: sw, height: sh } = RN.Dimensions.get("window");
            try {
                media.openMediaModal({
                    initialSources: [{ uri: url, sourceURI: url, width: w, height: h }],
                    initialIndex: 0,
                    originLayout: {
                        width: width,
                        height: height ?? width,
                        x: (sw - width) / 2,
                        y: (sh - width) / 2,
                        resizeMode: "fill"
                    }
                });
            } catch {
                openURL(url);
            }
        },
        () => openURL(url)
    );
}

/* ------------------------------------------------------------------ */
/* Settings UI                                                         */
/* ------------------------------------------------------------------ */

let tableCache: any;

export function table() {
    if (tableCache && tableCache.TableRow && tableCache.TableRowGroup && tableCache.TableSwitchRow) return tableCache;

    const owners = [
        safeFindByProps("TableRowGroup", "TableRow"),
        safeFindByProps("TableRowGroup"),
        safeFindByProps("TableRow")
    ].filter(Boolean);

    const owner = owners.find(mod => mod?.TableRow) ?? owners[0] ?? {};

    tableCache = {
        TableRow: owner.TableRow,
        TableRowGroup: owner.TableRowGroup,
        TableSwitchRow: owner.TableSwitchRow ?? safeFindByProps("TableSwitchRow")?.TableSwitchRow,
        TableRadioGroup: owner.TableRadioGroup ?? safeFindByProps("TableRadioGroup")?.TableRadioGroup,
        TableRadioRow: owner.TableRadioRow ?? safeFindByProps("TableRadioRow")?.TableRadioRow,
        Stack: owner.Stack ?? safeFindByProps("Stack")?.Stack,
        ScrollView: RN.ScrollView
    };

    return tableCache;
}

export function useSetting<T>(key: string, fallback: T): [T, (value: T) => void] {
    const [value, setValue] = React.useState<T>(() => {
        const stored = storage?.[key];
        return stored === undefined || stored === null ? fallback : stored;
    });

    const set = (next: T) => {
        storage[key] = next;
        setValue(next);
    };

    return [value, set];
}

export function SettingsPage({ title, children }: any) {
    const { Stack, ScrollView } = table();
    const content = Stack ? <Stack spacing={12}>{children}</Stack> : children;

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 12 }}>
            {content}
        </ScrollView>
    );
}

export function Section({ title, children }: any) {
    const { TableRowGroup } = table();
    if (!TableRowGroup) return <>{children}</>;
    return <TableRowGroup title={title}>{children}</TableRowGroup>;
}

export function SwitchRow({ setting, label, subLabel, icon, fallback = false }: any) {
    const { TableSwitchRow } = table();
    const [value, setValue] = useSetting<boolean>(setting, fallback);
    if (!TableSwitchRow) return null;

    return (
        <TableSwitchRow
            label={label}
            subLabel={subLabel}
            icon={icon ? <RowIcon name={icon} /> : undefined}
            value={value}
            onValueChange={setValue}
        />
    );
}

export function RowIcon({ name, variant }: { name: string; variant?: string }) {
    const { TableRow } = table();
    const id = getAssetID(name);
    if (!TableRow?.Icon || !id) return undefined;
    return <TableRow.Icon source={id} variant={variant} />;
}

export function ActionRow({ label, subLabel, icon, arrow, trailing, onPress, variant, disabled }: any) {
    const { TableRow } = table();
    if (!TableRow) return null;

    return (
        <TableRow
            label={label}
            subLabel={subLabel}
            icon={icon ? <RowIcon name={icon} variant={variant} /> : undefined}
            arrow={arrow}
            trailing={trailing}
            onPress={onPress}
            variant={variant}
            disabled={disabled}
        />
    );
}

export function RadioGroup({ title, setting, options, fallback }: any) {
    const { TableRadioGroup, TableRadioRow } = table();
    const [value, setValue] = useSetting<string>(setting, String(fallback ?? options[0]?.value));

    if (!TableRadioGroup || !TableRadioRow) return null;

    return (
        <TableRadioGroup title={title} defaultValue={value} onChange={setValue}>
            {options.map((option: any) => (
                <TableRadioRow
                    key={String(option.value)}
                    label={option.label}
                    subLabel={option.subLabel}
                    value={String(option.value)}
                />
            ))}
        </TableRadioGroup>
    );
}

export function TextRow({ label, setting, fallback, placeholder, keyboardType }: any) {
    const { TableRow } = table();
    const [value, setValue] = useSetting<string>(setting, fallback ?? "");
    const [text, setText] = React.useState(value);

    if (!TableRow) return null;

    return (
        <TableRow
            label={label}
            subLabel={
                <RN.TextInput
                    value={text}
                    placeholder={placeholder}
                    keyboardType={keyboardType}
                    onChangeText={setText}
                    onBlur={() => setValue(text)}
                    style={{ color: "#dbdee1", fontSize: 14 }}
                />
            }
        />
    );
}

export function SettingsFallback() {
    const { ScrollView } = RN;
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
            <RN.Text style={{ color: "#dbdee1" }}>
                Allidroid settings components were not found. Reopen this page after the client finishes loading.
            </RN.Text>
        </ScrollView>
    );
}

/* ------------------------------------------------------------------ */
/* Action sheets                                                       */
/* ------------------------------------------------------------------ */

export function actionSheetRow(label: string, onPress: () => void, icon?: string, destructive = false) {
    const mod = safeFindByProps("ActionSheetRow");
    const Row = mod?.ActionSheetRow;
    if (!Row) return null;

    return (
        <Row
            key={"allidroid-" + label}
            label={label}
            variant={destructive ? "destructive" : undefined}
            icon={icon ? <Row.Icon source={getAssetID(icon)} /> : undefined}
            onPress={onPress}
        />
    );
}

export function actionSheetGroup(children: any) {
    const mod = safeFindByProps("ActionSheetRow");
    const Row = mod?.ActionSheetRow;
    if (!Row?.Group) return children;
    return <Row.Group>{children}</Row.Group>;
}

export function findActionSheetGroup(tree: any): any {
    return findInReactTree(tree, (node: any) => {
        if (Array.isArray(node)) return node[0]?.type?.name === "ActionSheetRowGroup";
        return node?.type?.name === "ActionSheetRowGroup" && Array.isArray(node?.props?.children);
    });
}

export function appendActionSheetRow(tree: any, row: any): any {
    const group = findActionSheetGroup(tree);
    if (!group) return tree;
    if (Array.isArray(group)) {
        group.push(row);
    } else if (Array.isArray(group.props?.children)) {
        group.props.children.push(row);
    }
    return tree;
}

/* ------------------------------------------------------------------ */
/* Chat input                                                          */
/* ------------------------------------------------------------------ */

export function getChatInput() {
    const mod = safeFindByProps("getBestActiveInput");
    return mod?.getBestActiveInput?.();
}

export function insertIntoChatInput(tree: any, element: any, side: "left" | "right" = "left"): any {
    const row = findInReactTree(tree, (node: any) => {
        const children = node?.props?.children;
        if (!Array.isArray(children)) return false;
        return children.some((child: any) =>
            child?.props?.IconComponent
            || child?.props?.accessibilityLabel
            || child?.type?.name === "IconButton"
            || child?.type?.name === "Button"
        );
    });

    if (!row) return tree;

    const children = row.props.children;
    const exists = children.some((child: any) => child?.key === element?.key);
    if (!exists) {
        if (side === "left") children.push(element);
        else children.unshift(element);
    }
    return tree;
}

export function patchChatInput(paths: string[], element: any, side: "left" | "right" = "left") {
    let unpatch: (() => void)[] = [];
    let cancelled = false;
    const callback = (_args: any[], tree: any) => insertIntoChatInput(tree, element, side);

    const tryPatch = () => {
        if (cancelled || unpatch.length) return;
        for (const path of paths) {
            for (const mod of allByPath(path)) unpatch.push(...patchComponent(mod, "after", callback));
        }

        if (!unpatch.length) {
            for (const name of ["ChatInputActions", "ChatInputRightActions"]) {
                const mod = safeFindByName(name, false);
                if (mod) unpatch.push(...patchComponent(mod, "after", callback));
            }
        }
    };

    tryPatch();
    const timers = [700, 1800, 4000, 9000].map(delay => setTimeout(tryPatch, delay));

    return () => {
        cancelled = true;
        timers.forEach(timer => clearTimeout(timer));
        unpatch.forEach(fn => fn());
        unpatch = [];
    };
}

let chatButtonModule: any;

function getChatButtonModule() {
    if (chatButtonModule) return chatButtonModule;
    const found = findByPath("modules/chat_input/native/action_buttons/ChatInputActionButton.tsx", true)
        ?? safeFindByProps("ChatInputActionButton")?.ChatInputActionButton;
    if (found) chatButtonModule = found;
    return found ?? null;
}

export function ChatButton({ icon, onPress, label, active = false, tint }: any) {
    const mod = getChatButtonModule();

    const id = getAssetID(icon);
    const IconComponent = (props: any) => (
        <RN.Image
            {...props}
            source={id}
            style={[{ width: 22, height: 22, tintColor: tint ?? (active ? "#5865f2" : "#b5bac1") }, props?.style]}
        />
    );

    if (mod) {
        return (
            <mod
                key={"allidroid-btn-" + label}
                accessibilityLabel={label}
                accessibilityState={{ checked: active }}
                IconComponent={IconComponent}
                onPress={onPress}
            />
        );
    }

    return (
        <RN.Pressable
            key={"allidroid-btn-" + label}
            accessibilityLabel={label}
            onPress={onPress}
            style={{ padding: 8 }}
        >
            <RN.Image source={id} style={{ width: 22, height: 22, tintColor: active ? "#5865f2" : "#b5bac1" }} />
        </RN.Pressable>
    );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function useStore(store: any, selector: () => any, deps: any[] = []) {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

    React.useEffect(() => {
        if (!store?.addChangeListener) return;
        const listener = () => forceUpdate();
        store.addChangeListener(listener);
        return () => store.removeChangeListener?.(listener);
    }, deps);

    return selector();
}

export function useTimer(interval = 1000) {
    const [now, setNow] = React.useState(Date.now());
    React.useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), interval);
        return () => clearInterval(id);
    }, [interval]);
    return now;
}

export function formatDuration(seconds: number, human = true) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (human) {
        return [
            days ? `${days}d` : "",
            hours ? `${hours}h` : "",
            minutes ? `${minutes}m` : "",
            `${secs}s`
        ].filter(Boolean).join(" ");
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${days ? `${days}d ` : ""}${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

export function formatBytes(bytes: number, decimals = 1) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function stripTracking(url: string): string {
    try {
        const parsed = new URL(url);
        const remove = [
            /^utm_/i, /^fbclid$/i, /^gclid$/i, /^dclid$/i, /^igshid$/i, /^mc_cid$/i,
            /^mc_eid$/i, /^ref$/i, /^ref_src$/i, /^si$/i, /^spm$/i, /^yclid$/i,
            /^_openstat$/i, /^vero_conv$/i, /^vero_id$/i, /^wickedid$/i, /^oly_enc_id$/i,
            /^oly_anon_id$/i, /^rb_clickid$/i, /^s_cid$/i, /^ml_subscriber$/i,
            /^ml_subscriber_hash$/i, /^twclid$/i, /^ttclid$/i, /^epik$/i
        ];
        for (const key of [...parsed.searchParams.keys()]) {
            if (remove.some(re => re.test(key))) parsed.searchParams.delete(key);
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

export function cleanMessageContent(content: string): string {
    if (!/https?:\/\//i.test(content)) return content;
    return content.replace(/(https?:\/\/[^\s<]+[^<.,:;"'>)|\]\s])/g, match => stripTracking(match));
}

export function ErrorBoundary({ children }: any) {
    const Boundary = ui.components?.ErrorBoundary;
    if (Boundary) return <Boundary>{children}</Boundary>;
    return <>{children}</>;
}

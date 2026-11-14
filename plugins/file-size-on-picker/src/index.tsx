/*
 * FileSizeOnPicker for Allidroid
 * Based on the Vendetta port by MSMA (Martinz64).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, findInReactTree, safeFindByName,
    formatBytes, SettingsPage, Section, SwitchRow, toast, patchComponent
,
    applyWithRetry
} from "@shared";

let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;
const cache: Record<string, number> = {};

function FileManager() {
    const modules = RN.NativeModules ?? {};
    return modules.NativeFileModule ?? modules.RTNFileManager ?? modules.DCDFileManager;
}

function SizeTag({ url, style }: { url: string; style: any }) {
    const [size, setSize] = React.useState(cache[url] ? formatBytes(cache[url]) : "...");

    React.useEffect(() => {
        if (!url || cache[url]) return;
        const manager = FileManager();
        if (!manager?.getSize) return;

        manager.getSize(url)
            .then((bytes: number) => {
                cache[url] = bytes;
                setSize(formatBytes(bytes));
            })
            .catch(() => setSize(""));
    }, [url]);

    return <RN.Text style={style}>{size}</RN.Text>;
}

function apply() {
    const pressable = safeFindByName("Pressable", false);
    if (!pressable) {
        toast("FileSizeOnPicker: Pressable not found", "WarningIcon");
        return;
    }

    unpatch.push(...patchComponent(pressable, "before", (args: any[]) => {
        const props = args?.[0];
        if (!props || props.__fileSizePatched) return;
        if (!props?.children?.[0]?.props?.localImageSource) return;
        if (plugin.storage.enabled === false) return;

        props.__fileSizePatched = true;
        const original = props.children;
        const image = findInReactTree(original, (node: any) => node?.props?.localImageSource);
        if (!image) return;

        const url = image.props.localImageSource.uri;
        props.children = (
            <RN.View style={{ position: "relative" }}>
                {original}
                <RN.View style={{
                    position: "absolute",
                    top: 3,
                    left: 3,
                    backgroundColor: "#1e1f2280",
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    paddingVertical: 2
                }}>
                    <SizeTag url={url} style={{ color: "white", fontSize: 10, fontWeight: "700" }} />
                </RN.View>
            </RN.View>
        );
    }));
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Медиа-пикер">
                <SwitchRow setting="enabled" fallback={true} label="Показывать размер файла" icon="FileIcon" />
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

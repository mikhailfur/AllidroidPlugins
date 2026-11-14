/*
 * AnonymousFileNames for Allidroid
 * Based on the Vencord plugin and the Revenge mobile port by k1ng_op, siguma and Palm.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, safeFindByProps, SettingsPage, Section, SwitchRow, TextRow, toast
} from "@shared";

const DEFAULT_CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let unpatch: (() => void)[] = [];

function randomName(charset: string, length: number) {
    let bytes: Uint8Array;
    try {
        bytes = crypto.getRandomValues(new Uint8Array(length));
    } catch {
        bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    let out = "";
    for (let i = 0; i < length; i++) out += charset[bytes[i] % charset.length];
    return out;
}

function rename(file: any) {
    const target = file?.file ?? file;
    const name = target?.filename ?? target?.name;
    if (typeof name !== "string") return;

    const length = Math.max(1, Math.min(1024, Number(plugin.storage.length) || 10));
    const charset = typeof plugin.storage.charset === "string" && plugin.storage.charset.length
        ? plugin.storage.charset
        : DEFAULT_CHARSET;

    const dot = name.lastIndexOf(".");
    const ext = dot !== -1 ? name.slice(dot) : "";
    const next = randomName(charset, length) + ext;

    if (target.filename) target.filename = next;
    if (target.name) target.name = next;
}

function walk(value: any) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
        value.forEach(rename);
        return;
    }
    if (Array.isArray(value.items)) value.items.forEach(rename);
    if (Array.isArray(value.files)) value.files.forEach(rename);
    if (Array.isArray(value.uploads)) value.uploads.forEach(rename);
    if (value.file || value.filename || value.name) rename(value);
}

function apply() {
    const upload = safeFindByProps("uploadLocalFiles");
    if (upload?.uploadLocalFiles) {
        unpatch.push(patcher.before("uploadLocalFiles", upload, ([arg]: any[]) => {
            if (plugin.storage.enabled === false) return;
            walk(arg);
        }));
    }

    const cloud = safeFindByProps("CloudUpload");
    if (cloud?.CloudUpload) {
        unpatch.push(patcher.before("CloudUpload", cloud, ([arg]: any[]) => {
            if (plugin.storage.enabled === false) return;
            walk(arg);
        }));
    }

    if (!unpatch.length) toast("AnonymousFileNames: upload module not found", "WarningIcon");
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="Имена файлов">
                <SwitchRow
                    setting="enabled"
                    fallback={true}
                    label="Переименовывать файлы"
                    subLabel="Перед отправкой имя заменяется на случайную строку, расширение сохраняется."
                    icon="UnknownGameIcon"
                />
                <TextRow
                    label="Длина имени"
                    setting="length"
                    fallback="10"
                    placeholder="10"
                    keyboardType="numeric"
                />
                <TextRow
                    label="Символы"
                    setting="charset"
                    fallback={DEFAULT_CHARSET}
                    placeholder={DEFAULT_CHARSET}
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.enabled === undefined) plugin.storage.enabled = true;
        if (!plugin.storage.length) plugin.storage.length = 10;
        if (!plugin.storage.charset) plugin.storage.charset = DEFAULT_CHARSET;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

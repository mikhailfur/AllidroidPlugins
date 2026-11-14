/*
 * Dearrow for Allidroid
 * Based on the Vencord plugin by V.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, FluxDispatcher, safeFindByName, SettingsPage, Section, SwitchRow, toast
} from "@shared";

const RowManager = safeFindByName("RowManager");
const cache: Record<string, { title?: string; thumb?: string; at: number }> = {};
const fetching = new Set<string>();
let unpatch: (() => void)[] = [];

function videoId(embed: any) {
    const url = embed?.video?.url ?? embed?.url ?? "";
    const match = String(url).match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? null;
}

function applyEmbed(embed: any, message: any) {
    const id = videoId(embed);
    if (!id) return false;
    const cached = cache[id];
    if (!cached) {
        if (!fetching.has(id)) {
            fetching.add(id);
            fetch(`https://sponsor.ajay.app/api/branding?videoID=${id}`)
                .then(response => response.ok ? response.json() : null)
                .then(data => {
                    if (!data) return;
                    const title = data.titles?.[0]?.votes >= 0 ? data.titles[0].title : null;
                    const thumb = data.thumbnails?.[0]?.votes >= 0 && !data.thumbnails[0].original
                        ? `https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=${id}&time=${data.thumbnails[0].timestamp}`
                        : null;
                    if (!title && !thumb) return;
                    cache[id] = { title, thumb, at: Date.now() };
                    try {
                        FluxDispatcher?.dispatch?.({
                            type: "MESSAGE_UPDATE",
                            message: { ...message, __dearrowProcessed: false },
                            channelId: message?.channel_id ?? message?.channelId
                        });
                    } catch { }
                })
                .catch(() => { })
                .finally(() => fetching.delete(id));
        }
        return false;
    }

    let changed = false;
    if (cached.title && plugin.storage.titles !== false && embed.rawTitle !== cached.title) {
        embed.rawTitle = cached.title;
        changed = true;
    }
    if (cached.thumb && plugin.storage.thumbnails !== false && embed.thumbnail) {
        embed.thumbnail.proxyURL = cached.thumb;
        embed.thumbnail.url = cached.thumb;
        changed = true;
    }
    return changed;
}

function apply() {
    if (!RowManager?.prototype?.generate) {
        toast("Dearrow: RowManager not found", "WarningIcon");
        return;
    }

    unpatch.push(patcher.after("generate", RowManager.prototype, ([data]: any[], row: any) => {
        if (data?.rowType !== 1 || !row?.message?.embeds?.length) return row;
        if (data.message.__dearrowProcessed) return row;

        let changed = false;
        for (const embed of row.message.embeds) {
            if (embed?.provider?.name !== "YouTube" && !videoId(embed)) continue;
            changed = applyEmbed(embed, data.message) || changed;
        }

        if (changed) {
            data.message.__dearrowProcessed = true;
            try {
                FluxDispatcher?.dispatch?.({
                    type: "MESSAGE_UPDATE",
                    message: { ...data.message, __dearrowProcessed: true },
                    channelId: data.message.channel_id ?? data.message.channelId
                });
            } catch { }
        }

        return row;
    }));
}

function Settings() {
    return (
        <SettingsPage>
            <Section title="YouTube">
                <SwitchRow setting="titles" fallback={true} label="Заменять заголовки" icon="TextIcon" />
                <SwitchRow setting="thumbnails" fallback={true} label="Заменять превью" icon="ImageIcon" />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.titles === undefined) plugin.storage.titles = true;
        if (plugin.storage.thumbnails === undefined) plugin.storage.thumbnails = true;
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    },
    settings: Settings
};

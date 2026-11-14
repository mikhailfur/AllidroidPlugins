/*
 * BetterSearch for Allidroid
 * Based on the Vendetta port by fres.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, safeFindByName, safeFindByProps, toast
} from "@shared";

const Locale = safeFindByProps("Messages");
const Searching = safeFindByProps("SEARCH_PAGE_SIZE");
let unpatch: (() => void)[] = [];

function apply() {
    const results = safeFindByName("ConnectedSearchResults", false);
    if (!results?.default) {
        toast("BetterSearch: ConnectedSearchResults not found", "WarningIcon");
        return;
    }

    unpatch.push(patcher.after("default", results, (_args: any[], tree: any) => {
        const proto = tree?.type?.prototype;
        if (!proto?.render) return tree;

        try {
            unpatch.push(patcher.after("render", proto, (_renderArgs: any[], rendered: any) => {
                const child = rendered?.props?.children?.[1];
                if (!child?.type) return rendered;

                try {
                    unpatch.push(patcher.after("type", child, ([paging]: any[], typeTree: any) => {
                        const [page, setPage] = React.useState(
                            1 + Math.floor((paging?.offset ?? 0) / (paging?.pageLength ?? 1))
                        );
                        const inputRef = React.useRef<any>(null);
                        const endpoint = typeTree?.props?.children?.[1];
                        if (!endpoint || !paging) return typeTree;

                        const totalPages = 1 + Math.floor((paging.totalResults ?? 0) / (paging.pageLength ?? 1));
                        const suffix = String(endpoint.props.children ?? "").split("  |  ")[1] ?? "";
                        endpoint.props.children = `${page} / ${totalPages}  |  ${suffix}`;

                        typeTree.props.children[1] = [
                            <RN.TouchableOpacity
                                key="better-search-page"
                                onPress={() => inputRef.current?.focus?.()}
                                style={{ flex: 1, height: 18 }}
                            >
                                {endpoint}
                            </RN.TouchableOpacity>,
                            <RN.TextInput
                                key="better-search-input"
                                keyboardType="numeric"
                                style={{ position: "absolute", left: -9999 }}
                                ref={inputRef}
                                value={Number.isNaN(page) ? "" : String(page)}
                                onChangeText={(value: string) => setPage(parseInt(value, 10))}
                                onBlur={() => {
                                    const pageSize = Searching?.SEARCH_PAGE_SIZE ?? 25;
                                    const target = Math.min(Math.max(page || 1, 1), totalPages) * pageSize;
                                    if (target - pageSize === paging.offset) return;

                                    try {
                                        if (target > paging.offset) {
                                            Searching.SEARCH_PAGE_SIZE = target - paging.offset - pageSize;
                                            paging.searchNextPage?.();
                                        } else {
                                            Searching.SEARCH_PAGE_SIZE = paging.offset - target + pageSize;
                                            paging.searchPreviousPage?.();
                                        }
                                    } finally {
                                        Searching.SEARCH_PAGE_SIZE = pageSize;
                                    }
                                }}
                            />
                        ];

                        return typeTree;
                    }, false));
                } catch { }

                return rendered;
            }, true));
        } catch { }

        return tree;
    }));
}

export default {
    onLoad() {
        apply();
    },
    onUnload() {
        unpatch.forEach(fn => fn());
        unpatch = [];
    }
};

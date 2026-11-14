/*
 * ReviewDB for Allidroid
 * Based on the Vencord plugin by V and the Vendetta port by janisslsm.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
    patcher, plugin, React, RN, copy, findInReactTree, safeFindByName, safeFindByProps,
    safeFindByTypeName, safeStore, toast, SettingsPage, Section, SwitchRow, ActionRow, findByPath,
    table, patchComponent,
    applyWithRetry
} from "@shared";

const API_URL = "https://manti.vendicated.dev/api/reviewdb";
const CLIENT_ID = "915703782174752809";
const UserStore = safeStore("UserStore");
const OAuth2AuthorizeModal = safeFindByName("OAuth2AuthorizeModal");
const modal = safeFindByProps("pushModal", "popModal");

type Review = {
    id: number;
    sender: {
        discordID: string;
        username: string;
        profilePhoto: string;
        badges?: { name: string; icon: string }[];
    };
    star: number;
    comment: string;
    type: number;
    timestamp: number;
};

async function api(path: string, options: any = {}) {
    const response = await fetch(API_URL + path, {
        ...options,
        headers: {
            "content-type": "application/json",
            accept: "application/json",
            ...(options.headers ?? {})
        }
    });
    const json = await response.json();
    if (json.success === false) throw new Error(json.message || "ReviewDB error");
    return json;
}

async function getReviews(userId: string): Promise<Review[]> {
    return (await api(`/users/${userId}/reviews`)).reviews ?? [];
}

async function addReview(userId: string, comment: string) {
    return api(`/users/${userId}/reviews`, {
        method: "PUT",
        body: JSON.stringify({ comment, token: plugin.storage.authToken })
    });
}

async function deleteReview(userId: string, id: number) {
    return api(`/users/${userId}/reviews`, {
        method: "DELETE",
        body: JSON.stringify({ reviewid: id, token: plugin.storage.authToken })
    });
}

async function reportReview(id: number) {
    return api("/reports", {
        method: "PUT",
        body: JSON.stringify({ reviewid: id, token: plugin.storage.authToken })
    });
}

function authenticate() {
    if (!modal?.pushModal || !OAuth2AuthorizeModal) {
        toast("ReviewDB: OAuth modal not found", "WarningIcon");
        return;
    }

    modal.pushModal({
        key: "reviewdb-auth",
        modal: {
            key: "reviewdb-auth",
            modal: OAuth2AuthorizeModal,
            animation: "slide-up",
            shouldPersistUnderModals: false,
            closable: true,
            props: {
                clientId: CLIENT_ID,
                redirectUri: API_URL + "/auth",
                scopes: ["identify"],
                responseType: "code",
                permissions: 0n,
                cancelCompletesFlow: false,
                callback: async ({ location }: any) => {
                    try {
                        const url = new URL(location);
                        url.searchParams.append("returnType", "json");
                        url.searchParams.append("clientMod", "vendetta");
                        const response = await fetch(url.toString(), { headers: { accept: "application/json" } });
                        const json = await response.json();
                        if (!json.success) throw new Error(json.message || "Authorization failed");
                        plugin.storage.authToken = json.token;
                        toast("ReviewDB: авторизация успешна", "CheckmarkSmallIcon");
                        modal.popModal?.("reviewdb-auth");
                    } catch (error: any) {
                        toast(error?.message ?? "ReviewDB: авторизация не удалась", "WarningIcon");
                    }
                },
                dismissOAuthModal: () => modal.popModal?.("reviewdb-auth")
            }
        }
    });
}

function stars(count: number) {
    const value = Math.max(0, Math.min(5, count));
    return "★".repeat(value) + "☆".repeat(5 - value);
}

function ReviewRow({ review, userId, onChanged }: any) {
    const { TableRowGroup, TableRow } = table();
    if (!TableRowGroup || !TableRow) return null;

    return (
        <TableRowGroup>
            <TableRow
                label={`${review.sender?.username ?? "Unknown"}  ${stars(review.star)}`}
                subLabel={review.comment}
                icon={review.sender?.profilePhoto ? (
                    <RN.Image source={{ uri: review.sender.profilePhoto }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                ) : undefined}
                onLongPress={() => {
                    if (!plugin.storage.authToken) {
                        copy(review.comment, "Отзыв скопирован");
                        return;
                    }
                    const options: any[] = [
                        { label: "Скопировать текст", onPress: () => copy(review.comment, "Отзыв скопирован") }
                    ];
                    if (review.type !== 3) {
                        options.push({
                            label: "Удалить отзыв",
                            isDestructive: true,
                            onPress: async () => {
                                try {
                                    await deleteReview(userId, review.id);
                                    toast("Отзыв удалён", "CheckmarkSmallIcon");
                                    onChanged?.();
                                } catch (error: any) {
                                    toast(error.message, "WarningIcon");
                                }
                            }
                        });
                        options.push({
                            label: "Пожаловаться",
                            isDestructive: true,
                            onPress: async () => {
                                try {
                                    await reportReview(review.id);
                                    toast("Жалоба отправлена", "CheckmarkSmallIcon");
                                } catch (error: any) {
                                    toast(error.message, "WarningIcon");
                                }
                            }
                        });
                    }
                    safeFindByProps("showSimpleActionSheet")?.showSimpleActionSheet?.({
                        key: "ReviewDBActions",
                        header: { title: "Отзыв" },
                        options
                    });
                }}
            />
        </TableRowGroup>
    );
}

function ReviewSection({ userId }: { userId: string }) {
    const { TableRowGroup, TableRow } = table();
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [text, setText] = React.useState("");
    const [loading, setLoading] = React.useState(true);

    const load = React.useCallback(() => {
        setLoading(true);
        getReviews(userId)
            .then(setReviews)
            .catch((error: any) => toast(error.message, "WarningIcon"))
            .finally(() => setLoading(false));
    }, [userId]);

    React.useEffect(load, [userId]);

    if (!TableRowGroup || !TableRow) return null;

    const myId = UserStore?.getCurrentUser?.()?.id;
    const mine = reviews.some(review => review.sender?.discordID === myId);

    return (
        <RN.View style={{ marginTop: 12 }}>
            <TableRowGroup title={`Отзывы ReviewDB${loading ? " · загрузка…" : ""}`}>
                {plugin.storage.showWarning !== false ? (
                    <TableRow
                        label="Будьте уважительны"
                        subLabel="Отзывы видны другим пользователям. Не пишите личные данные и оскорбления."
                        disabled
                    />
                ) : null}

                {reviews.length ? reviews.map(review => (
                    <ReviewRow key={review.id} review={review} userId={userId} onChanged={load} />
                )) : (
                    <TableRow label="Пока нет отзывов" disabled />
                )}

                {plugin.storage.authToken ? (
                    <TableRow
                        label={mine ? "Изменить свой отзыв" : "Добавить отзыв"}
                        subLabel={
                            <RN.View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                                <RN.TextInput
                                    value={text}
                                    onChangeText={setText}
                                    placeholder="Ваш отзыв"
                                    placeholderTextColor="#80848e"
                                    multiline
                                    style={{ flex: 1, color: "#dbdee1", minHeight: 36 }}
                                />
                                <RN.Pressable
                                    disabled={!text.trim()}
                                    onPress={async () => {
                                        try {
                                            const response = await addReview(userId, text.trim());
                                            toast(response.message ?? "Отзыв сохранён", "CheckmarkSmallIcon");
                                            setText("");
                                            load();
                                        } catch (error: any) {
                                            toast(error.message, "WarningIcon");
                                        }
                                    }}
                                >
                                    <RN.Text style={{ color: "#5865f2", fontWeight: "700" }}>Отправить</RN.Text>
                                </RN.Pressable>
                            </RN.View>
                        }
                    />
                ) : (
                    <TableRow label="Авторизоваться в ReviewDB" arrow onPress={authenticate} />
                )}
            </TableRowGroup>
        </RN.View>
    );
}

function appendToProfile(tree: any, userId: string) {
    const sections = findInReactTree(tree, (node: any) =>
        node?.type?.displayName === "View"
        && Array.isArray(node?.props?.children)
        && node.props.children.some((child: any) =>
            child?.type?.name === "UserProfileBio" || child?.type?.name === "UserProfileAboutMeCard"
        )
    )?.props?.children;

    if (Array.isArray(sections) && !sections.some((child: any) => child?.key === "reviewdb-section")) {
        sections.push(<ReviewSection key="reviewdb-section" userId={userId} />);
    }
    return tree;
}

let unpatch: (() => void)[] = [];
let retryCancel: (() => void) | null = null;

function patchProfile(name: string) {
    const paths: Record<string, string> = {
        UserProfileContent: "modules/user_profile/native/UserProfileContent.tsx",
        SimplifiedUserProfileContent: "modules/user_profile/native/SimplifiedUserProfileContent.tsx"
    };
    const component = safeFindByTypeName(name, false)
        ?? safeFindByName(name, false)
        ?? (paths[name] ? findByPath(paths[name], false) : null);
    if (!component) return;

    unpatch.push(...patchComponent(component, "after", ([props]: any[], tree: any) => {
        const userId = props?.userId ?? props?.user?.id ?? props?.displayProfile?.userId;
        return userId ? appendToProfile(tree, userId) : tree;
    }));
}

function apply() {
    for (const name of ["UserProfile", "UserProfileContent", "SimplifiedUserProfileContent"]) {
        try { patchProfile(name); } catch { }
    }
    if (!unpatch.length) toast("ReviewDB: profile module not found", "WarningIcon");
}

function Settings() {
    const authenticated = Boolean(plugin.storage.authToken);

    return (
        <SettingsPage>
            <Section title="Аккаунт ReviewDB">
                <ActionRow
                    label={authenticated ? "Вы авторизованы" : "Авторизоваться через Discord"}
                    subLabel={authenticated ? "Можно добавлять и удалять свои отзывы." : "OAuth-запрос только на identify."}
                    icon="KeyIcon"
                    arrow={!authenticated}
                    onPress={authenticated ? undefined : authenticate}
                />
                <ActionRow
                    label="Выйти"
                    subLabel="Токен удаляется с этого устройства."
                    icon="LogOutIcon"
                    variant={authenticated ? "danger" : undefined}
                    disabled={!authenticated}
                    onPress={() => {
                        plugin.storage.authToken = "";
                        toast("ReviewDB: выход выполнен", "CheckmarkSmallIcon");
                    }}
                />
            </Section>
            <Section title="Отображение">
                <SwitchRow
                    setting="showWarning"
                    fallback={true}
                    label="Показывать предупреждение"
                    subLabel="Напоминание быть вежливым в начале списка отзывов."
                    icon="WarningIcon"
                />
            </Section>
        </SettingsPage>
    );
}

export default {
    onLoad() {
        if (plugin.storage.authToken === undefined) plugin.storage.authToken = "";
        if (plugin.storage.showWarning === undefined) plugin.storage.showWarning = true;
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

# Анализ плагинов Vencord → Allidroid

Снимок Vencord: `d07030c096` от 2026-11-11T03:27:05Z · 168 плагинов.

Это полный разбор списка `src/plugins` Vencord. Статусы:

| Статус | Кол-во |
| --- | ---: |
| ✅ Портирован | 26 |
| 🧪 Beta | 1 |
| ⚪ Уже в Allidroid | 6 |
| 🛠 Запланирован | 9 |
| ⛔ Не портируется | 29 |
| 📋 Бэклог | 97 |

- **Портирован / Beta / Бонус** — код лежит в этом репозитории и ставится как user plugin.
- **Уже в Allidroid** — функция есть в мобильном клиенте, дублировать её плагином не нужно.
- **Запланирован** — технически возможен, но требует отдельного мобильного patch-а и тестов.
- **Не портируется** — опирается на десктопный DOM, CSS, локальный RPC или API, которых нет на мобильном.
- **Бэклог** — не входит в топ-30; порт возможен, но приоритет ниже.

## Полная таблица

| Плагин | Статус | Почему | Установка |
| --- | --- | --- | --- |
| alwaysTrust | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/always-trust/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/always-trust/) |
| anonymiseFileNames | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/anonymous-file-names/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/anonymous-file-names/) |
| ★ betterFolders | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/better-folders/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/better-folders/) |
| ★ betterSearch | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/better-search/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/better-search/) |
| ★ characterCounter | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/character-counter/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/character-counter/) |
| ★ clearURLs | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/clear-urls/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/clear-urls/) |
| ★ copyEmojiMarkdown | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/copy-emoji-markdown/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/copy-emoji-markdown/) |
| disableCallIdle | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/disable-call-idle/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/disable-call-idle/) |
| ★ expressionManager | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/expression-cloner/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/expression-cloner/) |
| ★ fakeNitro | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/fake-nitro/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/fake-nitro/) |
| ★ hideAttachments | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/hide-attachments/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/hide-attachments/) |
| ★ messageLogger | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/message-logger/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/message-logger/) |
| ★ noBlockedMessages | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/no-blocked-messages/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/no-blocked-messages/) |
| noPendingCount | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/no-pending-count/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/no-pending-count/) |
| ★ noReplyMention | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/no-reply-mention/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/no-reply-mention/) |
| ★ pinDms | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/pin-dms/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/pin-dms/) |
| ★ platformIndicators | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/platform-indicators/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/platform-indicators/) |
| ★ readAllNotificationsButton | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/read-all-notifications/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/read-all-notifications/) |
| ★ reviewDB | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/reviewdb/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/reviewdb/) |
| ★ sendTimestamps | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/send-timestamps/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/send-timestamps/) |
| ★ showHiddenChannels | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/show-hidden-channels/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/show-hidden-channels/) |
| ★ showTimeoutDuration | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/show-timeout-duration/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/show-timeout-duration/) |
| ★ silentMessageToggle | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/silent-message-toggle/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/silent-message-toggle/) |
| ★ silentTyping | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/silent-typing/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/silent-typing/) |
| ★ usrbg | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/usrbg/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/usrbg/) |
| ★ viewIcons | ✅ Портирован | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/view-icons/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/view-icons/) |
| ★ dearrow | 🧪 Beta | Работает как user plugin, установка по ссылке. | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/dearrow/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/dearrow/) |
| ★ callTimer | ⚪ Уже в Allidroid | В мобильном Discord таймер звонка уже показывается в шапке голосового канала (OngoingCallTimer). Дублировать его не нужно. | — |
| ★ experiments | ⚪ Уже в Allidroid | В Allidroid уже есть раздел экспериментов. | — |
| ★ imageZoom | ⚪ Уже в Allidroid | Мобильный просмотрщик медиа уже умеет пинч-зум и полноэкранный просмотр. | — |
| ★ openInApp | ⚪ Уже в Allidroid | Функция уже есть в мобильном Discord / Allidroid. | — |
| ★ typingIndicator | ⚪ Уже в Allidroid | В мобильном клиенте индикатор печати уже есть в списке каналов и в шапке ЛС. Vencord добавляет его на десктоп, где такого нет. | — |
| ★ voiceMessages | ⚪ Уже в Allidroid | Функция уже есть в мобильном Discord / Allidroid. | — |
| ★ betterGifPicker | 🛠 Запланирован | Можно переключать провайдера и размер, но мобильный GIF-пикер сильно отличается. | — |
| ★ blurNsfw | 🛠 Запланирован | Можно блюрить медиа в NSFW-каналах через transformMessageAttachments. | — |
| ★ friendInvites | 🛠 Запланирован | API создания инвайтов простой, нужен UI в меню друзей. | — |
| ★ mentionAvatars | 🛠 Запланирован | Меншены парсятся нативным парсером Discord, а не JS. Нужен отдельный трюк с customEmoji-нодой. | — |
| ★ messageLinkEmbeds | 🛠 Запланирован | Нужен fetch связанных сообщений и кастомный рендер карточки. Нативный RowGenerator не поддерживает произвольные embeds из плагина. | — |
| ★ mutualGroupDMs | 🛠 Запланирован | Нужен API-запрос взаимных групп и вставка секции в профиль. | — |
| ★ relationshipNotifier | 🛠 Запланирован | Нужны Flux-события друзей и локальные уведомления. | — |
| ★ serverInfo | 🛠 Запланирован | Добавляется в контекстное меню сервера; на мобильном меню нативное. | — |
| ★ whoReacted | 🛠 Запланирован | Можно добавить аватары реакций в JSON строки, но нужен аккуратный patch под текущий формат реакций. | — |
| ★ arRPC.web | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ autoDndWhilePlaying.discordDesktop | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ betterSettings | ⛔ Не портируется | Плагин перестраивает DOM настроек десктопа; мобильные настройки нативные. | — |
| ★ consoleJanitor | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ consoleShortcuts | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ customRPC | ⛔ Не портируется | Плагин общается с локальным Discord RPC/IPC на ПК. В Android/iOS такого сокета нет. | — |
| ★ directFileDownload.desktop | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ f8break | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ fixSpotifyEmbeds.desktop | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ fixYoutubeEmbeds.desktop | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ noDeepLinks.web | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ noDevtoolsWarning | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ noF1 | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ noMaskedUrlPaste | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ noMosaic | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ noSystemBadge.discordDesktop | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ oneko | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ pictureInPicture | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ previewMessage | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ quickReply | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ shikiCodeblocks.desktop | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ spotifyControls | ⛔ Не портируется | На мобильном нет account panel и постоянного Spotify-плеера над ним. Панель Spotify есть внутри профиля, но это другой нативный UI. | — |
| ★ themeAttributes | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ vencordToolbox | ⛔ Не портируется | Это тулбар и быстрые настройки поверх десктопного интерфейса. На мобильном нет постоянной панели, куда его встроить. | — |
| ★ volumeBooster | ⛔ Не портируется | Опирается на десктопные API, DOM или локальный RPC. | — |
| ★ webContextMenus.web | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ webKeybinds.web | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ webScreenShareFixes.web | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ youtubeAdblock.desktop | ⛔ Не портируется | Десктопный вариант: DOM/CSS или API, которых нет в мобильном клиенте. | — |
| ★ accountPanelServerProfile | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ addAttachments | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ alwaysAnimate | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ alwaysExpandRoles | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ betterGifAltText | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ betterRoleContext | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ betterRoleDot | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ betterSessions | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ betterUploadButton | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ biggerStreamPreview | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ clientTheme | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ colorSighted | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ copyFileContents | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ copyUserURLs | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ crashHandler | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ customCommands | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ customIdle | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ decor | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ devCompanion.dev | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ dontRoundMyTimestamps | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ fakeProfileThemes | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ favEmojiFirst | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ fixCodeblockGap | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ fixImagesQuality | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ forceOwnerCrown | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ fullSearchContext | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ gameActivityToggle | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ gifPaste | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ gifProviderSwitcher | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ greetStickerPicker | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ ignoreActivities | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ iLoveSpam | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ imageFilename | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ imageLink | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ implicitRelationships | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ ircColors | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ jumpToTop | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ keepCurrentChannel | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ loadingQuotes | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ memberCount | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ messageClickActions | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ messageLatency | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ moreQuickReactions | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ musicRichPresence | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ mutedServersActivityBadge | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ newGuildSettings | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ noMiddleClickPaste | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ noOnboardingDelay | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ noProfileThemes | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ noServerEmojis | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ notificationVolume | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ noTypingAnimation | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ noUnblockToJump | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ onePingPerDM | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ overrideForumDefaults | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ pauseInvitesForever | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ permissionFreeWill | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ permissionsViewer | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ petpet | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ plainFolderIcon | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ quickMention | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ reactErrorDecoder | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ replaceGoogleSearch | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ replyTimestamp | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ revealAllSpoilers | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ reverseImageSearch | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ roleColorEverywhere | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ secretRingTone | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ serverListIndicators | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ showAllMessageButtons | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ showConnections | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ showHiddenThings | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ showMeYourName | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ sortFriendRequests | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ spotifyCrack | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ spotifyShareCommands | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ startupTimings | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ stickerPaste | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ streamerModeOnStream | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ superReactionTweaks | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ textReplace | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ translate | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ typingTweaks | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ unindent | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ unlockedAvatarZoom | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ unsuppressEmbeds | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ userMessagesPronouns | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ userVoiceShow | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ validReply | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ validUser | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ vcDoubleClick | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ vcNarrator | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ viewRaw | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ voiceDownload | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ webPWA.browser | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ webScreenShare.browser | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |
| ★ xsOverlay | 📋 Бэклог | Не входит в топ-30. Порт возможен после разбора мобильных модулей. | — |

> ★ — плагин из топ-30. Полная интерактивная карта: https://mikhailfur.github.io/AllidroidPlugins/
>
> PronounDB и MoveAllVoice не входят в список 168: PronounDB — community-порт с pronoundb.org, MoveAllVoice — бонус из отдельного репозитория.

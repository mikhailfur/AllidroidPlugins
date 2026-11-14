<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=180&color=5865F2&text=AllidroidPlugins&fontColor=ffffff&fontSize=46&fontAlignY=36&desc=30%20Vencord%20plugins%2C%20ported%20to%20Allidroid&descAlignY=58&descSize=16" alt="AllidroidPlugins" />
</p>

<p align="center">
  <a href="https://github.com/mikhailfur/AllidroidPlugins/stargazers"><img src="https://img.shields.io/github/stars/mikhailfur/AllidroidPlugins?style=for-the-badge&color=5865F2" alt="stars"></a>
  <a href="https://github.com/mikhailfur/AllidroidPlugins/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--or--later-2ea043?style=for-the-badge" alt="license"></a>
  <a href="https://mikhailfur.github.io/AllidroidPlugins/"><img src="https://img.shields.io/badge/roadmap-interactive-eb459e?style=for-the-badge" alt="roadmap"></a>
  <img src="https://img.shields.io/badge/plugins-30-5865F2?style=for-the-badge" alt="30 plugins">
</p>

<p align="center">
  <b>Порты плагинов Vencord для мобильного клиента Allidroid.</b><br>
  User plugins: ставятся по ссылке, без пересборки приложения. Обновляются по <code>manifest.json</code> + <code>hash</code>.
</p>

---

## ⚡ Быстрая установка

1. Открой в Allidroid **Plugins → Add a user plugin**.
2. Вставь ссылку на папку плагина. Например, MessageLogger:

```
https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/message-logger/
```

3. Включи плагин в списке. При следующем запуске Allidroid сам сравнит `hash` в `manifest.json` и скачает свежий `index.js`.

**Два зеркала на выбор:**

| Зеркало | Ссылка | Кэш |
| --- | --- | --- |
| raw GitHub | `https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/<id>/` | ~5 минут |
| jsDelivr | `https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/<id>/` | может кэшировать дольше |

Стабильная версия без автообновления: `https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@v1.0.0/plugins/<id>/`.

> [!TIP]
> Allidroid сам добавляет к ссылке `manifest.json` и `index.js`. Ссылка должна указывать на **папку**, а не на отдельный файл.

---

## 🗺️ Интерактивная Roadmap

**[Открыть Roadmap →](https://mikhailfur.github.io/AllidroidPlugins/)**

На странице можно фильтровать плагины по статусу и категории, искать по названию и копировать raw/jsDelivr-ссылку одним нажатием. Данные берутся из [`docs/roadmap.json`](docs/roadmap.json) и [`plugins.json`](plugins.json), которые пересобираются при каждом коммите.

<p align="center">
  <img src="https://img.shields.io/badge/%D0%BF%D0%BE%D1%80%D1%82%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%BE-24%2F30-2ea043?style=flat-square" alt="ported">
  <img src="https://img.shields.io/badge/%D0%B2%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BD%D0%BE%20%D0%B2%20Allidroid-3%2F30-8b949e?style=flat-square" alt="builtin">
  <img src="https://img.shields.io/badge/%D0%BD%D0%B5%20%D0%BF%D0%BE%D1%80%D1%82%D0%B8%D1%80%D1%83%D0%B5%D1%82%D1%81%D1%8F-3%2F30-da363c?style=flat-square" alt="not portable">
  <img src="https://img.shields.io/badge/%D0%B1%D0%BE%D0%BD%D1%83%D1%81-6-eb459e?style=flat-square" alt="bonus">
</p>

<details>
<summary><b>Как считался топ-30</b></summary>

Vencord не собирает телеметрию, поэтому «самые используемые» — это сводный рейтинг: плагины, которые включены по умолчанию, чаще всего упоминаются в гайдах и имеют самые популярные мобильные порты. Полная методология лежит в [`roadmap.json`](roadmap.json).

</details>

---

## 🏆 Топ-30 Vencord → Allidroid

Легенда: ✅ портирован · 🧪 beta · ⚪ уже есть в Allidroid · ⛔ не портируется · 🧩 бонус

| # | Плагин | Статус | Установка |
| ---: | --- | :---: | --- |
| 1 | **MessageLogger** — удалённые и изменённые сообщения | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/message-logger/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/message-logger/) |
| 2 | **FakeNitro** — эмодзи, размер, стрим, часть тем | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/fake-nitro/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/fake-nitro/) |
| 3 | **USRBG** — баннеры USRBG без Nitro | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/usrbg/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/usrbg/) |
| 4 | **BetterFolders** — автозакрытие папок, скрытие иконок | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/better-folders/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/better-folders/) |
| 5 | **ShowHiddenChannels** — метаданные скрытых каналов | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/show-hidden-channels/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/show-hidden-channels/) |
| 6 | **PlatformIndicators** — ПК/веб/мобильный/VR | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/platform-indicators/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/platform-indicators/) |
| 7 | **SilentTyping** — скрыть «печатает…» | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/silent-typing/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/silent-typing/) |
| 8 | **ReviewDB** — отзывы на профили + OAuth | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/reviewdb/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/reviewdb/) |
| 9 | **PronounDB** — местоимения в профиле и чате | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/pronoundb/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/pronoundb/) |
| 10 | **NoBlockedMessages** — скрыть блок/игнор и ответы | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/no-blocked-messages/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/no-blocked-messages/) |
| 11 | **ExpressionCloner** — клонировать эмодзи на сервер | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/expression-cloner/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/expression-cloner/) |
| 12 | **ViewIcons** — аватар/баннер в полном размере | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/view-icons/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/view-icons/) |
| 13 | **PinDMs** — закрепить ЛС вверху списка | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/pin-dms/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/pin-dms/) |
| 14 | **BetterSearch** — переход по страницам поиска | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/better-search/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/better-search/) |
| 15 | **NoReplyMention** — без пинга при ответе | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/no-reply-mention/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/no-reply-mention/) |
| 16 | **ClearURLs** — чистка utm/fbclid/трекеров | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/clear-urls/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/clear-urls/) |
| 17 | **Dearrow** — спокойные заголовки YouTube | 🧪 | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/dearrow/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/dearrow/) |
| 18 | **ShowTimeoutDuration** — остаток тайм-аута | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/show-timeout-duration/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/show-timeout-duration/) |
| 19 | **SendTimestamps** — кнопка и `HH:MM` | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/send-timestamps/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/send-timestamps/) |
| 20 | **SilentMessageToggle** — `@silent` в один тап | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/silent-message-toggle/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/silent-message-toggle/) |
| 21 | **ReadAllNotificationsButton** — прочитать все серверы | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/read-all-notifications/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/read-all-notifications/) |
| 22 | **CharacterCounter** — счётчик символов | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/character-counter/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/character-counter/) |
| 23 | **HideAttachments** — скрыть медиа сообщения | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/hide-attachments/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/hide-attachments/) |
| 24 | **CopyEmojiMarkdown** — `<:name:id>` в буфер | ✅ | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/copy-emoji-markdown/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/copy-emoji-markdown/) |
| 25 | **SpotifyControls** — плеер над account panel | ⛔ | — |
| 26 | **CustomRPC** — локальный Discord RPC | ⛔ | — |
| 27 | **VencordToolbox** — десктопный тулбар | ⛔ | — |
| 28 | **CallTimer** — таймер звонка | ⚪ | уже в Allidroid |
| 29 | **TypingIndicator** — печатает в списке каналов | ⚪ | уже в Allidroid |
| 30 | **ImageZoom** — зум картинок | ⚪ | уже в Allidroid |

---

## 🧩 Бонусные порты

Эти плагины не входят в топ-30, но уже работают и лежат в этом же репозитории.

| Плагин | Что делает | Установка |
| --- | --- | --- |
| **AnonymousFileNames** | Случайные имена файлов перед загрузкой | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/anonymous-file-names/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/anonymous-file-names/) |
| **DisableCallIdle** | Не выкидывает из пустого звонка | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/disable-call-idle/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/disable-call-idle/) |
| **AlwaysTrust** | Без предупреждения о недоверенном домене | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/always-trust/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/always-trust/) |
| **FileSizeOnPicker** | Размер файла в медиа-пикере | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/file-size-on-picker/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/file-size-on-picker/) |
| **NoPendingCount** | Скрыть счётчик заявок в друзья | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/no-pending-count/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/no-pending-count/) |
| **MoveAllVoice** | Перенести всех участников голосового канала | [raw](https://raw.githubusercontent.com/mikhailfur/AllidroidPlugins/main/plugins/move-all-voice/) · [jsDelivr](https://cdn.jsdelivr.net/gh/mikhailfur/AllidroidPlugins@main/plugins/move-all-voice/) |

---

## 🧪 Что не портируется и почему

<details>
<summary><b>SpotifyControls</b> — нет account panel</summary>

На десктопе плагин встраивает плеер над панелью аккаунта. На мобильном такой панели нет: Spotify-активность показывается внутри профиля, и это нативный UI, а не DOM-панель.
</details>

<details>
<summary><b>CustomRPC</b> — нет локального RPC/IPC</summary>

Плагин общается с Discord RPC через локальный сокет на ПК. Android/iOS-клиент такого сокета не предоставляет, поэтому подключиться к «rich presence» некуда.
</details>

<details>
<summary><b>VencordToolbox</b> — нет десктопного тулбара</summary>

Это плавающая панель с быстрыми настройками поверх десктопного интерфейса. На мобильном нет постоянного тулбара, куда её встроить без отдельного нативного экрана.
</details>

<details>
<summary><b>BetterSettings</b> — нативные настройки</summary>

Плагин перестраивает DOM настроек Discord на десктопе. В Allidroid настройки — нативные экраны, и такой подход неприменим.
</details>

---

## ⚙️ Как работает автообновление

- Каждый плагин — это папка `plugins/<id>/` с `manifest.json` и `index.js`.
- `scripts/build.mjs` собирает `src/index.tsx` в один бандл и пересчитывает `hash` (SHA-256) в `manifest.json`.
- Allidroid при запуске сравнивает `hash` и скачивает новый `index.js`, если он изменился. Пересобирать APK не нужно.
- GitHub Actions пересобирает все плагины на каждый пуш, проверяет, что `hash` и `plugins.json` актуальны, и обновляет [`plugins.json`](plugins.json) / [`docs/roadmap.json`](docs/roadmap.json).
- Отдельный workflow раз в сутки сверяет upstream Vencord и пишет отчёт в [`upstream.json`](upstream.json), чтобы было видно, какие оригинальные плагины изменились.

```bash
npm install
npm run build          # собрать все плагины + manifest hash + plugins.json
npm run build -- --only message-logger
git diff --exit-code  # проверить, что артефакты не устарели
```

## 📁 Структура

```
plugins/<id>/
  plugin.json          # метаданные: имя, авторы, upstream, статус, иконка
  src/index.tsx        # исходник порта
  manifest.json        # генерируется: polymanifest + hash
  index.js             # генерируется: готовый user plugin
packages/shared/       # общий runtime: finders, settings UI, action sheets
scripts/build.mjs      # сборка, хеши, plugins.json, docs/roadmap.json
docs/index.html        # интерактивная Roadmap (GitHub Pages)
roadmap.json           # источник данных Roadmap
```

## 🙏 Благодарности

Оригинальные плагины — команда [Vencord](https://github.com/Vendicated/Vencord) и авторы, указанные в `plugin.json` каждого плагина. Мобильные референсы — [Vendetta](https://github.com/vendetta-mod/Vendetta), [Revenge](https://github.com/revenge-mod), [Bunny](https://github.com/bunny-mod) и их сообщества. Отдельное спасибо авторам мобильных портов: Angel~, kasi, c10udburst, MSMA, fres, Palm, janisslsm, fierdetta, acquitelol, k1ng_op и другим.

## 📜 Лицензия

GPL-3.0-or-later. Если вы форкаете или переносите плагин, сохраняйте attribution и лицензию.

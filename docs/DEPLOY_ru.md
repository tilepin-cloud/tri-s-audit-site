# Хостинг и домен: инструкция владельцу

Сайт — статический, собирается из GitHub на Cloudflare. Ничего не администрируется на сервере.
Шаги A–C делаются один раз; D — когда домен tri-s-audit.uz будет готов к переносу.

## A. Репозитории на GitHub (организация `tilepin-cloud`)

1. Создать **публичный** репозиторий `tri-s-audit-site`, отправить туда эту папку (ветка `main`).
   ```
   git remote add origin git@github.com:tilepin-cloud/tri-s-audit-site.git
   git push -u origin main
   ```
2. Settings → Branches → защитить `main`: pull request обязателен, статус CI обязателен.
3. Settings → Code security → включить Dependabot alerts и security updates.
4. Создать **приватный** репозиторий `tri-s-audit-desk` для медиа-плана, досок и черновиков (структура — в плане, раздел 8). Agents и люди работают с ним через git; на сайт он не попадает.
5. Секреты репозитория `tri-s-audit-site` (Settings → Secrets → Actions), когда будут известны:
   `CF_DEPLOY_HOOK` — URL deploy hook из Cloudflare (шаг B6); `INDEXNOW_KEY` — ключ IndexNow (шаг D5).

## B. Cloudflare: проект Workers Builds (тот же аккаунт, что у Хаба)

1. Workers & Pages → Create → Import a repository → выбрать `tilepin-cloud/tri-s-audit-site`
   (приложение GitHub даёт доступ только к этому репозиторию; личный токен не создаётся).
2. Имя проекта: `tri-s-audit-site`. Production branch: `main`.
3. Build command: `npm run build`. Deploy command: `npx wrangler deploy`. Output: `dist` (файл `wrangler.jsonc` в репозитории уже указывает на него).
4. Variables (Build):
   - для production: `SITE_URL` = `https://tri-s-audit.uz` (ставить сразу, даже пока домен не подключён — тогда canonical и hreflang с первого дня целевые);
   - для preview (не-production ветки): `NOINDEX` = `1`.
   Пока домен не подключён, production-сборку тоже закрыть от индексации: временно добавить `NOINDEX=1` и в production, убрать на шаге D3.
5. Первый деплой → адрес `tri-s-audit-site.<account>.workers.dev`. Проверить: `/ru/`, `/en/`, `/uz/`, `/robots.txt`, `/llms.txt`, `/sitemap-index.xml`, `/ru/rss.xml`, страница поиска.
6. Settings → Builds → Deploy hooks → создать hook «scheduled-publish», URL положить в секрет `CF_DEPLOY_HOOK` (шаг A5). Он нужен, чтобы посты с будущей датой выходили в свой день.
7. Временный показ на личном домене (необязательно): Custom domains → добавить `site.tilep.in`. Он живёт с `NOINDEX=1`, в поиск не попадает.

## C. Проверки до переноса домена

- Lighthouse (мобильный) на `/ru/`, `/ru/services/audit/`, `/ru/blog/isa-240-revised/`: цель ≥ 95 по всем четырём метрикам.
- Rich Results Test / schema.org validator на главной (Organization), странице сотрудника (Person), статье (BlogPosting), услуге (Service, FAQPage).
- hreflang: на каждой странице теги взаимны, `x-default` → RU; проверить любым hreflang-чекером по адресу workers.dev.
- RSS-валидатор на `/ru/rss.xml`.
- Открыть сайт из Узбекистана в Chrome: если не открывается, отключить на зоне HTTP/3 и ECH, как для `tilep.in` (решение фирмы от 05.11.2026).

## D. Перенос домена tri-s-audit.uz

1. У регистратора .uz (cctld.uz, аккредитованный регистратор) убедиться, что домен продлён и управление доступно с корпоративной учётной записи; включить автопродление.
2. Cloudflare → Add a domain → `tri-s-audit.uz`; у регистратора сменить NS на выданные Cloudflare. Почтовые записи (MX, SPF, DKIM, DMARC) перенести без изменений, если почта на домене уже есть.
3. В проекте Workers: Custom domains → `tri-s-audit.uz` и `www.tri-s-audit.uz` (www → редирект на корень правилом Bulk Redirect или Redirect Rule, 301). Убрать `NOINDEX` из production-переменных, пересобрать.
4. Старый сайт на Beget: выгрузить список URL (из бэкапа или Яндекс.Вебмастера), заполнить `public/_redirects` строками `старый_путь  /ru/новый/  301`, закоммитить. Затем хостинг Beget отключить.
5. Google Search Console и Яндекс.Вебмастер: подтвердить домен (DNS TXT), отправить `https://tri-s-audit.uz/sitemap-index.xml`. Для IndexNow: сгенерировать ключ (32 hex-символа), сохранить файл `public/<ключ>.txt` с ключом внутри и секрет `INDEXNOW_KEY`.
6. Cloudflare → Web Analytics → включить для домена (без cookie); фрагмент кода не нужен, если включить через Workers settings → Observability.
7. Зона `tri-s-audit.uz`: Speed → HTTP/3 off; ECH off (через API, как для `tilep.in`), если провайдеры в Узбекистане режут соединение.
8. В `00_Methodology`: добавить строки в `DECISIONS.md` и `REG-RES-001` (публичный сайт, репозитории `tri-s-audit-site` и `tri-s-audit-desk`, Workers Builds) — ресурс без строки реестра не применяется.

## E. Что заполнить владельцу в контенте

- `src/config/site.ts`: официальные наименования на английском и узбекском (`[TBC]`), ссылки Telegram и LinkedIn.
- `src/content/team/*`: полные имена, фото (`photo:`), квалификация, LinkedIn; снять `reviewed: false`.
- Узбекские тексты (`reviewed: false`) — вычитка партнёром.
- `public/docs/` — первые PDF (описание системы качества, свидетельство реестра, политика конфиденциальности) и строки в `src/content/documents.yaml`.
- Шрифты для OG-картинок: положить `FiraSansCondensed-SemiBold.ttf` и `JetBrainsMono-Regular.ttf` в `src/og/fonts/`, чтобы карточки на Cloudflare совпадали с локальными.

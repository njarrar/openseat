# Alerts, bot checks and currency

## Channels

People can get alerts by email, Telegram or WhatsApp. The API offers a channel only when it is set up, and `GET /api/v1/features` tells the website and apps which ones to show. Every channel sends at most two messages a day per alert, as the Terms promise.

### Email

Set `SMTP_URL` and `MAIL_FROM`. Without them, email alerts are written to the log, which is handy in development.

### Telegram

1. Make a bot with [@BotFather](https://t.me/BotFather) and copy its token.
2. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_NAME` (without the @) and a long random `TELEGRAM_WEBHOOK_SECRET`.
3. Point the bot at the API once:

   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=$API_PUBLIC_URL/api/v1/telegram/webhook" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     -d 'allowed_updates=["message"]'
   ```

How it works: when someone picks Telegram, the API saves the alert with no address and returns a link like `https://t.me/openseat_bot?start=<alert id>`. Opening it and tapping Start sends `/start <alert id>` to the bot, which links that chat to the alert. Each link works once. `/stop` turns off every alert for that chat. Alerts that are never linked never send anything.

### WhatsApp

Uses the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api). Messages a business starts must use a template Meta has approved.

1. Set up a WhatsApp Business account and phone number in Meta's developer dashboard.
2. Create a Utility template named `seat_alert` (or set `WHATSAPP_TEMPLATE`) with six body values, in this order:

   ```
   {{1}} reward seats are open from {{2}} to {{3}}.
   First days: {{4}}
   See them: {{5}}
   Seats go quickly, so confirm on the airline site before you move miles.
   Turn this alert off: {{6}}
   ```

   Add an Arabic version too if you like, and set `WHATSAPP_TEMPLATE_LANG` to match.
3. Set `WHATSAPP_TOKEN` (a permanent system user token) and `WHATSAPP_PHONE_ID`.

People enter their number with the country code. The form says what they will get and how to stop it, which serves as their opt-in.

## Bot checks (Turnstile)

Set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET` from the Cloudflare dashboard. The API then requires a passing Turnstile token on `POST /alerts` and `POST /search/refresh`, the two actions that send messages or cost a fresh read. The website loads Turnstile only when the API asks for it. Most people never see it; it shows a small box only when it needs a click. If Cloudflare cannot be reached, the action is refused rather than let through.

Searches are not behind Turnstile. They are guarded by rate limits, the origin allowlist and request merging, so a search never costs more than one read per block however many people ask.

The native apps have no web view, so they run the check on the website instead. They open `/app-check/` from the website in the system browser sheet, with the site key and the app's own link (`openseat://check`). The page shows the Turnstile box and sends the token back through that link. It only sends tokens to app links, never to another website. So with Turnstile on, the apps need `EXPO_PUBLIC_WEB_URL` set, and the site key must allow the website's domain.

## Currency

Taxes come from the source in US dollars. People can show them in USD, AED, SAR or QAR. These Gulf currencies are pegged to the dollar (3.6725, 3.75 and 3.64), so the conversion is exact and needs no rate feed. The choice is saved in the browser, or in the app's Settings. The first visit picks one from the browser's or phone's region, for example SAR for `ar-SA`. Amounts in any other currency are shown as they came.

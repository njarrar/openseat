import nodemailer from 'nodemailer';
import type { AlertChannel } from '@openseat/shared';
import type { AlertRow } from '../store/types.js';

export interface AlertMessage {
  subject: string;
  text: string;
  /** The same facts as separate values, for channels that send fixed templates (WhatsApp). */
  fields: { cabin: string; origin: string; destination: string; days: string; link: string; unsubscribe: string };
}

export interface Notifier {
  send(alert: AlertRow, message: AlertMessage): Promise<void>;
}

/** Writes alerts to the log. Used for any channel that is not configured. */
export class LogNotifier implements Notifier {
  constructor(private log: (m: string) => void = console.log) {}
  async send(alert: AlertRow, m: AlertMessage) {
    this.log(`[alert] to ${alert.channel}:${alert.address} | ${m.subject}`);
  }
}

export class EmailNotifier implements Notifier {
  private transport;
  constructor(url: string, private from: string) {
    this.transport = nodemailer.createTransport(url);
  }
  async send(alert: AlertRow, m: AlertMessage) {
    await this.transport.sendMail({ from: this.from, to: alert.address, subject: m.subject, text: m.text });
  }
}

/** Telegram Bot API. The address is the chat id the bot got from /start. */
export class TelegramNotifier implements Notifier {
  constructor(private token: string, private fetchImpl: typeof fetch = globalThis.fetch) {}

  async send(alert: AlertRow, m: AlertMessage) {
    await this.say(alert.address, `${m.subject}\n\n${m.text}`);
  }

  async say(chatId: string, text: string) {
    const r = await this.fetchImpl(`https://api.telegram.org/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!r.ok) throw new Error(`Telegram answered ${r.status}`);
  }
}

/**
 * WhatsApp Cloud API. Messages we start must use a template approved by Meta,
 * so the alert goes out as one with six body values, in this order:
 * cabin, origin, destination, first days, search link, link to turn it off.
 */
export class WhatsAppNotifier implements Notifier {
  constructor(
    private opts: { token: string; phoneId: string; template: string; language: string },
    private fetchImpl: typeof fetch = globalThis.fetch,
  ) {}

  async send(alert: AlertRow, m: AlertMessage) {
    const f = m.fields;
    const r = await this.fetchImpl(`https://graph.facebook.com/v21.0/${this.opts.phoneId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.opts.token}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: alert.address.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: this.opts.template,
          language: { code: this.opts.language },
          components: [{
            type: 'body',
            parameters: [f.cabin, f.origin, f.destination, f.days, f.link, f.unsubscribe].map((text) => ({ type: 'text', text })),
          }],
        },
      }),
    });
    if (!r.ok) throw new Error(`WhatsApp answered ${r.status}`);
  }
}

/** Sends each alert through the notifier for its channel. */
export class ChannelNotifier implements Notifier {
  constructor(private by: Partial<Record<AlertChannel, Notifier>>, private fallback: Notifier = new LogNotifier()) {}

  /** Channels people can pick. Email is always offered: without SMTP it goes to the log. */
  get channels(): AlertChannel[] {
    return ['email', ...(['telegram', 'whatsapp'] as const).filter((c) => this.by[c])];
  }

  async send(alert: AlertRow, m: AlertMessage) {
    await (this.by[alert.channel] ?? this.fallback).send(alert, m);
  }
}

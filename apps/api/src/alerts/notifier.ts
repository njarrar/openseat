import nodemailer from 'nodemailer';
import type { AlertRow } from '../store/types.js';

export interface AlertMessage {
  subject: string;
  text: string;
}

export interface Notifier {
  send(alert: AlertRow, message: AlertMessage): Promise<void>;
}

/** Writes alerts to the log. Used when no mail server is configured. */
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
    if (alert.channel !== 'email') return;
    await this.transport.sendMail({ from: this.from, to: alert.address, subject: m.subject, text: m.text });
  }
}

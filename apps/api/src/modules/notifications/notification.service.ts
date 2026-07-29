import { Injectable, Logger } from '@nestjs/common';
import { TypedConfigService } from '../../config/typed-config.service';

interface Mail {
  to: string;
  subject: string;
  html: string;
}

/**
 * Layanan email transaksional.
 *
 * Provider dipilih via env `MAIL_PROVIDER`:
 *  - `console` (default dev): mencetak email ke log.
 *  - `smtp` / `resend`: integrasi menyusul (adapter siap ditambah).
 *
 * Method spesifik (paymentApproved, dsb.) memformat template lalu memanggil send().
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly config: TypedConfigService) {}

  private async send(mail: Mail): Promise<void> {
    const provider = this.config.get('MAIL_PROVIDER');
    if (provider === 'console') {
      this.logger.log(
        `[EMAIL:console] to=${mail.to} subject="${mail.subject}"`,
      );
      return;
    }
    // TODO: implementasi SMTP / Resend memakai kredensial di config.
    this.logger.warn(
      `Provider email "${provider}" belum diimplementasikan — email tidak terkirim (to=${mail.to}).`,
    );
  }

  private layout(title: string, body: string): string {
    return `<div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2>${title}</h2>${body}
      <hr/><p style="color:#888;font-size:12px">DigiTemplate</p></div>`;
  }

  async checkoutCreated(to: string, orderNumber: string, amount: number) {
    await this.send({
      to,
      subject: `Invoice ${orderNumber} — menunggu pembayaran`,
      html: this.layout(
        'Menunggu Pembayaran',
        `<p>Pesanan <b>${orderNumber}</b> dibuat. Total <b>Rp ${amount.toLocaleString(
          'id-ID',
        )}</b>. Silakan transfer lalu unggah bukti pembayaran.</p>`,
      ),
    });
  }

  async proofReceived(to: string, orderNumber: string) {
    await this.send({
      to,
      subject: `Bukti pembayaran ${orderNumber} diterima`,
      html: this.layout(
        'Bukti Diterima',
        `<p>Bukti pembayaran untuk <b>${orderNumber}</b> kami terima dan sedang diverifikasi admin.</p>`,
      ),
    });
  }

  async paymentApproved(to: string, orderNumber: string) {
    await this.send({
      to,
      subject: `Pembayaran ${orderNumber} berhasil — download tersedia`,
      html: this.layout(
        'Pembayaran Berhasil',
        `<p>Pembayaran <b>${orderNumber}</b> terverifikasi. File Anda siap diunduh di dashboard.</p>`,
      ),
    });
  }

  async paymentRejected(to: string, orderNumber: string, reason: string) {
    await this.send({
      to,
      subject: `Pembayaran ${orderNumber} ditolak`,
      html: this.layout(
        'Pembayaran Ditolak',
        `<p>Maaf, bukti pembayaran <b>${orderNumber}</b> ditolak. Alasan: ${reason}. Silakan unggah ulang bukti yang benar.</p>`,
      ),
    });
  }
}

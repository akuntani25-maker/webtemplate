import { Module } from '@nestjs/common';
import { InvoiceExpiryJob } from './invoice-expiry.job';

@Module({
  providers: [InvoiceExpiryJob],
})
export class JobsModule {}

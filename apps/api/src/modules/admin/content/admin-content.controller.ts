import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Roles } from '../../../common/decorators';

/**
 * CRUD sederhana untuk konten CMS: banner, testimonial, FAQ, dan site settings.
 * DTO dibiarkan longgar (Record) karena bentuk bervariasi; validasi ketat bisa
 * ditambahkan per-field bila diperlukan.
 */
@Injectable()
class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  // Banners
  listBanners() {
    return this.prisma.db.banner
      .findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] })
      .then((data) => ({ data }));
  }
  createBanner(body: Record<string, unknown>) {
    return this.prisma.db.banner
      .create({ data: body as never })
      .then((data) => ({ data }));
  }
  async updateBanner(id: string, body: Record<string, unknown>) {
    await this.ensure('banner', id);
    return this.prisma.db.banner
      .update({ where: { id }, data: body as never })
      .then((data) => ({ data }));
  }
  async deleteBanner(id: string) {
    await this.ensure('banner', id);
    await this.prisma.db.banner.delete({ where: { id } });
    return { data: { id, deleted: true } };
  }

  // Testimonials
  listTestimonials() {
    return this.prisma.db.testimonial
      .findMany({ orderBy: { sortOrder: 'asc' } })
      .then((data) => ({ data }));
  }
  createTestimonial(body: Record<string, unknown>) {
    return this.prisma.db.testimonial
      .create({ data: body as never })
      .then((data) => ({ data }));
  }
  async updateTestimonial(id: string, body: Record<string, unknown>) {
    await this.ensure('testimonial', id);
    return this.prisma.db.testimonial
      .update({ where: { id }, data: body as never })
      .then((data) => ({ data }));
  }
  async deleteTestimonial(id: string) {
    await this.ensure('testimonial', id);
    await this.prisma.db.testimonial.delete({ where: { id } });
    return { data: { id, deleted: true } };
  }

  // FAQs
  listFaqs() {
    return this.prisma.db.faq
      .findMany({ orderBy: { sortOrder: 'asc' } })
      .then((data) => ({ data }));
  }
  createFaq(body: Record<string, unknown>) {
    return this.prisma.db.faq
      .create({ data: body as never })
      .then((data) => ({ data }));
  }
  async updateFaq(id: string, body: Record<string, unknown>) {
    await this.ensure('faq', id);
    return this.prisma.db.faq
      .update({ where: { id }, data: body as never })
      .then((data) => ({ data }));
  }
  async deleteFaq(id: string) {
    await this.ensure('faq', id);
    await this.prisma.db.faq.delete({ where: { id } });
    return { data: { id, deleted: true } };
  }

  // Settings (upsert by key)
  listSettings() {
    return this.prisma.db.siteSetting
      .findMany({ orderBy: { key: 'asc' } })
      .then((data) => ({ data }));
  }
  async upsertSetting(key: string, value: unknown, group = 'general') {
    const data = await this.prisma.db.siteSetting.upsert({
      where: { key },
      update: { value: value as never, group },
      create: { key, value: value as never, group },
    });
    return { data };
  }

  private async ensure(model: 'banner' | 'testimonial' | 'faq', id: string) {
    const found = await (this.prisma.db[model] as any).findUnique({
      where: { id },
    });
    if (!found) throw new NotFoundException(`${model} tidak ditemukan`);
  }
}

@Roles('ADMIN')
@Controller('admin')
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  @Get('banners') banners() {
    return this.content.listBanners();
  }
  @Post('banners') createBanner(@Body() b: Record<string, unknown>) {
    return this.content.createBanner(b);
  }
  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.content.updateBanner(id, b);
  }
  @Delete('banners/:id') deleteBanner(@Param('id') id: string) {
    return this.content.deleteBanner(id);
  }

  @Get('testimonials') testimonials() {
    return this.content.listTestimonials();
  }
  @Post('testimonials') createTestimonial(@Body() b: Record<string, unknown>) {
    return this.content.createTestimonial(b);
  }
  @Put('testimonials/:id')
  updateTestimonial(
    @Param('id') id: string,
    @Body() b: Record<string, unknown>,
  ) {
    return this.content.updateTestimonial(id, b);
  }
  @Delete('testimonials/:id') deleteTestimonial(@Param('id') id: string) {
    return this.content.deleteTestimonial(id);
  }

  @Get('faqs') faqs() {
    return this.content.listFaqs();
  }
  @Post('faqs') createFaq(@Body() b: Record<string, unknown>) {
    return this.content.createFaq(b);
  }
  @Put('faqs/:id')
  updateFaq(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.content.updateFaq(id, b);
  }
  @Delete('faqs/:id') deleteFaq(@Param('id') id: string) {
    return this.content.deleteFaq(id);
  }

  @Get('settings') settings() {
    return this.content.listSettings();
  }
  @Put('settings/:key')
  upsertSetting(
    @Param('key') key: string,
    @Body() body: { value: unknown; group?: string },
  ) {
    return this.content.upsertSetting(key, body.value, body.group);
  }
}

export { AdminContentService };

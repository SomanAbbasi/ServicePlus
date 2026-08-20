import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  async overview() {
    return this.adminService.getOverview();
  }

  @Get('catalog')
  async catalog() {
    return this.adminService.getCatalog();
  }

  @Post('catalog/service')
  async createService(@Body() body: any) {
    return this.adminService.createService(body);
  }

  @Post('catalog/service/update')
  async updateService(@Body() body: any) {
    return this.adminService.updateService(body.id, body);
  }

  @Post('catalog/service/delete')
  async deleteService(@Body() body: { id: string }) {
    return this.adminService.deleteService(body.id);
  }

  @Post('catalog/service/duplicate')
  async duplicateService(@Body() body: { id: string }) {
    return this.adminService.duplicateService(body.id);
  }

  @Post('catalog/category')
  async createCategory(@Body() body: any) {
    return this.adminService.createCategory(body);
  }

  @Post('catalog/category/update')
  async updateCategory(@Body() body: any) {
    return this.adminService.updateCategory(body.id, body);
  }

  @Post('catalog/category/delete')
  async deleteCategory(@Body() body: { id: string }) {
    return this.adminService.deleteCategory(body.id);
  }

  @Post('catalog/listing')
  async setServiceListing(
    @Body()
    body: { category_id: string; service_id: string; listed: boolean },
  ) {
    return this.adminService.setServiceListing(
      body.category_id,
      body.service_id,
      body.listed,
    );
  }

  @Get('addons')
  async addons() {
    return this.adminService.getAddons();
  }

  @Post('addon')
  async createAddon(@Body() body: any) {
    return this.adminService.createAddon(body);
  }

  @Post('addon/update')
  async updateAddon(@Body() body: any) {
    return this.adminService.updateAddon(body.id, body);
  }

  @Post('addon/delete')
  async deleteAddon(@Body() body: { id: string }) {
    return this.adminService.deleteAddon(body.id);
  }

  @Post('addon/service')
  async setAddonService(
    @Body()
    body: { addon_id: string; service_id: string; linked: boolean },
  ) {
    return this.adminService.setAddonService(
      body.addon_id,
      body.service_id,
      body.linked,
    );
  }

  @Get('bundles')
  async bundles() {
    return this.adminService.getBundles();
  }

  @Post('bundle')
  async createBundle(@Body() body: any) {
    return this.adminService.createBundle(body);
  }

  @Post('bundle/update')
  async updateBundle(@Body() body: any) {
    return this.adminService.updateBundle(body.id, body);
  }

  @Post('bundle/delete')
  async deleteBundle(@Body() body: { id: string }) {
    return this.adminService.deleteBundle(body.id);
  }

  @Post('bundle/item')
  async addBundleItem(
    @Body()
    body: {
      bundle_id: string;
      label: string;
      service_id?: string | null;
      quantity: number;
    },
  ) {
    return this.adminService.addBundleItem(
      body.bundle_id,
      body.label,
      body.quantity,
      body.service_id,
    );
  }

  @Post('bundle/item/delete')
  async deleteBundleItem(@Body() body: { id: string }) {
    return this.adminService.deleteBundleItem(body.id);
  }

  @Get('coupons')
  async coupons() {
    return this.adminService.getCoupons();
  }

  @Post('coupon')
  async upsertCoupon(@Body() body: any) {
    return this.adminService.upsertCoupon(body);
  }

  @Post('coupon/active')
  async setCouponActive(@Body() body: { id: string; is_active: boolean }) {
    return this.adminService.setCouponActive(body.id, body.is_active);
  }

  @Get('professionals')
  async professionals() {
    return this.adminService.getProfessionals();
  }

  @Post('professional')
  async createProfessional(@Body() body: any) {
    return this.adminService.createProfessional(body);
  }

  @Post('professional/detail')
  async professionalDetail(@Body() body: { id: string }) {
    return this.adminService.getProfessionalDetail(body.id);
  }

  @Post('professional/update')
  async updateProfessional(@Body() body: any) {
    return this.adminService.updateProfessional(body.id, body);
  }

  @Post('professional/delete')
  async deleteProfessional(@Body() body: { id: string }) {
    return this.adminService.deleteProfessional(body.id);
  }

  @Post('professional/status')
  async setProfessionalStatus(
    @Body()
    body: { id: string; status?: string; is_active?: boolean },
  ) {
    return this.adminService.setProfessionalStatus(body.id, {
      status: body.status,
      isActive: body.is_active,
    });
  }

  @Post('professional/skill')
  async setProfessionalSkill(
    @Body()
    body: {
      professional_id: string;
      category_id: string;
      enabled: boolean;
    },
  ) {
    return this.adminService.setProfessionalSkill(
      body.professional_id,
      body.category_id,
      body.enabled,
    );
  }

  @Get('customers')
  async customers() {
    return this.adminService.getCustomers();
  }

  @Post('customer/detail')
  async customerDetail(@Body() body: { id: string }) {
    return this.adminService.getCustomerDetail(body.id);
  }

  @Get('locations')
  async locations() {
    return this.adminService.getLocations();
  }

  @Post('location/city')
  async updateCity(@Body() body: any) {
    return this.adminService.updateCity(body.id, body);
  }

  @Get('payments')
  async payments() {
    return this.adminService.getPayments();
  }

  @Get('refunds')
  async refunds() {
    return this.adminService.getRefunds();
  }

  @Get('reviews')
  async reviews() {
    return this.adminService.getReviews();
  }

  @Get('notifications')
  async notifications() {
    return this.adminService.getNotifications();
  }

  @Get('support')
  async support() {
    return this.adminService.getSupportTickets();
  }

  @Post('support/ticket')
  async ticket(@Body() body: { id: string }) {
    return this.adminService.getTicket(body.id);
  }

  @Post('support/reply')
  async replyToTicket(@Body() body: { id: string; body: string }) {
    return this.adminService.replyToTicket(body.id, body.body);
  }

  @Post('support/status')
  async setTicketStatus(@Body() body: { id: string; status: string }) {
    return this.adminService.setTicketStatus(body.id, body.status);
  }

  @Get('settings')
  async settings() {
    return this.adminService.getSettings();
  }

  @Post('setting')
  async updateSetting(@Body() body: { key: string; value: any }) {
    return this.adminService.updateSetting(body.key, body.value);
  }

  @Get('audit-logs')
  async auditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('reports')
  async reports() {
    return this.adminService.getReports();
  }

  @Get('availability')
  async availability() {
    return this.adminService.getAvailability();
  }

  @Post('variants')
  async getVariants(@Body() body: { service_id: string }) {
    return this.adminService.getServiceVariants(body.service_id);
  }

  @Post('option-groups')
  async getOptionGroups(@Body() body: { service_id: string }) {
    return this.adminService.getServiceOptionGroups(body.service_id);
  }

  @Post('option-group')
  async upsertOptionGroup(@Body() body: any) {
    return this.adminService.upsertOptionGroup(body);
  }

  @Post('option-group/delete')
  async deleteOptionGroup(@Body() body: { id: string }) {
    return this.adminService.deleteOptionGroup(body.id);
  }

  @Post('variant')
  async upsertVariant(@Body() body: any) {
    return this.adminService.upsertVariant(body);
  }

  @Post('variant/delete')
  async deleteVariant(@Body() body: { id: string }) {
    return this.adminService.deleteVariant(body.id);
  }

  @Get('bookings')
  async bookings() {
    return this.adminService.getBookings();
  }

  @Post('booking/detail')
  async bookingDetail(@Body() body: { id: string }) {
    return this.adminService.getBookingDetail(body.id);
  }

  @Post('booking/status')
  async setBookingStatus(
    @Body() body: { id: string; status: string; note?: string },
  ) {
    return this.adminService.setBookingStatus(body.id, body.status, body.note);
  }

  @Post('booking/assign')
  async assignProfessional(
    @Body() body: { id: string; professional_id: string | null },
  ) {
    return this.adminService.assignProfessional(
      body.id,
      body.professional_id,
    );
  }
}

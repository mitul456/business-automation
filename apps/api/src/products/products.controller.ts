import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Header,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  WorkspaceRole,
  CreateProductInput,
  ProductStatus,
  AdjustInventoryInput,
} from '@omniflow/shared';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async listProducts(
    @Req() req: any,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.productsService.listProducts({
      tenantId: req.tenantId,
      categoryId,
      status,
      search,
      lowStockOnly: lowStockOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get('alerts/low-stock')
  async getLowStockAlerts(@Req() req: any) {
    return this.productsService.getLowStockAlerts(req.tenantId);
  }

  @Get('inventory/transactions')
  async listInventoryTransactions(
    @Req() req: any,
    @Query('productId') productId?: string
  ) {
    return this.productsService.listInventoryTransactions(req.tenantId, productId);
  }

  @Post('inventory/adjust')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async adjustInventory(
    @Req() req: any,
    @Body('productId') productId: string,
    @Body() body: AdjustInventoryInput
  ) {
    return this.productsService.adjustStock(req.tenantId, productId, body);
  }

  @Post('import/csv')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async importCsv(@Req() req: any, @Body('csvContent') csvContent: string) {
    return this.productsService.importProductsCsv(req.tenantId, csvContent);
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="products.csv"')
  async exportCsv(@Req() req: any) {
    return this.productsService.exportProductsCsv(req.tenantId);
  }

  @Get('categories')
  async listCategories(@Req() req: any) {
    return this.productsService.listCategories(req.tenantId);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async createCategory(
    @Req() req: any,
    @Body() body: { name: string; slug: string; description?: string }
  ) {
    return this.productsService.createCategory(req.tenantId, body);
  }

  @Put('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async updateCategory(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string }
  ) {
    return this.productsService.updateCategory(req.tenantId, id, body);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async deleteCategory(@Req() req: any, @Param('id') id: string) {
    return this.productsService.deleteCategory(req.tenantId, id);
  }

  @Get(':id')
  async getProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.getProduct(req.tenantId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async createProduct(@Req() req: any, @Body() body: CreateProductInput) {
    return this.productsService.createProduct(req.tenantId, body);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async updateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: Partial<CreateProductInput>
  ) {
    return this.productsService.updateProduct(req.tenantId, id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async deleteProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.deleteProduct(req.tenantId, id);
  }
}

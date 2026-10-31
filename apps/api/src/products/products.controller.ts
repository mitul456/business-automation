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
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.productsService.listProducts({
      tenantId: req.tenantId,
      categoryId,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get('categories')
  async listCategories(@Req() req: any) {
    return this.productsService.listCategories(req.tenantId);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async createCategory(
    @Req() req: any,
    @Body() body: { name: string; slug: string; description?: string }
  ) {
    return this.productsService.createCategory(req.tenantId, body);
  }

  @Get(':id')
  async getProduct(@Req() req: any, @Param('id') id: string) {
    return this.productsService.getProduct(req.tenantId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async createProduct(@Req() req: any, @Body() body: CreateProductInput) {
    return this.productsService.createProduct(req.tenantId, body);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
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

import { gurudwaraDB } from '../common/DynomoDB';
import { NotFoundError, ValidationError } from '../common/errors';
import { logger } from '../common/logger';
import { Gurudwara, QueryParams, PaginationMeta } from '../types';
import { GURUDWARA_STATUS } from '../common/constants';

export class GurudwaraService {
  async getById(id: string): Promise<Gurudwara | null> {
    logger.logDatabaseOperation('get', 'gurudwara', { gurudwaraId: id });
    return await gurudwaraDB.getItem<Gurudwara>({ id });
  }

  async create(gurudwaraData: Omit<Gurudwara, 'id' | 'createdDate' | 'updatedDate'>): Promise<Gurudwara> {
    const now = new Date().toISOString();
    const id = this.generateId();
    
    const gurudwara: Gurudwara = {
      ...gurudwaraData,
      id,
      status: GURUDWARA_STATUS.PENDING,
      createdDate: now,
      updatedDate: now,
    };

    logger.logDatabaseOperation('create', 'gurudwara', { gurudwaraId: id });
    return await gurudwaraDB.putItem<Gurudwara>(gurudwara);
  }

  async update(id: string, updateData: Partial<Gurudwara>): Promise<Gurudwara> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Gurudwara');
    }

    const updatedData = {
      ...updateData,
      updatedDate: new Date().toISOString(),
    };

    logger.logDatabaseOperation('update', 'gurudwara', { gurudwaraId: id });
    const result = await gurudwaraDB.updateItem<Gurudwara>({ id }, updatedData);
    
    if (!result) {
      throw new Error('Failed to update gurudwara');
    }
    
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Gurudwara');
    }

    logger.logDatabaseOperation('delete', 'gurudwara', { gurudwaraId: id });
    return await gurudwaraDB.deleteItem({ id });
  }

  async getByUserId(userId: string): Promise<Gurudwara[]> {
    logger.logDatabaseOperation('scan', 'gurudwara', { userId });
    const allGurudwaras = await gurudwaraDB.scanTable<Gurudwara>();
    return allGurudwaras.filter(g => g.addedByUserId === userId);
  }

  async getByStatus(status: string): Promise<Gurudwara[]> {
    logger.logDatabaseOperation('scan', 'gurudwara', { status });
    const allGurudwaras = await gurudwaraDB.scanTable<Gurudwara>();
    return allGurudwaras.filter(g => g.status === status);
  }

  async updateStatus(id: string, status: string, adminId: string): Promise<Gurudwara> {
    if (!Object.values(GURUDWARA_STATUS).includes(status as any)) {
      throw new ValidationError('Invalid status');
    }

    return await this.update(id, {
      status: status as any,
      approvedByAdmin: status === GURUDWARA_STATUS.APPROVED,
    });
  }

  async search(params: QueryParams): Promise<{ items: Gurudwara[]; meta: PaginationMeta }> {
    const { page = 1, limit = 10, search, status, city, state, country } = params;
    
    logger.logDatabaseOperation('scan', 'gurudwara', { search, status, city, state, country });
    let items = await gurudwaraDB.scanTable<Gurudwara>();

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.city.toLowerCase().includes(searchLower) ||
        item.address.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      items = items.filter(item => item.status === status);
    }

    if (city) {
      items = items.filter(item => item.city.toLowerCase() === city.toLowerCase());
    }

    if (state) {
      items = items.filter(item => item.state.toLowerCase() === state.toLowerCase());
    }

    if (country) {
      items = items.filter(item => item.country.toLowerCase() === country.toLowerCase());
    }

    // Pagination
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { items: paginatedItems, meta };
  }

  private generateId(): string {
    return `gurd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const gurudwaraService = new GurudwaraService();
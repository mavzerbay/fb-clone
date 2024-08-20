import {
  DeepPartial,
  FindOneOptions,
  FindManyOptions,
  Repository,
  FindOptionsWhere,
} from 'typeorm';
import { BaseInterfaceRepository } from './base.interface.repository';

interface HasId {
  id: number;
}

export abstract class BaseAbstractRepository<T extends HasId>
  implements BaseInterfaceRepository<T>
{
  private entity: Repository<T>;

  protected constructor(entity: Repository<T>) {
    this.entity = entity;
  }

  create(data: DeepPartial<T>): T {
    return this.entity.create(data);
  }
  createMany(data: DeepPartial<T>[]): T[] {
    return this.entity.create(data);
  }
  public async save(data: DeepPartial<T>): Promise<T> {
    return this.entity.save(data);
  }
  saveMany(data: DeepPartial<T>[]): Promise<T[]> {
    return this.entity.save(data);
  }
  findOneById(id: any): Promise<T> {
    const options: FindOptionsWhere<T> = {
      id: id,
    };
    return this.entity.findOneBy(options);
  }
  findByCondition(filterCondition: FindOneOptions<T>): Promise<T> {
    return this.entity.findOne(filterCondition);
  }
  findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.entity.find(options);
  }
  remove(data: T): Promise<T> {
    return this.entity.remove(data);
  }
  findWithRelations(relations: FindManyOptions<T>): Promise<T[]> {
    return this.entity.find(relations);
  }
  preload(entityLike: DeepPartial<T>): Promise<T> {
    return this.entity.preload(entityLike);
  }
}

import { ApiKeyActiveDto } from 'src/common/api-key/dtos/api-key.active.dto';
import { ApiKeyCreateDto } from 'src/common/api-key/dtos/api-key.create.dto';
import { ApiKeyResetDto } from 'src/common/api-key/dtos/api-key.reset.dto';
import { ApiKeyUpdateDto } from 'src/common/api-key/dtos/api-key.update.dto';
import { ApiKeyEntity } from 'src/common/api-key/repository/entities/api-key.entity';
import {
    IDatabaseCreateOptions,
    IDatabaseFindAllOptions,
    IDatabaseFindOneOptions,
    IDatabaseOptions,
    IDatabaseSoftDeleteOptions,
} from 'src/common/database/interfaces/database.interface';

export interface IApiKeyService {
    findAll(
        find?: Record<string, any>,
        options?: IDatabaseFindAllOptions
    ): Promise<ApiKeyEntity[]>;

    findOneById(
        _id: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity>;

    findOne(
        find: Record<string, any>,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity>;

    findOneByKey(
        key: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity>;

    findOneByKeyAndActive(
        key: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyEntity>;

    getTotal(
        find?: Record<string, any>,
        options?: IDatabaseOptions
    ): Promise<number>;

    updateIsActive(
        _id: string,
        data: ApiKeyActiveDto,
        options?: IDatabaseOptions
    ): Promise<ApiKeyEntity>;

    create(
        { name, description }: ApiKeyCreateDto,
        options?: IDatabaseCreateOptions
    ): Promise<ApiKeyEntity>;

    updateOneById(
        _id: string,
        data: ApiKeyUpdateDto,
        options?: IDatabaseOptions
    ): Promise<ApiKeyEntity>;

    updateResetById(
        _id: string,
        data: ApiKeyResetDto,
        options?: IDatabaseOptions
    ): Promise<ApiKeyEntity>;

    deleteOneById(
        _id: string,
        options?: IDatabaseSoftDeleteOptions
    ): Promise<ApiKeyEntity>;

    deleteOne(
        find: Record<string, any>,
        options?: IDatabaseSoftDeleteOptions
    ): Promise<ApiKeyEntity>;
}

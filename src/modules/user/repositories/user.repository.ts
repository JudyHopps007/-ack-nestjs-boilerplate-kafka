import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseMongoRepositoryAbstract } from 'src/common/database/abstracts/database.mongo-repository.abstract';
import { DatabaseRepository } from 'src/common/database/decorators/database.decorator';
import { IDatabaseRepositoryAbstract } from 'src/common/database/interfaces/database.repository.interface';
import { PermissionEntity } from 'src/modules/permission/schemas/permission.schema';
import { RoleEntity } from 'src/modules/role/schemas/role.schema';
import { User, UserEntity } from 'src/modules/user/schemas/user.schema';

@Injectable()
export class UserRepository
    extends DatabaseMongoRepositoryAbstract<User>
    implements IDatabaseRepositoryAbstract<User>
{
    constructor(
        @DatabaseRepository(UserEntity.name)
        private readonly userModel: Model<User>
    ) {
        super(userModel, {
            path: 'role',
            model: RoleEntity.name,
            populate: {
                path: 'permissions',
                model: PermissionEntity.name,
            },
        });
    }
}

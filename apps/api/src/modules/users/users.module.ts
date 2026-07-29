import { Module } from '@nestjs/common';
import { UsersController, UsersService } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'nest-supabase-guard/dist/supabase-auth.guard';
import { UserAccessOwnGuard } from './guards/user-access-own.guard';
import { UsersService } from './users.service';

@UseGuards(SupabaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(UserAccessOwnGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('/authId/:id')
  findOneByAuthId(@Param('id') id: string) {
    return this.usersService.findOneByAuthId(id);
  }
}

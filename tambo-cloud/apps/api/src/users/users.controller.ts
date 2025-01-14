import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from 'nest-supabase-guard/dist/supabase-auth.guard';
import { UserDto } from './dto/user.dto';
import { UserAccessOwnGuard } from './guards/user-access-own.guard';
import { UsersService } from './users.service';

@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: UserDto) {
    return this.usersService.create(createUserDto);
  }

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

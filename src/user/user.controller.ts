import { Controller, Post, Body, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

//   @Post()
//   async createUser(@Body() body: { username: string; email: string; password: string }) {
//     return this.userService.createUser(body.username, body.password);
//   }

  @Get()
  async getUsers() {
    return this.userService.getUsers();
  }
}

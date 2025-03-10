import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // API to register user
  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    return this.userService.register(body.username, body.password);
  }

  // API to authenticate user
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);
    return this.authService.login(user);
  }

  //  API to log out user
  @Post('logout')
  async logout() {
    return { message: 'Logout successful' };
  }
}

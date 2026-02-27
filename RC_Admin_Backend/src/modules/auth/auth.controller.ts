import {
  Controller,
  Post,
  HttpStatus,
  UseGuards,
  HttpCode,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Admin Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login', description: 'Authenticate an admin user with email and password' })
  @ApiBody({ schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', example: 'admin@rapidcapsule.com' }, password: { type: 'string', example: 'SecurePass123!' } } } })
  @ApiResponse({ status: 200, description: 'Login successful — returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req) {
    const { message, result } = await this.authService.login(req.user);
    return sendSuccessResponse(message, result);
  }
}

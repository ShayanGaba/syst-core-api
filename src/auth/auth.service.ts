import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private users = [
    { username: 'shayan', password: 'password123', role: 'Admin', tenantId: 'company-alpha' },
    { username: 'user2', password: 'password456', role: 'User', tenantId: 'company-beta' }
  ];

  login(credentials: any) {
    const user = this.users.find(
      (u) => u.username === credentials.username && u.password === credentials.password
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials, bro.');
    }

    const payload = { 
      username: user.username, 
      role: user.role, 
      tenantId: user.tenantId 
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
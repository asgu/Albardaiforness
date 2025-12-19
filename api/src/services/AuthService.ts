import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

export class AuthService {
  async authenticate(username: string, password: string): Promise<{ token: string } | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    // Generate token
    const secret = process.env.JWT_SECRET || 'secret';
    const payload = { userId: user.id, username: user.username };
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);

    // Store token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accessToken: token,
        lastLoginAt: new Date(),
      },
    });

    return { token };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          accessToken: token,
        },
      });
      return user;
    } catch (error) {
      return null;
    }
  }
}

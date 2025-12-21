import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

export class AuthService {
  /**
   * Verify password against FOSUserBundle SHA-512 hash
   * Format: {encoded_hash}{salt}
   */
  private verifyFOSPassword(password: string, encodedPassword: string): boolean {
    // FOSUserBundle format: {hash}{salt}
    // Hash is base64 encoded SHA-512
    const parts = encodedPassword.split('{');
    if (parts.length !== 3) {
      return false;
    }

    const hash = parts[1].replace('}', '');
    const salt = parts[2].replace('}', '');

    // Generate SHA-512 hash with salt
    const testHash = crypto
      .createHash('sha512')
      .update(password + '{' + salt + '}')
      .digest('base64');

    return testHash === hash;
  }

  /**
   * Verify password (supports both bcrypt and FOSUserBundle SHA-512)
   */
  private async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    // Check if it's FOSUserBundle format (contains {})
    if (passwordHash.includes('{') && passwordHash.includes('}')) {
      return this.verifyFOSPassword(password, passwordHash);
    }

    // Otherwise, use bcrypt
    return await bcrypt.compare(password, passwordHash);
  }

  async authenticate(username: string, password: string): Promise<{ token: string } | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    // Verify password (supports both formats)
    const isValid = await this.verifyPassword(password, user.passwordHash);

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

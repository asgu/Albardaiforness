import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

export class AuthService {
  /**
   * Verify password against FOSUserBundle SHA-512 hash
   * Format: {encoded_hash}{salt}
   * FOSUserBundle sha512 algorithm:
   * 1. salted = password + '{' + salt + '}'
   * 2. digest = sha512(salted) [binary]
   * 3. for i = 1 to 4999: digest = sha512(digest + salted) [binary]
   * 4. encoded = base64(digest)
   */
  private verifyFOSPassword(password: string, encodedPassword: string): boolean {
    // FOSUserBundle format: {hash}{salt}
    const parts = encodedPassword.split('{');
    if (parts.length !== 3) {
      return false;
    }

    const hash = parts[1].replace('}', '');
    const salt = parts[2].replace('}', '');

    // Prepare salted password
    const salted = password + '{' + salt + '}';
    
    // First iteration
    let digest = crypto.createHash('sha512').update(salted).digest();
    
    // Remaining 4999 iterations
    for (let i = 1; i < 5000; i++) {
      const combined = Buffer.concat([digest, Buffer.from(salted, 'utf8')]);
      digest = crypto.createHash('sha512').update(combined).digest();
    }
    
    // Encode to base64
    const testHash = digest.toString('base64');

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

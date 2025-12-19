import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class ServerService {
  /**
   * Get all servers
   */
  async getAll() {
    return prisma.server.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get server by code
   */
  async getByCode(code: string) {
    return prisma.server.findUnique({
      where: { code },
    });
  }

  /**
   * Get server with persons count
   */
  async getByCodeWithStats(code: string) {
    const server = await prisma.server.findUnique({
      where: { code },
    });

    if (!server) {
      return null;
    }

    const personsCount = await prisma.person.count({
      where: {
        primaryServerId: server.id,
        isMerged: false,
      },
    });

    return {
      ...server,
      personsCount,
    };
  }

  /**
   * Get persons by server code
   */
  async getPersons(code: string, page: number = 1, limit: number = 100) {
    const server = await this.getByCode(code);
    
    if (!server) {
      throw new Error('Server not found');
    }

    const skip = (page - 1) * limit;

    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        where: {
          primaryServerId: server.id,
          isMerged: false,
        },
        include: {
          avatarMedia: {
            select: {
              filePath: true,
              thumbnailPath: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
      }),
      prisma.person.count({
        where: {
          primaryServerId: server.id,
          isMerged: false,
        },
      }),
    ]);

    return {
      server,
      persons,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new server
   */
  async create(data: Prisma.ServerCreateInput) {
    return prisma.server.create({ data });
  }

  /**
   * Update a server
   */
  async update(code: string, data: Prisma.ServerUpdateInput) {
    return prisma.server.update({
      where: { code },
      data,
    });
  }
}


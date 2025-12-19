import { prisma } from '../lib/prisma';
import { Person, Prisma } from '@prisma/client';

export class PersonService {
  /**
   * Get person by original ID (from old database) with relations
   */
  async getByOriginalId(originalId: string, sourceDb?: string) {
    const where: any = { originalId: BigInt(originalId) };
    if (sourceDb) {
      where.sourceDb = sourceDb;
    }
    
    const person = await prisma.person.findFirst({
      where,
      include: {
        primaryServer: true,
        avatarMedia: true,
        mother: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        father: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        childrenAsMother: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        childrenAsFather: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        marriagesAsPerson1: {
          include: {
            person2: {
              select: {
                id: true,
                originalId: true,
                firstName: true,
                lastName: true,
                nickName: true,
                birthYear: true,
                deathYear: true,
                gender: true,
                avatarMediaId: true,
              },
            },
          },
        },
        marriagesAsPerson2: {
          include: {
            person1: {
              select: {
                id: true,
                originalId: true,
                firstName: true,
                lastName: true,
                nickName: true,
                birthYear: true,
                deathYear: true,
                gender: true,
                avatarMediaId: true,
              },
            },
          },
        },
      },
    });

    return person;
  }

  /**
   * Get person by ID with relations
   */
  async getById(id: bigint) {
    return prisma.person.findUnique({
      where: { id },
      include: {
        primaryServer: true,
        avatarMedia: true,
        mother: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        father: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        childrenAsMother: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        childrenAsFather: {
          select: {
            id: true,
            originalId: true,
            firstName: true,
            lastName: true,
            nickName: true,
            birthYear: true,
            deathYear: true,
            gender: true,
            avatarMediaId: true,
          },
        },
        marriagesAsPerson1: {
          include: {
            person2: {
              select: {
                id: true,
                originalId: true,
                firstName: true,
                lastName: true,
                nickName: true,
                birthYear: true,
                deathYear: true,
                gender: true,
                avatarMediaId: true,
              },
            },
          },
        },
        marriagesAsPerson2: {
          include: {
            person1: {
              select: {
                id: true,
                originalId: true,
                firstName: true,
                lastName: true,
                nickName: true,
                birthYear: true,
                deathYear: true,
                gender: true,
                avatarMediaId: true,
              },
            },
          },
        },
        media: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Get multiple persons by IDs
   */
  async getByIds(ids: bigint[]) {
    return prisma.person.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarMedia: {
          select: {
            filePath: true,
            thumbnailPath: true,
          },
        },
      },
    });
  }

  /**
   * Get birthdays today
   */
  async getBirthdaysToday() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    return prisma.person.findMany({
      where: {
        birthMonth: month,
        birthDay: day,
        deathYear: null,
        birthYear: { gte: 1940 },
      },
      include: {
        avatarMedia: {
          select: {
            filePath: true,
            thumbnailPath: true,
          },
        },
      },
      orderBy: { birthYear: 'desc' },
    });
  }

  /**
   * Search persons
   */
  async search(query: string, serverCode?: string, limit: number = 50) {
    const where: Prisma.PersonWhereInput = {
      isMerged: false,
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { nickName: { contains: query } },
      ],
    };

    if (serverCode) {
      where.primaryServer = {
        code: serverCode,
      };
    }

    return prisma.person.findMany({
      where,
      include: {
        primaryServer: {
          select: {
            code: true,
            name: true,
          },
        },
        avatarMedia: {
          select: {
            filePath: true,
            thumbnailPath: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  /**
   * Get all persons with pagination
   */
  async getAll(page: number = 1, limit: number = 100, serverCode?: string) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.PersonWhereInput = {
      isMerged: false,
    };

    if (serverCode) {
      where.primaryServer = {
        code: serverCode,
      };
    }

    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        where,
        include: {
          primaryServer: {
            select: {
              code: true,
              name: true,
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
      prisma.person.count({ where }),
    ]);

    return {
      persons,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new person
   */
  async create(data: Prisma.PersonCreateInput, userId: number) {
    return prisma.person.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /**
   * Update a person
   */
  async update(id: bigint, data: Prisma.PersonUpdateInput, userId: number) {
    return prisma.person.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  /**
   * Soft delete a person
   */
  async delete(id: bigint, userId: number) {
    return prisma.person.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }
}


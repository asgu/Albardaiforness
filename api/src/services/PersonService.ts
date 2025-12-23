import { prisma } from '../lib/prisma';
import { Person, Prisma } from '@prisma/client';

/**
 * Parse year range string and return Prisma filter
 * Supports: 1950, >1950, <1950, 1930-1950
 */
function parseYearRange(yearStr: string): any {
  if (!yearStr || yearStr.trim() === '') return undefined;

  const trimmed = yearStr.trim();

  // Range: 1930-1950
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
    if (!isNaN(start) && !isNaN(end)) {
      return { gte: start, lte: end };
    }
  }

  // Greater than: >1950
  if (trimmed.startsWith('>')) {
    const year = parseInt(trimmed.substring(1).trim());
    if (!isNaN(year)) {
      return { gt: year };
    }
  }

  // Less than: <1950
  if (trimmed.startsWith('<')) {
    const year = parseInt(trimmed.substring(1).trim());
    if (!isNaN(year)) {
      return { lt: year };
    }
  }

  // Exact year: 1950
  const year = parseInt(trimmed);
  if (!isNaN(year)) {
    return year;
  }

  return undefined;
}

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
            motherId: true,
            fatherId: true,
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
            motherId: true,
            fatherId: true,
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
            motherId: true,
            fatherId: true,
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
            motherId: true,
            fatherId: true,
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
  async search(
    query?: string,
    serverCode?: string,
    filters?: {
      id?: string;
      firstName?: string;
      lastName?: string;
      nickName?: string;
      birthYear?: number | string;
      deathYear?: number | string;
      gender?: string;
      birthPlace?: string;
      occupation?: string;
      note?: string;
    },
    limit: number = 50
  ) {
    const where: Prisma.PersonWhereInput = {
      isMerged: false,
    };

    // Simple search by query
    if (query) {
      // Check if query is a number (potential ID)
      const isNumeric = /^\d+$/.test(query);
      
      where.OR = [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { nickName: { contains: query } },
      ];
      
      // If numeric, also search by ID and originalId
      if (isNumeric) {
        where.OR.push({ id: BigInt(query) });
        where.OR.push({ originalId: BigInt(query) });
      }
    }

    // Advanced search by specific fields
    if (filters) {
      if (filters.id) {
        // Search by ID or originalId
        const isNumeric = /^\d+$/.test(filters.id);
        if (isNumeric) {
          where.OR = [
            { id: BigInt(filters.id) },
            { originalId: BigInt(filters.id) },
          ];
        }
      }
      if (filters.firstName) {
        where.firstName = { contains: filters.firstName };
      }
      if (filters.lastName) {
        where.lastName = { contains: filters.lastName };
      }
      if (filters.nickName) {
        where.nickName = { contains: filters.nickName };
      }
      if (filters.birthYear) {
        const birthYearFilter = typeof filters.birthYear === 'string' 
          ? parseYearRange(filters.birthYear)
          : filters.birthYear;
        if (birthYearFilter !== undefined) {
          where.birthYear = birthYearFilter;
        }
      }
      if (filters.deathYear) {
        const deathYearFilter = typeof filters.deathYear === 'string'
          ? parseYearRange(filters.deathYear)
          : filters.deathYear;
        if (deathYearFilter !== undefined) {
          where.deathYear = deathYearFilter;
        }
      }
      if (filters.gender) {
        where.gender = filters.gender as any;
      }
      if (filters.birthPlace) {
        where.birthPlace = { contains: filters.birthPlace };
      }
      if (filters.occupation) {
        where.occupation = { contains: filters.occupation };
      }
      if (filters.note) {
        where.note = { contains: filters.note };
      }
    }

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
  async create(data: any, userId: number) {
    // Clean up data - convert empty strings to null
    const cleanData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        cleanData[key] = null;
      } else {
        cleanData[key] = value;
      }
    }

    // First create the person without originalId
    const person = await prisma.person.create({
      data: {
        firstName: cleanData.firstName,
        lastName: cleanData.lastName,
        maidenName: cleanData.maidenName,
        nickName: cleanData.nickName,
        birthYear: cleanData.birthYear,
        birthMonth: cleanData.birthMonth,
        birthDay: cleanData.birthDay,
        deathYear: cleanData.deathYear,
        deathMonth: cleanData.deathMonth,
        deathDay: cleanData.deathDay,
        gender: cleanData.gender || 'unknown',
        occupation: cleanData.occupation,
        note: cleanData.note,
        privateNote: cleanData.privateNote,
        birthPlace: cleanData.birthPlace,
        deathPlace: cleanData.deathPlace,
        burialPlace: cleanData.burialPlace,
        primaryServerId: cleanData.primaryServerId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Update originalId to match id
    const updatedPerson = await prisma.person.update({
      where: { id: person.id },
      data: { originalId: person.id },
      include: {
        primaryServer: true,
        mother: true,
        father: true,
        avatarMedia: true,
      },
    });

    return updatedPerson;
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

  /**
   * Update person fields
   */
  async update(id: bigint, data: any, userId: number) {
    return prisma.person.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add a relative to a person
   */
  async addRelative(personId: bigint, relativeId: bigint, relationType: string, userId: number) {
    switch (relationType) {
      case 'father':
        return prisma.person.update({
          where: { id: personId },
          data: {
            fatherId: relativeId,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });
      
      case 'mother':
        return prisma.person.update({
          where: { id: personId },
          data: {
            motherId: relativeId,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });
      
      case 'child':
        // Determine if the person is the father or mother based on gender
        const person = await prisma.person.findUnique({
          where: { id: personId },
          select: { gender: true },
        });
        
        if (person?.gender === 'male') {
          return prisma.person.update({
            where: { id: relativeId },
            data: {
              fatherId: personId,
              updatedBy: userId,
              updatedAt: new Date(),
            },
          });
        } else {
          return prisma.person.update({
            where: { id: relativeId },
            data: {
              motherId: personId,
              updatedBy: userId,
              updatedAt: new Date(),
            },
          });
        }
      
      case 'spouse':
        // Create a marriage record
        return prisma.marriage.create({
          data: {
            person1Id: personId,
            person2Id: relativeId,
            createdBy: userId,
          },
        });
      
      default:
        throw new Error(`Unknown relation type: ${relationType}`);
    }
  }

  async removeRelative(personId: bigint, relativeId: bigint) {
    // Сначала проверим, какой тип связи существует
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { 
        fatherId: true, 
        motherId: true,
        gender: true,
      },
    });

    // Удаляем связь родитель-ребенок
    if (person?.fatherId === relativeId) {
      await prisma.person.update({
        where: { id: personId },
        data: { fatherId: null },
      });
      return;
    }

    if (person?.motherId === relativeId) {
      await prisma.person.update({
        where: { id: personId },
        data: { motherId: null },
      });
      return;
    }

    // Проверяем, является ли relativeId ребенком personId
    const child = await prisma.person.findUnique({
      where: { id: relativeId },
      select: { fatherId: true, motherId: true },
    });

    if (child?.fatherId === personId) {
      await prisma.person.update({
        where: { id: relativeId },
        data: { fatherId: null },
      });
      return;
    }

    if (child?.motherId === personId) {
      await prisma.person.update({
        where: { id: relativeId },
        data: { motherId: null },
      });
      return;
    }

    // Удаляем брак (spouse)
    await prisma.marriage.deleteMany({
      where: {
        OR: [
          { person1Id: personId, person2Id: relativeId },
          { person1Id: relativeId, person2Id: personId },
        ],
      },
    });
  }
}


import { Request, Response } from 'express';
import { PersonService } from '../services/PersonService';
import { prisma } from '../lib/prisma';

const personService = new PersonService();

// Helper function to convert BigInt and Date to string recursively
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertBigIntToString(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

export class PersonController {
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Определяем сервер по домену запроса
      const host = req.get('x-server-host') || req.get('host') || '';
      let sourceDb: string | undefined;
      
      if (host.includes('albardaiforness')) {
        sourceDb = 'albaro';
      } else if (host.includes('alberodipreone')) {
        sourceDb = 'preone';
      } else if (host.includes('alberodiraveo')) {
        sourceDb = 'raveo';
      }
      
      // Пытаемся найти по originalId (для обратной совместимости со старыми URL)
      let person = await personService.getByOriginalId(id, sourceDb);
      
      // Если не найдено, пробуем по внутреннему ID
      if (!person) {
        person = await personService.getById(BigInt(id));
      }

      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }

      // Combine children from both relations
      const children = [
        ...(person.childrenAsMother || []),
        ...(person.childrenAsFather || []),
      ];

      // Combine marriages with spouse info
      const spouses = [
        ...(person.marriagesAsPerson1 || []).map(m => ({
          person: {
            ...m.person2,
            id: m.person2.id.toString(),
          },
          marriageYear: m.marriageYear,
          marriageDate: m.marriageDate,
          marriagePlace: m.marriagePlace,
          isCurrent: m.isCurrent,
        })),
        ...(person.marriagesAsPerson2 || []).map(m => ({
          person: {
            ...m.person1,
            id: m.person1.id.toString(),
          },
          marriageYear: m.marriageYear,
          marriageDate: m.marriageDate,
          marriagePlace: m.marriagePlace,
          isCurrent: m.isCurrent,
        })),
      ];

      // Get siblings (children of the same parents, excluding the person itself)
      const siblings: any[] = [];
      if (person.motherId || person.fatherId) {
        const where: any = {
          id: { not: person.id },
          OR: [],
        };
        if (person.motherId) {
          where.OR.push({ motherId: person.motherId });
        }
        if (person.fatherId) {
          where.OR.push({ fatherId: person.fatherId });
        }
        
        if (where.OR.length > 0) {
          const siblingsData = await prisma.person.findMany({
            where,
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
          });
          
          siblings.push(...siblingsData.map(s => ({
            ...s,
            id: s.id.toString(),
            originalId: s.originalId?.toString(),
          })));
        }
      }

      // Calculate age
      const age = person.birthYear && person.deathYear 
        ? person.deathYear - person.birthYear
        : person.birthYear 
        ? new Date().getFullYear() - person.birthYear
        : undefined;

      const response = {
        ...person,
        children,
        spouses,
        siblings,
        age,
      };

      res.json(convertBigIntToString(response));
    } catch (error) {
      console.error('Get person error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getByIds(req: Request, res: Response) {
    try {
      const ids = req.query.ids as string;
      if (!ids) {
        return res.status(400).json({ error: 'Ids parameter required' });
      }

      const idArray = ids.split(',').map(id => BigInt(id.trim()));
      const persons = await personService.getByIds(idArray);

      const result: any = {};
      persons.forEach(person => {
        result[person.id.toString()] = {
          firstName: person.firstName,
          lastName: person.lastName,
          portrait: person.avatarMedia?.thumbnailPath || person.avatarMedia?.filePath,
        };
      });

      res.json(convertBigIntToString(result));
    } catch (error) {
      console.error('Get persons by ids error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBirthdayToday(req: Request, res: Response) {
    try {
      const persons = await personService.getBirthdaysToday();
      
      const result = persons.map(p => ({
        ...p,
        age: p.birthYear ? new Date().getFullYear() - p.birthYear : null,
      }));
      
      res.json(convertBigIntToString(result));
    } catch (error) {
      console.error('Get birthday today error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { 
        q, 
        server, 
        firstName, 
        lastName, 
        nickName, 
        birthYear, 
        deathYear, 
        gender,
        birthPlace,
        occupation,
        note 
      } = req.query;

      // Build filters object
      const filters: any = {};
      if (firstName) filters.firstName = firstName as string;
      if (lastName) filters.lastName = lastName as string;
      if (nickName) filters.nickName = nickName as string;
      if (birthYear) filters.birthYear = birthYear as string; // Keep as string for range parsing
      if (deathYear) filters.deathYear = deathYear as string; // Keep as string for range parsing
      if (gender) filters.gender = gender as string;
      if (birthPlace) filters.birthPlace = birthPlace as string;
      if (occupation) filters.occupation = occupation as string;
      if (note) filters.note = note as string;

      // At least one search parameter is required
      if (!q && Object.keys(filters).length === 0) {
        return res.status(400).json({ error: 'At least one search parameter required' });
      }

      const persons = await personService.search(
        q as string | undefined,
        server as string | undefined,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json(convertBigIntToString(persons));
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const server = req.query.server as string | undefined;

      const result = await personService.getAll(page, limit, server);

      res.json(convertBigIntToString(result));
    } catch (error) {
      console.error('Get all persons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const person = await personService.create(req.body, userId);
      
      res.status(201).json(convertBigIntToString(person));
    } catch (error) {
      console.error('Create person error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await personService.delete(BigInt(id), userId);
      
      res.json({ message: 'Person deleted successfully' });
    } catch (error) {
      console.error('Delete person error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data = req.body;
      
      // Определяем сервер по домену запроса
      const host = req.get('x-server-host') || req.get('host') || '';
      let sourceDb: string | undefined;
      
      if (host.includes('albardaiforness')) {
        sourceDb = 'albaro';
      } else if (host.includes('alberodipreone')) {
        sourceDb = 'preone';
      } else if (host.includes('alberodiraveo')) {
        sourceDb = 'raveo';
      }
      
      // Find person by originalId or internal ID
      let personId: bigint;
      const personByOriginalId = await personService.getByOriginalId(id, sourceDb);
      if (personByOriginalId) {
        personId = personByOriginalId.id;
      } else {
        personId = BigInt(id);
      }

      const updatedPerson = await personService.update(personId, data, userId);
      
      res.json(convertBigIntToString(updatedPerson));
    } catch (error) {
      console.error('Update person error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addRelative(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { relativeId, relationType } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!relativeId || !relationType) {
        return res.status(400).json({ error: 'relativeId and relationType are required' });
      }

      // Определяем сервер по домену запроса
      const host = req.get('x-server-host') || req.get('host') || '';
      let sourceDb: string | undefined;
      
      if (host.includes('albardaiforness')) {
        sourceDb = 'albaro';
      } else if (host.includes('alberodipreone')) {
        sourceDb = 'preone';
      } else if (host.includes('alberodiraveo')) {
        sourceDb = 'raveo';
      }

      // Find person by originalId or internal ID
      let personId: bigint;
      const personByOriginalId = await personService.getByOriginalId(id, sourceDb);
      if (personByOriginalId) {
        personId = personByOriginalId.id;
      } else {
        personId = BigInt(id);
      }

      // Find relative by originalId or internal ID
      let relativeIdBigInt: bigint;
      const relativeByOriginalId = await personService.getByOriginalId(relativeId, sourceDb);
      if (relativeByOriginalId) {
        relativeIdBigInt = relativeByOriginalId.id;
      } else {
        relativeIdBigInt = BigInt(relativeId);
      }

      await personService.addRelative(personId, relativeIdBigInt, relationType, userId);
      
      res.json({ message: 'Relative added successfully' });
    } catch (error) {
      console.error('Add relative error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

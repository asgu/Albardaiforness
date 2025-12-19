import { prisma } from '../lib/prisma';
import { Person, Duplicate, DuplicateStatus, MergeStrategy } from '@prisma/client';

export class DuplicateService {
  /**
   * Calculate similarity between two persons
   */
  calculateSimilarity(person1: Person, person2: Person): { score: number; reasons: Record<string, number> } {
    let score = 0;
    let maxScore = 0;
    const reasons: Record<string, number> = {};

    // First name comparison
    if (person1.firstName && person2.firstName) {
      maxScore += 30;
      if (person1.firstName.toLowerCase() === person2.firstName.toLowerCase()) {
        score += 30;
        reasons.firstName = 1.0;
      } else if (this.levenshteinDistance(person1.firstName, person2.firstName) <= 2) {
        score += 20;
        reasons.firstName = 0.67;
      }
    }

    // Last name comparison
    if (person1.lastName && person2.lastName) {
      maxScore += 30;
      if (person1.lastName.toLowerCase() === person2.lastName.toLowerCase()) {
        score += 30;
        reasons.lastName = 1.0;
      } else if (this.levenshteinDistance(person1.lastName, person2.lastName) <= 2) {
        score += 20;
        reasons.lastName = 0.67;
      }
    }

    // Birth year comparison
    if (person1.birthYear && person2.birthYear) {
      maxScore += 20;
      if (person1.birthYear === person2.birthYear) {
        score += 20;
        reasons.birthYear = 1.0;
      } else if (Math.abs(person1.birthYear - person2.birthYear) <= 1) {
        score += 10;
        reasons.birthYear = 0.5;
      }
    }

    // Birth date comparison
    if (person1.birthDate && person2.birthDate) {
      maxScore += 10;
      if (person1.birthDate.getTime() === person2.birthDate.getTime()) {
        score += 10;
        reasons.birthDate = 1.0;
      }
    }

    // Death year comparison
    if (person1.deathYear && person2.deathYear) {
      maxScore += 10;
      if (person1.deathYear === person2.deathYear) {
        score += 10;
        reasons.deathYear = 1.0;
      }
    }

    const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
    return { score: finalScore, reasons };
  }

  /**
   * Levenshtein distance for fuzzy string matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Find potential duplicates for a person
   */
  async findDuplicates(personId: bigint, threshold: number = 70): Promise<Duplicate[]> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      throw new Error('Person not found');
    }

    // Find similar persons
    const candidates = await prisma.person.findMany({
      where: {
        id: { not: personId },
        isMerged: false,
        OR: [
          { firstName: { contains: person.firstName } },
          { lastName: { contains: person.lastName } },
        ],
      },
      take: 100,
    });

    const duplicates: Duplicate[] = [];

    for (const candidate of candidates) {
      const { score, reasons } = this.calculateSimilarity(person, candidate);
      
      if (score >= threshold) {
        // Check if duplicate already exists
        const existing = await prisma.duplicate.findFirst({
          where: {
            OR: [
              { person1Id: personId, person2Id: candidate.id },
              { person1Id: candidate.id, person2Id: personId },
            ],
          },
        });

        if (!existing) {
          const duplicate = await prisma.duplicate.create({
            data: {
              person1Id: personId,
              person2Id: candidate.id,
              similarityScore: score,
              matchReasons: reasons,
              status: DuplicateStatus.pending,
            },
          });
          duplicates.push(duplicate);
        }
      }
    }

    return duplicates;
  }

  /**
   * Get all pending duplicates
   */
  async getPendingDuplicates(): Promise<Duplicate[]> {
    return prisma.duplicate.findMany({
      where: { status: DuplicateStatus.pending },
      include: {
        person1: true,
        person2: true,
      },
      orderBy: { similarityScore: 'desc' },
    });
  }

  /**
   * Reject a duplicate
   */
  async rejectDuplicate(duplicateId: bigint, userId: number): Promise<Duplicate> {
    return prisma.duplicate.update({
      where: { id: duplicateId },
      data: {
        status: DuplicateStatus.rejected,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Merge two persons
   */
  async mergePersons(
    duplicateId: bigint,
    strategy: MergeStrategy,
    userId: number
  ): Promise<Person> {
    const duplicate = await prisma.duplicate.findUnique({
      where: { id: duplicateId },
      include: {
        person1: true,
        person2: true,
      },
    });

    if (!duplicate) {
      throw new Error('Duplicate not found');
    }

    const { person1, person2 } = duplicate;
    let targetPerson: Person;
    let sourcePerson: Person;

    // Determine which person to keep based on strategy
    if (strategy === MergeStrategy.keep_first) {
      targetPerson = person1;
      sourcePerson = person2;
    } else if (strategy === MergeStrategy.keep_second) {
      targetPerson = person2;
      sourcePerson = person1;
    } else {
      // merge_data: keep person1 as target, merge data from person2
      targetPerson = person1;
      sourcePerson = person2;
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark source as merged
      await tx.person.update({
        where: { id: sourcePerson.id },
        data: {
          isMerged: true,
          mergedIntoId: targetPerson.id,
          updatedBy: userId,
        },
      });

      // Update media references
      await tx.media.updateMany({
        where: { personId: sourcePerson.id },
        data: { personId: targetPerson.id },
      });

      // Update media_persons references
      await tx.mediaPerson.updateMany({
        where: { personId: sourcePerson.id },
        data: { personId: targetPerson.id },
      });

      // Update marriages
      await tx.marriage.updateMany({
        where: { person1Id: sourcePerson.id },
        data: { person1Id: targetPerson.id },
      });
      await tx.marriage.updateMany({
        where: { person2Id: sourcePerson.id },
        data: { person2Id: targetPerson.id },
      });

      // Update children references
      await tx.person.updateMany({
        where: { motherId: sourcePerson.id },
        data: { motherId: targetPerson.id },
      });
      await tx.person.updateMany({
        where: { fatherId: sourcePerson.id },
        data: { fatherId: targetPerson.id },
      });

      // Update duplicate status
      await tx.duplicate.update({
        where: { id: duplicateId },
        data: {
          status: DuplicateStatus.merged,
          mergeStrategy: strategy,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      // Get updated target person
      const updated = await tx.person.findUnique({
        where: { id: targetPerson.id },
      });

      return updated!;
    });

    return result;
  }
}

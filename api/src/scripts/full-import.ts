/**
 * Полный импорт всех данных из дампов
 * Порядок импорта:
 * 1. Albaro (forness) - персоны и браки
 * 2. Preone - персоны и браки
 * 3. Albaro (forness) - галерея
 * 4. Preone - галерея
 * 5. Исправление связей
 * 6. Назначение категорий для фото персон
 */

import { execSync } from 'child_process';

const steps = [
  {
    name: 'Очистка базы данных',
    command: 'npm run clear:database',
  },
  {
    name: 'Импорт персон Albaro (forness)',
    command: 'npm run migrate:albaro',
  },
  {
    name: 'Исправление связей Albaro',
    command: 'npm run fix:albaro-links-fast',
  },
  {
    name: 'Импорт персон Preone',
    command: 'npm run migrate:preone',
  },
  {
    name: 'Исправление связей Preone',
    command: 'npm run fix:parent-links',
  },
  {
    name: 'Импорт медиа Albaro (фото и файлы персон)',
    command: 'npm run migrate:media',
  },
  {
    name: 'Импорт галереи Albaro (forness)',
    command: 'npm run migrate:gallery:albaro',
  },
  {
    name: 'Импорт галереи Preone',
    command: 'npm run migrate:gallery:preone',
  },
  {
    name: 'Импорт меток на фото',
    command: 'npm run migrate:photo-tags',
  },
  {
    name: 'Установка аватаров',
    command: 'npm run set:avatars',
  },
  {
    name: 'Назначение категорий для фото персон',
    command: 'npm run assign:person-photos-category',
  },
];

async function fullImport() {
  console.log('🚀 Начало полного импорта данных\n');
  console.log(`📋 Всего шагов: ${steps.length}\n`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📌 Шаг ${i + 1}/${steps.length}: ${step.name}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      execSync(step.command, { stdio: 'inherit', cwd: process.cwd() });
      console.log(`\n✅ Шаг ${i + 1} завершён успешно`);
    } catch (error) {
      console.error(`\n❌ Ошибка на шаге ${i + 1}: ${step.name}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 Полный импорт завершён успешно!');
  console.log(`${'='.repeat(80)}\n`);
}

fullImport().catch(console.error);


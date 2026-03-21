import { db } from '@/db';
import { categories } from '@/db/schema';

const categoryNames = [
  'Cars and vehicles',
  'Comedy',
  'Education',
  'Gaming',
  'Entertainment',
  'Film and animation',
  'How-to and style',
  'Music',
  'News and politics',
  'People and animals',
  'Pets and animals',
  'Science and technology',
  'Sports',
  'Travel and events',
];

async function main() {
  console.log('Seeding categories ...');

  try {
    const values = categoryNames.map((name) => ({
      name,
      description: `Videos related to ${name.toLowerCase()}`,
    }));

    await db.insert(categories).values(values);

    console.log('Categories seed successfully!');
  } catch (error) {
    console.error('Error seeding categories: ', error);
    process.exit();
  }
}

main();

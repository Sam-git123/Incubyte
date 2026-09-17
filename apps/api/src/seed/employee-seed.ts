import {
  createSalary,
  type SupportedCurrency,
} from '../modules/salaries/salary.js';

export const DATA_SEED = 42;
export const EMPLOYEE_COUNT = 10_000;

const SEED_TIMESTAMP = new Date('2026-01-15T00:00:00.000Z');
const CURRENT_SALARY_START = new Date('2024-01-01T00:00:00.000Z');
const CURRENT_SALARY_END = new Date('2026-01-01T00:00:00.000Z');
const DAY_IN_MILLISECONDS = 86_400_000;

type JobLevel = 'associate' | 'professional' | 'senior' | 'leadership';
type SalaryBand = readonly [minimumMajor: number, maximumMajor: number];

type CountryDefinition = Readonly<{
  code: string;
  currency: SupportedCurrency;
  weight: number;
  salaryBands: Readonly<Record<JobLevel, SalaryBand>>;
}>;

type JobDefinition = Readonly<{
  title: string;
  level: JobLevel;
  weight: number;
}>;

type DepartmentDefinition = Readonly<{
  name: string;
  weight: number;
  salaryMultiplier: number;
  jobs: readonly JobDefinition[];
}>;

export const COUNTRIES = [
  {
    code: 'US',
    currency: 'USD',
    weight: 25,
    salaryBands: {
      associate: [45_000, 70_000],
      professional: [65_000, 105_000],
      senior: [95_000, 150_000],
      leadership: [125_000, 210_000],
    },
  },
  {
    code: 'IN',
    currency: 'INR',
    weight: 25,
    salaryBands: {
      associate: [700_000, 1_400_000],
      professional: [1_200_000, 2_400_000],
      senior: [2_100_000, 4_000_000],
      leadership: [3_200_000, 6_000_000],
    },
  },
  {
    code: 'AE',
    currency: 'AED',
    weight: 12,
    salaryBands: {
      associate: [120_000, 190_000],
      professional: [180_000, 300_000],
      senior: [280_000, 450_000],
      leadership: [400_000, 650_000],
    },
  },
  {
    code: 'GB',
    currency: 'GBP',
    weight: 10,
    salaryBands: {
      associate: [35_000, 52_000],
      professional: [50_000, 78_000],
      senior: [72_000, 110_000],
      leadership: [100_000, 155_000],
    },
  },
  {
    code: 'DE',
    currency: 'EUR',
    weight: 8,
    salaryBands: {
      associate: [40_000, 58_000],
      professional: [55_000, 82_000],
      senior: [78_000, 115_000],
      leadership: [105_000, 155_000],
    },
  },
  {
    code: 'SG',
    currency: 'SGD',
    weight: 7,
    salaryBands: {
      associate: [55_000, 80_000],
      professional: [75_000, 115_000],
      senior: [105_000, 155_000],
      leadership: [145_000, 220_000],
    },
  },
  {
    code: 'AU',
    currency: 'AUD',
    weight: 7,
    salaryBands: {
      associate: [65_000, 90_000],
      professional: [85_000, 125_000],
      senior: [115_000, 165_000],
      leadership: [150_000, 230_000],
    },
  },
  {
    code: 'CA',
    currency: 'CAD',
    weight: 6,
    salaryBands: {
      associate: [55_000, 78_000],
      professional: [75_000, 110_000],
      senior: [100_000, 150_000],
      leadership: [140_000, 210_000],
    },
  },
] as const satisfies readonly CountryDefinition[];

export const DEPARTMENTS = [
  {
    name: 'Engineering',
    weight: 30,
    salaryMultiplier: 1.15,
    jobs: [
      { title: 'Software Engineer', level: 'associate', weight: 40 },
      {
        title: 'Senior Software Engineer',
        level: 'professional',
        weight: 30,
      },
      { title: 'Staff Software Engineer', level: 'senior', weight: 20 },
      { title: 'Engineering Manager', level: 'leadership', weight: 10 },
    ],
  },
  {
    name: 'Sales',
    weight: 18,
    salaryMultiplier: 1,
    jobs: [
      { title: 'Sales Representative', level: 'associate', weight: 40 },
      { title: 'Account Executive', level: 'professional', weight: 30 },
      { title: 'Senior Account Executive', level: 'senior', weight: 20 },
      { title: 'Sales Manager', level: 'leadership', weight: 10 },
    ],
  },
  {
    name: 'Operations',
    weight: 14,
    salaryMultiplier: 0.9,
    jobs: [
      { title: 'Operations Analyst', level: 'associate', weight: 40 },
      {
        title: 'Operations Specialist',
        level: 'professional',
        weight: 30,
      },
      { title: 'Operations Manager', level: 'senior', weight: 20 },
      { title: 'Director of Operations', level: 'leadership', weight: 10 },
    ],
  },
  {
    name: 'Customer Success',
    weight: 12,
    salaryMultiplier: 0.86,
    jobs: [
      {
        title: 'Customer Success Associate',
        level: 'associate',
        weight: 40,
      },
      {
        title: 'Customer Success Manager',
        level: 'professional',
        weight: 30,
      },
      {
        title: 'Senior Customer Success Manager',
        level: 'senior',
        weight: 20,
      },
      {
        title: 'Customer Success Director',
        level: 'leadership',
        weight: 10,
      },
    ],
  },
  {
    name: 'Product',
    weight: 9,
    salaryMultiplier: 1.1,
    jobs: [
      { title: 'Product Analyst', level: 'associate', weight: 40 },
      { title: 'Product Manager', level: 'professional', weight: 30 },
      { title: 'Senior Product Manager', level: 'senior', weight: 20 },
      { title: 'Director of Product', level: 'leadership', weight: 10 },
    ],
  },
  {
    name: 'Finance',
    weight: 7,
    salaryMultiplier: 1,
    jobs: [
      { title: 'Financial Analyst', level: 'associate', weight: 40 },
      {
        title: 'Senior Financial Analyst',
        level: 'professional',
        weight: 30,
      },
      { title: 'Finance Manager', level: 'senior', weight: 20 },
      { title: 'Controller', level: 'leadership', weight: 10 },
    ],
  },
  {
    name: 'Marketing',
    weight: 6,
    salaryMultiplier: 0.92,
    jobs: [
      { title: 'Marketing Specialist', level: 'associate', weight: 40 },
      { title: 'Growth Manager', level: 'professional', weight: 30 },
      { title: 'Senior Marketing Manager', level: 'senior', weight: 20 },
      { title: 'Marketing Director', level: 'leadership', weight: 10 },
    ],
  },
  {
    name: 'Human Resources',
    weight: 4,
    salaryMultiplier: 0.88,
    jobs: [
      { title: 'HR Specialist', level: 'associate', weight: 40 },
      { title: 'HR Business Partner', level: 'professional', weight: 30 },
      { title: 'HR Manager', level: 'senior', weight: 20 },
      { title: 'Director of HR', level: 'leadership', weight: 10 },
    ],
  },
] as const satisfies readonly DepartmentDefinition[];

const FIRST_NAMES = [
  'Aarav',
  'Aisha',
  'Alex',
  'Amara',
  'Arjun',
  'Ava',
  'Benjamin',
  'Camila',
  'Charlotte',
  'Daniel',
  'Diego',
  'Elena',
  'Emma',
  'Ethan',
  'Fatima',
  'Grace',
  'Hana',
  'Hugo',
  'Isabella',
  'Jack',
  'James',
  'Jia',
  'Kabir',
  'Layla',
  'Liam',
  'Lucas',
  'Maya',
  'Mei',
  'Mia',
  'Mohammed',
  'Noah',
  'Olivia',
  'Priya',
  'Ravi',
  'Sofia',
  'Sophia',
  'Theo',
  'Yuki',
  'Zara',
  'Zoe',
] as const;

const LAST_NAMES = [
  'Anderson',
  'Brown',
  'Chen',
  'Clarke',
  'Davis',
  'Evans',
  'Garcia',
  'Gupta',
  'Hassan',
  'Ivanov',
  'Johnson',
  'Khan',
  'Kim',
  'Kumar',
  'Lee',
  'Lewis',
  'Martin',
  'Miller',
  'Mitchell',
  'Morgan',
  'Nguyen',
  'Patel',
  'Robinson',
  'Rossi',
  'Schmidt',
  'Shah',
  'Singh',
  'Smith',
  'Tan',
  'Taylor',
  'Thomas',
  'Thompson',
  'Walker',
  'Wang',
  'White',
  'Williams',
  'Wilson',
  'Wong',
  'Young',
  'Zhang',
] as const;

export type SeedEmployee = Readonly<{
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  department: string;
  jobTitle: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export type SeedSalaryRecord = Readonly<{
  id: string;
  employeeId: string;
  amountMinor: number;
  currency: SupportedCurrency;
  effectiveFrom: Date;
  createdAt: Date;
}>;

export type GeneratedEmployee = Readonly<{
  employee: SeedEmployee;
  salaries: readonly SeedSalaryRecord[];
}>;

type GenerateEmployeesOptions = Readonly<{
  count?: number;
  seed?: number;
}>;

export function generateEmployees({
  count = EMPLOYEE_COUNT,
  seed = DATA_SEED,
}: GenerateEmployeesOptions = {}): GeneratedEmployee[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Employee seed count must be a non-negative integer.');
  }

  const random = createSeededRandom(seed);

  return Array.from({ length: count }, (_, index) => {
    const employeeNumber = index + 1;
    const suffix = employeeNumber.toString().padStart(6, '0');
    const country = pickWeighted(COUNTRIES, random);
    const department = pickWeighted(DEPARTMENTS, random);
    const jobs: readonly JobDefinition[] = department.jobs;
    const job = pickWeighted(jobs, random);
    const firstName = pick(FIRST_NAMES, random);
    const lastName = pick(LAST_NAMES, random);
    const employeeId = `seed-employee-${suffix}`;
    const employee = {
      id: employeeId,
      employeeCode: `EMP${suffix}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${suffix}@acme.example`,
      countryCode: country.code,
      department: department.name,
      jobTitle: job.title,
      createdAt: new Date(SEED_TIMESTAMP),
      updatedAt: new Date(SEED_TIMESTAMP),
    } satisfies SeedEmployee;

    return {
      employee,
      salaries: generateSalaryHistory({
        employeeId,
        employeeSuffix: suffix,
        country,
        department,
        level: job.level,
        random,
      }),
    };
  });
}

function generateSalaryHistory({
  employeeId,
  employeeSuffix,
  country,
  department,
  level,
  random,
}: {
  employeeId: string;
  employeeSuffix: string;
  country: CountryDefinition;
  department: DepartmentDefinition;
  level: JobLevel;
  random: Random;
}): SeedSalaryRecord[] {
  const [minimumMajor, maximumMajor] = country.salaryBands[level];
  const baseMajor = randomInteger(random, minimumMajor, maximumMajor);
  const currentMajor = roundMajorUnits(baseMajor * department.salaryMultiplier);
  const historyRoll = random();
  const recordCount = historyRoll < 0.08 ? 3 : historyRoll < 0.32 ? 2 : 1;
  const amountsMajor = [currentMajor];

  while (amountsMajor.length < recordCount) {
    const laterAmount = amountsMajor[0] ?? currentMajor;
    const increaseRate = randomInteger(random, 5, 12) / 100;
    amountsMajor.unshift(roundMajorUnits(laterAmount / (1 + increaseRate)));
  }

  const currentEffectiveFrom = randomDate(
    random,
    CURRENT_SALARY_START,
    CURRENT_SALARY_END,
  );

  return amountsMajor.map((amountMajor, index) => {
    const yearsBeforeCurrent = recordCount - index - 1;
    const effectiveFrom = new Date(
      currentEffectiveFrom.getTime() -
        yearsBeforeCurrent * 365 * DAY_IN_MILLISECONDS,
    );
    const salary = createSalary({
      amountMinor: amountMajor * 100,
      currency: country.currency,
    });

    return {
      id: `seed-salary-${employeeSuffix}-${String(index + 1).padStart(2, '0')}`,
      employeeId,
      amountMinor: salary.amountMinor,
      currency: salary.currency,
      effectiveFrom,
      createdAt: new Date(SEED_TIMESTAMP),
    };
  });
}

type Weighted = Readonly<{ weight: number }>;
type Random = () => number;

function pickWeighted<const Item extends Weighted>(
  items: readonly Item[],
  random: Random,
): Item {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  let selection = random() * totalWeight;

  for (const item of items) {
    selection -= item.weight;

    if (selection < 0) {
      return item;
    }
  }

  const fallback = items.at(-1);

  if (!fallback) {
    throw new Error('Cannot select from an empty weighted collection.');
  }

  return fallback;
}

function pick<const Item>(items: readonly Item[], random: Random): Item {
  const selected = items[Math.floor(random() * items.length)];

  if (selected === undefined) {
    throw new Error('Cannot select from an empty collection.');
  }

  return selected;
}

function randomInteger(
  random: Random,
  minimum: number,
  maximum: number,
): number {
  return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}

function randomDate(random: Random, start: Date, end: Date): Date {
  const dayCount = Math.floor(
    (end.getTime() - start.getTime()) / DAY_IN_MILLISECONDS,
  );
  const dayOffset = randomInteger(random, 0, dayCount);

  return new Date(start.getTime() + dayOffset * DAY_IN_MILLISECONDS);
}

function roundMajorUnits(amount: number): number {
  return Math.max(100, Math.round(amount / 100) * 100);
}

function createSeededRandom(seed: number): Random {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

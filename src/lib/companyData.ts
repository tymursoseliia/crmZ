import type { Company } from './companyTypes';
export const companies: Company[] = [
  {
    id: 'avtopul',
    name: 'Автопул',
    website: 'https://avto-pul.ru',
    documents: [
      { name: 'Выписка из реестра', fileName: 'avtopul-registry.pdf', type: 'registry' },
      { name: 'Свидетельство о регистрации', fileName: 'avtopul-certificate.jpg', type: 'certificate' },
      { name: 'Карточка предприятия', fileName: 'КарточкаАвтопул.jpg', type: 'card' },
    ],
    contractSample: '/contracts/avtopul.pdf',
  },
  {
    id: 'elitkars',
    name: 'Элиткарс',
    documents: [
      { name: 'Выписка из реестра', fileName: 'elitkars-registry.pdf', type: 'registry' },
      { name: 'Свидетельство о регистрации', fileName: 'elitkars-certificate.jpg', type: 'certificate' },
      { name: 'Карточка предприятия', fileName: 'КарточкаЕлиткарс.jpg', type: 'card' },
    ],
    contractSample: '/contracts/elitkars.pdf',
  },
  {
    id: 'progress',
    name: 'Прогресс',
    website: 'https://progress-groups.ru',
    documents: [
      { name: 'Выписка из реестра', fileName: 'progress-registry.pdf', type: 'registry' },
      { name: 'Свидетельство о регистрации', fileName: 'progress-certificate.jpg', type: 'certificate' },
      { name: 'Карточка предприятия', fileName: 'КарточкаПрогресс.jpg', type: 'card' },
    ],
    contractSample: '/contracts/progress.pdf',
  },
  {
    id: 'transavtopskov',
    name: 'ТрансАвтоПсков',
    website: 'https://transavtopskov.ru',
    documents: [
      { name: 'Выписка из реестра', fileName: 'transavtopskov-registry.pdf', type: 'registry' },
      { name: 'Свидетельство о регистрации', fileName: 'transavtopskov-certificate.jpg', type: 'certificate' },
      { name: 'Карточка предприятия', fileName: 'КарточкаТрансавтопсков.jpg', type: 'card' },
    ],
    contractSample: '/contracts/transavtopskov.pdf',
  },
  {
    id: 'btatorg',
    name: 'Бта Торг',
    website: 'https://btatorg.ru',
    documents: [
      { name: 'Выписка из реестра', fileName: 'btatorg-registry.pdf', type: 'registry' },
      { name: 'Свидетельство о регистрации', fileName: 'btatorg-certificate.jpg', type: 'certificate' },
      { name: 'Карточка предприятия', fileName: 'КарточкаБТАТОРГ.jpg', type: 'card' },
    ],
    contractSample: '/contracts/btatorg.pdf',
  },
  {
    id: 'avtotredinvest',
    name: 'АвтоТрейдИнвест',
    website: 'https://avtotreidinvest.ru',
    documents: [
      { name: 'Выписка из реестра', fileName: 'avtotredinvest-registry.pdf', type: 'registry' },
      { name: 'Свидетельство о регистрации', fileName: 'avtotredinvest-certificate.jpg', type: 'certificate' },
      { name: 'Карточка предприятия', fileName: 'КарточкаАвтотрейдинвест.jpg', type: 'card' },
    ],
    contractSample: '/contracts/avtotredinvest.pdf',
  },
  {
    id: 'avtomig',
    name: 'Автомиг',
    documents: [],
    contractSample: '/contracts/avtomig.pdf',
  },
];

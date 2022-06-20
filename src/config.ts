import {iconsaxNames} from '@erbium/iconsax/utilities';

export const mainTabBar = [
  {
    id: 'home',
    title: 'home',
    icon: 'home-2',
  },
  {
    id: 'about',
    title: 'about',
    icon: 'info-circle',
  },
] as const;

export const financialOperationTypes = ['income', 'expenses'] as const;

export const financialCategories: financialCategory[] = [
  {name: 'salary', icon: 'wallet', type: 'income'},
  {name: 'awards', icon: 'dollar-square', type: 'income'},
  {name: 'coupons', icon: 'ticket-star', type: 'income'},
  {name: 'sale', icon: 'percentage-square', type: 'income'},
  {name: 'grants', icon: 'gift', type: 'income'},
  {name: 'other', icon: 'category-2', type: 'income'},

  {name: 'shopping', icon: 'shopping-bag', type: 'expenses'},
  {name: 'education', icon: 'teacher', type: 'expenses'},
  {name: 'gift', icon: 'gift', type: 'expenses'},
  {name: 'book', icon: 'book', type: 'expenses'},
  {name: 'social', icon: 'people', type: 'expenses'},
  {name: 'other', icon: 'category-2', type: 'expenses'},
];

export type financialCategory = {name: string; icon: iconsaxNames; type: typeof financialOperationTypes[number]};

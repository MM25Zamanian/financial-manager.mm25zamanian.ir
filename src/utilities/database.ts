import {openDB} from 'idb';

import type {financialCategory} from '../config';
import type {DBSchema} from 'idb';

export interface financialOperation {
  id?: number;
  value: number;
  type: 'income' | 'expenses';
  description: string;
  category: financialCategory;
  datetime: Date;
}

interface Database extends DBSchema {
  'financial-operation': {
    value: financialOperation;
    key: number;
    indexes: {'by-datetime': Date};
  };
}

export const dbPromise = openDB<Database>('financial-db', 1, {
  upgrade(db) {
    const financialOperationStore = db.createObjectStore('financial-operation', {keyPath: 'id', autoIncrement: true});
    financialOperationStore.createIndex('by-datetime', 'datetime');
  },
});

import { type DBSchema, openDB as idbOpenDB, type IDBPDatabase } from 'idb';
import type { Phrase, Take } from './types';

/** REQ-RC-DATA-002: IndexedDB スキーマ */
export interface RiffCardDB extends DBSchema {
  phrases: {
    key: string;
    value: Phrase;
    indexes: {
      'by-created': Date;
    };
  };
  takes: {
    key: string;
    value: Take;
    indexes: {
      'by-phrase': string;
      'by-recorded': Date;
    };
  };
}

const DB_NAME = 'riffcard-db';
const DB_VERSION = 1;

export async function openDB(name: string = DB_NAME): Promise<IDBPDatabase<RiffCardDB>> {
  return idbOpenDB<RiffCardDB>(name, DB_VERSION, {
    upgrade(db) {
      const phraseStore = db.createObjectStore('phrases', { keyPath: 'id' });
      phraseStore.createIndex('by-created', 'createdAt');

      const takeStore = db.createObjectStore('takes', { keyPath: 'id' });
      takeStore.createIndex('by-phrase', 'phraseId');
      takeStore.createIndex('by-recorded', 'recordedAt');
    },
  });
}

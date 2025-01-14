import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { get, set, del } from 'idb-keyval';


const createIndexedDBStorage = <T>() => {
  const storage = createJSONStorage<T>(() => ({
    getItem: async (key: string): Promise<string | null> => {
      try {
        const value = await get(key);
        return value ? JSON.stringify(value) : null;
      } catch (error) {
        console.error('Error reading from IndexedDB:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await set(key, JSON.parse(value));
      } catch (error) {
        console.error('Error writing to IndexedDB:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await del(key);
      } catch (error) {
        console.error('Error removing from IndexedDB:', error);
      }
    },
  }));

  return storage;
};

const createPersistedAtom = <T>(key: string, initialValue: T) => {
  const getInitialValue = async (): Promise<T> => {
    try {
      const storage = await createIndexedDBStorage();
      const item = await storage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
      return initialValue;
    } catch (error) {
      console.error('Error reading from IndexedDB:', error);
      return initialValue;
    }
  };

  const baseAtom = atom<T>(initialValue);
  
  // Create a derived atom that initializes with the stored value
  const initializedAtom = atom(
    async (get) => {
      const storedValue = await getInitialValue();
      return storedValue;
    },
    async (get, set, update) => {
      const nextValue =
        typeof update === 'function'
          ? (update as (prev: T) => T)(get(baseAtom))
          : update;
      set(baseAtom, nextValue);
      
      try {
        const storage = await createIndexedDBStorage();
        await storage.setItem(key, JSON.stringify(nextValue));
      } catch (error) {
        console.error('Error writing to IndexedDB:', error);
      }
    }
  );

  const derivedAtom = atom<T, [update: T | ((prev: T) => T)], void>(
    (get) => get(baseAtom),
    async (get, set, update) => {
      const nextValue =
        typeof update === 'function'
          ? (update as (prev: T) => T)(get(baseAtom))
          : update;
      set(baseAtom, nextValue);
      
      try {
        const storage = await createIndexedDBStorage();
        await storage.setItem(key, JSON.stringify(nextValue));
      } catch (error) {
        console.error('Error writing to IndexedDB:', error);
      }
    }
  );

  return derivedAtom;
};


export { createPersistedAtom };

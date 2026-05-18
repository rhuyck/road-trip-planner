'use client';
import { create } from 'zustand';
import { TripList, ListItem } from '@/types/trip';

interface ListsStore {
  lists: TripList[];
  loaded: boolean;

  setLists: (lists: TripList[]) => void;
  setLoaded: (v: boolean) => void;

  addList: (name: string) => string;
  deleteList: (listId: string) => void;
  renameList: (listId: string, name: string) => void;

  addItem: (listId: string, text: string) => void;
  updateItem: (listId: string, itemId: string, patch: Partial<Pick<ListItem, 'text' | 'checked'>>) => void;
  removeItem: (listId: string, itemId: string) => void;
}

export const useListsStore = create<ListsStore>()((set) => ({
  lists: [],
  loaded: false,

  setLists: (lists) => set({ lists }),
  setLoaded: (loaded) => set({ loaded }),

  addList: (name) => {
    const id = crypto.randomUUID();
    set((s) => ({ lists: [...s.lists, { id, name, items: [] }] }));
    return id;
  },

  deleteList: (listId) =>
    set((s) => ({ lists: s.lists.filter((l) => l.id !== listId) })),

  renameList: (listId, name) =>
    set((s) => ({
      lists: s.lists.map((l) => (l.id === listId ? { ...l, name } : l)),
    })),

  addItem: (listId, text) =>
    set((s) => ({
      lists: s.lists.map((l) => {
        if (l.id !== listId) return l;
        const item: ListItem = {
          id: crypto.randomUUID(),
          text,
          checked: false,
          order: l.items.length,
        };
        return { ...l, items: [...l.items, item] };
      }),
    })),

  updateItem: (listId, itemId, patch) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id !== listId
          ? l
          : { ...l, items: l.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) }
      ),
    })),

  removeItem: (listId, itemId) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id !== listId ? l : { ...l, items: l.items.filter((item) => item.id !== itemId) }
      ),
    })),
}));

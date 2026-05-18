'use client';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Plus, Trash2, CheckSquare, Square, List, Pencil, Check } from 'lucide-react';
import { useListsStore } from '@/store/listsStore';
import { TripList } from '@/types/trip';

interface Props {
  isGuest: boolean;
  onClose: () => void;
}

export function ListsModal({ isGuest, onClose }: Props) {
  const lists = useListsStore((s) => s.lists);
  const addList = useListsStore((s) => s.addList);
  const deleteList = useListsStore((s) => s.deleteList);
  const renameList = useListsStore((s) => s.renameList);
  const addItem = useListsStore((s) => s.addItem);
  const updateItem = useListsStore((s) => s.updateItem);
  const removeItem = useListsStore((s) => s.removeItem);

  const [selectedId, setSelectedId] = useState<string | null>(() => lists[0]?.id ?? null);
  const [newListName, setNewListName] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const newListInputRef = useRef<HTMLInputElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const selectedList: TripList | undefined = lists.find((l) => l.id === selectedId) ?? lists[0];

  // Keep selectedId in sync if the selected list is deleted
  useEffect(() => {
    if (selectedId && !lists.find((l) => l.id === selectedId)) {
      setSelectedId(lists[0]?.id ?? null);
    }
  }, [lists, selectedId]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  function handleCreateList() {
    const name = newListName.trim();
    if (!name) return;
    const id = addList(name);
    setSelectedId(id);
    setNewListName('');
  }

  function handleNewListKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleCreateList();
  }

  function handleAddItem() {
    if (!selectedList || !newItemText.trim()) return;
    addItem(selectedList.id, newItemText.trim());
    setNewItemText('');
    newItemInputRef.current?.focus();
  }

  function handleNewItemKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAddItem();
  }

  function startRename(list: TripList) {
    setRenamingId(list.id);
    setRenameValue(list.name);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      renameList(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  function handleRenameKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setRenamingId(null);
  }

  function handleDeleteList(id: string) {
    if (confirmDeleteId === id) {
      deleteList(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }

  const checkedCount = selectedList?.items.filter((i) => i.checked).length ?? 0;
  const totalCount = selectedList?.items.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(640px, 90vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <List size={18} className="text-stone-900 dark:text-white" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Lists</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left panel: list of lists */}
          <div className="w-48 flex-shrink-0 border-r border-stone-200 dark:border-gray-700 flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {lists.length === 0 && (
                <p className="text-xs text-stone-400 dark:text-gray-500 px-2 py-3 text-center">No lists yet</p>
              )}
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                    selectedList?.id === list.id
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200'
                      : 'hover:bg-stone-100 dark:hover:bg-gray-700 text-stone-700 dark:text-gray-300'
                  }`}
                  onClick={() => { setSelectedId(list.id); setConfirmDeleteId(null); }}
                >
                  {renamingId === list.id ? (
                    <input
                      ref={renameInputRef}
                      className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-amber-400"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={handleRenameKey}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 min-w-0 text-sm truncate">{list.name}</span>
                  )}

                  {!isGuest && renamingId !== list.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(list); }}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 dark:hover:text-gray-200 transition-opacity flex-shrink-0"
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* New list input */}
            {!isGuest && (
              <div className="p-2 border-t border-stone-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-1">
                  <input
                    ref={newListInputRef}
                    className="flex-1 min-w-0 text-xs bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded px-2 py-1.5 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    placeholder="New list…"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={handleNewListKey}
                  />
                  <button
                    onClick={handleCreateList}
                    disabled={!newListName.trim()}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded transition-colors"
                    title="Create list"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: selected list items */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedList ? (
              <div className="flex-1 flex items-center justify-center text-stone-400 dark:text-gray-500 text-sm">
                {isGuest ? 'No lists available' : 'Create a list to get started'}
              </div>
            ) : (
              <>
                {/* List header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-gray-700 flex-shrink-0">
                  <div>
                    <div className="font-semibold text-stone-900 dark:text-white text-sm">{selectedList.name}</div>
                    {totalCount > 0 && (
                      <div className="text-xs text-stone-400 dark:text-gray-500 mt-0.5">
                        {checkedCount}/{totalCount} done
                      </div>
                    )}
                  </div>
                  {!isGuest && (
                    <button
                      onClick={() => handleDeleteList(selectedList.id)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                        confirmDeleteId === selectedList.id
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'text-stone-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-gray-700'
                      }`}
                      title="Delete list"
                    >
                      <Trash2 size={13} />
                      <span>{confirmDeleteId === selectedList.id ? 'Confirm delete' : 'Delete list'}</span>
                    </button>
                  )}
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {selectedList.items.length === 0 && (
                    <p className="text-xs text-stone-400 dark:text-gray-500 text-center py-6">
                      {isGuest ? 'Empty list' : 'No items yet — add one below'}
                    </p>
                  )}
                  {selectedList.items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <button
                        onClick={() => !isGuest && updateItem(selectedList.id, item.id, { checked: !item.checked })}
                        className={`flex-shrink-0 transition-colors ${
                          item.checked
                            ? 'text-emerald-500'
                            : 'text-stone-300 dark:text-gray-600 hover:text-stone-500 dark:hover:text-gray-400'
                        } ${isGuest ? 'cursor-default' : 'cursor-pointer'}`}
                        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
                      >
                        {item.checked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <span
                        className={`flex-1 text-sm ${
                          item.checked
                            ? 'line-through text-stone-400 dark:text-gray-500'
                            : 'text-stone-800 dark:text-gray-200'
                        }`}
                      >
                        {item.text}
                      </span>

                      {!isGuest && (
                        <button
                          onClick={() => removeItem(selectedList.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-stone-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                          aria-label="Remove item"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add item row */}
                {!isGuest && (
                  <div className="p-3 border-t border-stone-100 dark:border-gray-700 flex gap-2 flex-shrink-0">
                    <input
                      ref={newItemInputRef}
                      className="flex-1 bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400"
                      placeholder="Add item…"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={handleNewItemKey}
                    />
                    <button
                      onClick={handleAddItem}
                      disabled={!newItemText.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                    >
                      <Plus size={15} />
                      Add
                    </button>
                  </div>
                )}

                {/* Bulk clear checked */}
                {!isGuest && checkedCount > 0 && (
                  <div className="px-3 pb-3 flex-shrink-0">
                    <button
                      onClick={() => {
                        selectedList.items
                          .filter((i) => i.checked)
                          .forEach((i) => removeItem(selectedList.id, i.id));
                      }}
                      className="w-full text-xs text-stone-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={12} />
                      Clear {checkedCount} checked item{checkedCount !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

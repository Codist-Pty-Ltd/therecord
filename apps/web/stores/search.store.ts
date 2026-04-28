import { create } from "zustand";

interface SearchOverlayState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Controls the full-screen {@link GlobalSearch} overlay.
 * Used from the header button and document-level keyboard shortcuts.
 */
export const useSearchOverlayStore = create<SearchOverlayState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

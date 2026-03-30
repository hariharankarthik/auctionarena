import { create } from "zustand";

type State = {
  bidIncrement: number;
  setBidIncrement: (n: number) => void;
};

export const useAuctionUi = create<State>((set) => ({
  bidIncrement: 20,
  setBidIncrement: (bidIncrement) => set({ bidIncrement }),
}));

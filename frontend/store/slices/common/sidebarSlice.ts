// src/store/slices/SidebarSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface sidebarState {
  isOpen: boolean;
}

const initialState: sidebarState = {
  isOpen: true,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { toggleSidebar } = sidebarSlice.actions;

export default sidebarSlice.reducer;

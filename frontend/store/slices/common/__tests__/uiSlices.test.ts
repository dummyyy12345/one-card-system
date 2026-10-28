import sidebarReducer, { toggleSidebar } from "../sidebarSlice";
import modalReducer, {
  closeModal,
  openModal,
  toggleModal,
} from "../modalSlice";

it("toggles the sidebar state", () => {
  const initial = sidebarReducer(undefined, { type: "@@init" });

  expect(initial.isOpen).toBe(true);
  expect(sidebarReducer(initial, toggleSidebar()).isOpen).toBe(false);
  expect(sidebarReducer(initial, toggleSidebar()).isOpen).toBe(false);
});

it("opens, closes, and toggles the modal state", () => {
  const initial = modalReducer(undefined, { type: "@@init" });

  expect(initial.isOpen).toBe(false);
  expect(modalReducer(initial, openModal()).isOpen).toBe(true);
  expect(modalReducer(initial, closeModal()).isOpen).toBe(false);
  expect(modalReducer(initial, toggleModal()).isOpen).toBe(true);
});

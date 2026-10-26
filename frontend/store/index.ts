import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  persistStore,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import modalSlice from "./slices/common/modalSlice";
import sidebarSlice from "./slices/common/sidebarSlice";
import authReducer from "./slices/common/authSlice";
import roleReducer from "./slices/adminSlice/role";
import userReducer from "./slices/adminSlice/user";
import permissionReducer from "./slices/adminSlice/permission";
import rolePermissionReducer from "./slices/adminSlice/rolepermission";
import userPermissionReducer from "./slices/adminSlice/userpermission";
import deviceReducer from "./slices/adminSlice/device";
import studentReducer from "./slices/registrarSlice/students";
import gateStudentReducer from "./slices/gateSlice/gateStudent";

const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: number) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const rootReducer = combineReducers({
  modal: modalSlice,
  sidebar: sidebarSlice,
  auth: authReducer,
  role: roleReducer,
  user: userReducer,
  permission: permissionReducer,
  rolePermission: rolePermissionReducer,
  userPermission: userPermissionReducer,
  device: deviceReducer,
  student: studentReducer,
  gateStudent: gateStudentReducer,
});
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

export default store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

import { configureStore } from "@reduxjs/toolkit";
import resumeReducer from "@/condidat/resume/lib/redux/resumeSlice";
import settingsReducer from "@/condidat/resume/lib/redux/settingsSlice";

export const store = configureStore({
  reducer: {
    resume: resumeReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/lib/api/farmnomad";

export function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (gDM) =>
      // Product photos travel as File objects in the mutation arguments, which Redux's
      // "everything must be plain data" check would warn about. Skip the check for those only.
      gDM({
        serializableCheck: {
          ignoredActionPaths: ["meta.arg", "meta.baseQueryMeta"],
          ignoredPaths: [/^api\.mutations\..*\.originalArgs/],
        },
      }).concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;

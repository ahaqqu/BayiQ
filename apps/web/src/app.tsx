import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StoreCtx } from "./lib/store";
import { Loading, useStoreInit } from "./components";
import { router } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export function App() {
  const store = useStoreInit();

  if (!store) {
    return <Loading />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StoreCtx.Provider value={store}>
        <RouterProvider router={router} />
      </StoreCtx.Provider>
    </QueryClientProvider>
  );
}

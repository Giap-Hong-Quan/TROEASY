import { RouterProvider } from "react-router-dom";
import router from "./routers/router.jsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./hook/queryClient.ts";

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </QueryClientProvider>
    );
}

export default App;

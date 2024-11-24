import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { Toaster } from "./components/ui/toaster";

export default function App() {
    return (

        
            <RouterProvider router={router} />
    )
}

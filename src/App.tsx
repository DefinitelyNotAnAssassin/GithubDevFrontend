import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { ThemeProvider } from "./contexts/ThemeContext";
export default function App() {
    return (
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
    )
}

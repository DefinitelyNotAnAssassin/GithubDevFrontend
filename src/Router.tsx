import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import UserInformationPage from "./pages/UserInformationPage";
import LeaderboardPage from "./pages/Leaderboard";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LandingPage />,
      
    },
    {
        path: "/user/:username",    
        element: <UserInformationPage />, 
    },
    {
        path: "/leaderboard",
        element: <LeaderboardPage />,
    }

])

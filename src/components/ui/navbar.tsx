'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Menu, Sun, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from '@/contexts/ThemeContext'

const links = [ 
    { name: 'Home', path: '/' },    
    { name: 'Leaderboard', path: '/leaderboard' },
]

export default function Navbar({ isTransparent = false }) {
    const [isDarkTheme, setIsDarkTheme] = useState(false)
    const { theme, toggleTheme } = useTheme()   
    useEffect(() => {
        setIsDarkTheme(theme === 'dark')
    }, [theme])
    




    return (
        <header className={`px-4 lg:px-6 h-16 flex items-center justify-between ${isTransparent ? 'bg-transparent absolute w-full text-white' : 'bg-white shadow-md'} ${isDarkTheme ? 'dark' : ''}`}>
            <Link className="flex items-center justify-center" to="/">
                <BookOpen className="h-6 w-6 mr-2" />
                <span className="font-bold">Github Dev</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
                <nav className="flex gap-4 sm:gap-6">
                    {links.map((link) => (
                        <Link key={link.name} to={link.path} className="text-lg font-semibold hover:underline underline-offset-4">
                            {link.name}
                        </Link>
                    ))}
                </nav>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {isDarkTheme ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <nav className="flex flex-col gap-4">
                        {links.map((link) => (
                            <Link key={link.name} to={link.path} className="text-sm font-medium hover:underline underline-offset-4">
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="mt-4">
                        {isDarkTheme ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </SheetContent>
            </Sheet>
        </header>
    )
}
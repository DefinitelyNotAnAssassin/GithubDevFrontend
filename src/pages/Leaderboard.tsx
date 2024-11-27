'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { API_URL } from '@/constants/UrlConstant'
import Navbar from '@/components/ui/navbar'
import { Link } from 'react-router-dom'

interface UserRecord {
    id: number
    username: string
    lines_of_code: number
    date_requested: string
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<UserRecord[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboardData(currentPage)
    }, [currentPage])

    const fetchLeaderboardData = async (page: number) => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/getLeaderboard?page=${page}`)
            const data = await response.json()
            setUsers(data.users)
            setTotalPages(Math.ceil(data.count / 20))
            setIsLoading(false)
        } catch (error) {
            console.error('Error fetching leaderboard data:', error)
            setIsLoading(false)
        }
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        window.history.pushState(null, '', `/leaderboard?page=${newPage}`)
    }

    return (
        <>
            <Navbar isTransparent />
            <div className="min-h-screen bg-gray-900 dark:bg-[#101010] text-white p-8 py-24">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                        Github Dev Leaderboard
                    </h1>

                    <Card className="bg-gray-800 text-white">
                        <CardHeader>
                            <CardTitle>Top Developers by Lines of Code</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Rank</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Total Lines of Code</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user, index) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{(currentPage - 1) * 20 + index + 1}</TableCell>
                                                <TableCell><Link to = {`https://github.com/${user.username}`} >{user.username}</Link></TableCell>
                                                <TableCell>{user.lines_of_code.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center space-x-2 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    )
}

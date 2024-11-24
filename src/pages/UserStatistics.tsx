'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { API_URL } from "@/constants/UrlConstant"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts"
import { RefreshCw, Star, GitFork, Users, Code, Clock, Activity, Calendar } from 'lucide-react'
import { Link } from "react-router-dom"
import Navbar from "@/components/ui/navbar"

interface UserStats {
  login: string
  name: string
  avatar_url: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

interface RepoStats {
  totalStars: number
  totalForks: number
  topLanguages: { name: string; count: number }[]
  repoSizes: { name: string; size: number }[]
}

interface CommitStats {
  totalCommits: number
  commitActivity: { week: string; count: number }[]
}

interface EventStats {
  eventCounts: { [key: string]: number }
  recentEvents: { date: string; count: number }[]
}

interface CachedData {
  timestamp: number
  userStats: UserStats
  repoStats: RepoStats
  commitStats: CommitStats
  eventStats: EventStats
}

const STORAGE_KEY = 'github_user_statistics'
const EXPIRATION_TIME = 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds

export default function UserStatisticsPage() {
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null)
  const [commitStats, setCommitStats] = useState<CommitStats | null>(null)
  const [eventStats, setEventStats] = useState<EventStats | null>(null)
  const username = window.location.pathname.split('/').pop() 


  const fetchData = async () => {
    setLoading(true)
    const headers = {
      'Authorization': 'token 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'
    }

    try {
      // Fetch user data
      const userRes = await fetch(`${API_URL}/users/${username}`, { headers })
      const userData: UserStats = await userRes.json()

      // Fetch repositories
      const reposRes = await fetch(`${API_URL}/users/${username}/repos?per_page=100`, { headers })
      const reposData = await reposRes.json()

      // Calculate repository statistics
      const repoStats: RepoStats = {
        totalStars: reposData.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0),
        totalForks: reposData.reduce((sum: number, repo: any) => sum + repo.forks_count, 0),
        topLanguages: Object.entries(
          reposData.reduce((acc: { [key: string]: number }, repo: any) => {
            if (repo.language) {
              acc[repo.language] = (acc[repo.language] || 0) + 1
            }
            return acc
          }, {})
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count })),
        repoSizes: reposData
          .sort((a: any, b: any) => b.size - a.size)
          .slice(0, 5)
          .map((repo: any) => ({ name: repo.name, size: repo.size }))
      }

      // Fetch commit activity for the user's most popular repository
      const topRepo = reposData.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)[0]
      const commitRes = await fetch(`${API_URL}/repos/${username}/${topRepo.name}/stats/commit_activity`, { headers })
      const commitData = await commitRes.json()

      const commitStats: CommitStats = {
        totalCommits: commitData.reduce((sum: number, week: any) => sum + week.total, 0),
        commitActivity: commitData.slice(-12).map((week: any, index: number) => ({
          week: `Week ${index + 1}`,
          count: week.total
        }))
      }

      // Fetch recent events
      const eventsRes = await fetch(`${API_URL}/users/${username}/events?per_page=100`, { headers })
      const eventsData = await eventsRes.json()

      const eventStats: EventStats = {
        eventCounts: eventsData.reduce((acc: { [key: string]: number }, event: any) => {
          acc[event.type] = (acc[event.type] || 0) + 1
          return acc
        }, {}),
        recentEvents: eventsData
          .slice(0, 30)
          .reduce((acc: { [key: string]: number }, event: any) => {
            const date = new Date(event.created_at).toISOString().split('T')[0]
            acc[date] = (acc[date] || 0) + 1
            return acc
          }, {})
      }

      // Convert recentEvents object to array and sort by date
      eventStats.recentEvents = Object.entries(eventStats.recentEvents)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setUserStats(userData)
      setRepoStats(repoStats)
      setCommitStats(commitStats)
      setEventStats(eventStats)

      // Cache the data
      const cachedData: CachedData = {
        timestamp: Date.now(),
        userStats: userData,
        repoStats,
        commitStats,
        eventStats
      }
      localStorage.setItem(`${STORAGE_KEY}_${username}`, JSON.stringify(cachedData))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCachedData = () => {
    const cachedData = localStorage.getItem(`${STORAGE_KEY}_${username}`)
    if (cachedData) {
      const parsedData: CachedData = JSON.parse(cachedData)
      if (Date.now() - parsedData.timestamp < EXPIRATION_TIME) {
        setUserStats(parsedData.userStats)
        setRepoStats(parsedData.repoStats)
        setCommitStats(parsedData.commitStats)
        setEventStats(parsedData.eventStats)
        setLoading(false)
        return true
      }
    }
    return false
  }

  useEffect(() => {
    if (!loadCachedData()) {
      fetchData()
    }
  }, [username])

  const handleRefresh = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#101010]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-white text-2xl"
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  if (!userStats) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#101010]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-white text-2xl"
        >
          User not found
        </motion.div>

        <Link to="/" className="text-blue-500 hover:underline mt-4">
            Go back to home
        </Link>
      </div>
    )
  }

  return (

    <>
    
    <Navbar isTransparent />
    
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-[#101010] p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">GitHub Statistics</h1>
          <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={userStats.avatar_url} alt={userStats.name || userStats.login} />
              <AvatarFallback>{userStats.login.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl mb-1">{userStats.name || userStats.login}</CardTitle>
              <Badge variant="secondary" className="text-sm">@{userStats.login}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.public_repos}</div>
              <div className="text-sm text-gray-400">Repositories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.followers}</div>
              <div className="text-sm text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.following}</div>
              <div className="text-sm text-gray-400">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{new Date(userStats.created_at).getFullYear()}</div>
              <div className="text-sm text-gray-400">Joined</div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="repos">Repositories</TabsTrigger>
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Total Stars
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{repoStats?.totalStars}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitFork className="w-5 h-5" />
                    Total Forks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{repoStats?.totalForks}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Top Languages
                </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Repositories",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[200px]"
                  >
                    <BarChart data={repoStats?.topLanguages || []}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Largest Repositories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      size: {
                        label: "Size (KB)",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[200px]"
                  >
                    <BarChart data={repoStats?.repoSizes || []}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="size" fill="var(--color-size)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="repos">
            <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Repository Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Repositories",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={repoStats?.topLanguages || []}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commits">
            <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Commit Activity (Last 12 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Commits",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={commitStats?.commitActivity || []}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Events",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <LineChart data={eventStats?.recentEvents || []}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="var(--color-count)" />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-[#1c1c1c] text-white border-none shadow-xl">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Account Information

    </CardTitle>
  </CardHeader>
  <CardContent className="grid gap-4 md:grid-cols-2">
    <Card className="bg-[#2a2a2a] text-white border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Account Age
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          {Math.floor(
            (Date.now() - new Date(userStats.created_at).getTime()) /
              (1000 * 60 * 60 * 24 * 365)
          )}{" "}
          years
        </p>
      </CardContent>
    </Card>

    <Card className="bg-[#2a2a2a] text-white border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Stars Received
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{repoStats?.totalStars}</p>
      </CardContent>
    </Card>



    <Card className="bg-[#2a2a2a] text-white border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Pull Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{eventStats?.eventCounts.PullRequest || 0}</p>
      </CardContent>
    </Card>

    <Card className="bg-[#2a2a2a] text-white border-none md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
                Starred Repositories 
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside">
          {repoStats?.repoSizes.map((repo: any) => (
            <li key={repo.id}>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {repo.name}
              </a>{" "}
              - ⭐{repo.stargazers_count}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  </CardContent>
</Card>
      </motion.div>
    </div>

    </>
    
  )
}
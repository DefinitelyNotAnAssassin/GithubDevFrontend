'use client'

import { useEffect, useState } from "react"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Book, Code, FileText, Loader, RefreshCcw} from 'lucide-react'
import { API_URL, WEBSOCKET_URL } from "@/constants/UrlConstant"
import Navbar from "@/components/ui/navbar"
import { Progress } from "@/components/ui/progress"

type LanguageData = {
  [key: string]: number
}

type ChartData = {
  language: string
  lines: number
}

type GitHubUser = {
  name: string
  avatar_url: string
  bio: string
  public_repos: number
  followers: number
  following: number
}

export default function EnhancedDeveloperStatsPage() {
  const username = typeof window !== 'undefined' ? window.location.pathname.split("/")[2] : ''
  const [linesOfCode, setLinesOfCode] = useState<number>(0)
  const [linesOfCodePerLanguage, setLinesOfCodePerLanguage] = useState<LanguageData>({})
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentRepo, setCurrentRepo] = useState('')
  const [progress, setProgress] = useState(0)
  const [totalRepos, setTotalRepos] = useState(0)
  const [processedRepos, setProcessedRepos] = useState(0)

  useEffect(() => {
    const searchData = window.localStorage.getItem('searchData');
    const ignore_dirs = searchData ? JSON.parse(searchData).ignore_dirs : "";
    const ignore_extensions = searchData ? JSON.parse(searchData).ignore_extensions : "";

    const socket = new WebSocket(`${WEBSOCKET_URL}/getLinesOfCode/${username}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        username,
        ignore_dirs,
        ignore_extensions
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setCurrentRepo(data.repo);
        setProcessedRepos(data.processedRepos);
        setTotalRepos(data.totalRepos);
        setProgress((data.processedRepos / data.totalRepos) * 100);
      } else if (data.type === 'result') {
        setLinesOfCode(data.total_lines_of_code);
        setLinesOfCodePerLanguage(data.lines_of_code_per_language);
      } else if (data.type === 'complete') {
        setIsLoading(false);
        socket.close();
      } else if (data.type === 'error') {
        console.error(data.message);
        setIsLoading(false);
        socket.close();
      } else if (data.type === 'heartbeat') {
        socket.send(JSON.stringify({ type: 'heartbeat_response' }));
      }
    };

    const handleBeforeUnload = () => {
      socket.send(JSON.stringify({ type: 'close' }));
      socket.close();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

  }, [username]);

  useEffect(() => {
    const excludedExtensions = ['.log', '.gitignore', '.gitattributes', '.png', '.jpg']
    const filteredData = Object.entries(linesOfCodePerLanguage)
      .filter(([ext]) => !excludedExtensions.includes(ext))
      .map(([language, lines]) => ({
        language: language.replace('.', ''),
        lines
      }))
      .sort((a, b) => b.lines - a.lines)

    setChartData(filteredData.slice(0, 10))
  }, [linesOfCodePerLanguage])

  useEffect(() => {
    fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': 'token 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'
      }
    })
      .then(response => response.json())
      .then(data => setGithubUser(data))
      .catch(error => console.error('Error fetching GitHub user:', error))
  }, [username])

  useEffect(() => {
    document.title = `Developer Stats for ${username} | Github Dev`
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Developer stats for ${username} on Github Dev`)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `Developer Stats for ${username} | Github Dev`)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', `Developer stats for ${username} on Github Dev`)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', window.location.href)
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', githubUser?.avatar_url || '')
    document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content', `${username}'s avatar`)
  }, [username, githubUser])

  const totalLines = chartData.reduce((sum, item) => sum + item.lines, 0)

  const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7FFF7', '#FF9FF3', '#FAF3DD', '#C7CEEA', '#E2F0CB'
  ]

  const shakespeareEquivalent = Math.round(linesOfCode / 884647)
  const novelEquivalent = Math.round(linesOfCode / 50000)
  const harryPotterEquivalent = Math.round(linesOfCode / 1090736)
  const totalCharacters = linesOfCode * 60 
  const totalWords = totalCharacters / 5

  const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
    <Card className=" text-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="text-3xl flex justify-center items-center">
        <div className="font-bold">{value}</div>
      </CardContent>
    </Card>

  )

  const refreshAccountData = () => {
    setIsLoading(true)
    setProgress(0)
    setProcessedRepos(0)
    setTotalRepos(0)
    setCurrentRepo('')
    setLinesOfCode(0)
    setLinesOfCodePerLanguage({})
    setChartData([])
  
    const searchData = window.localStorage.getItem('searchData') 
    const ignore_dirs = searchData ? JSON.parse(searchData).ignore_dirs :  ""
    const ignore_extensions = searchData ? JSON.parse(searchData).ignore_extensions : ""
    const eventSource = new EventSource(`${API_URL}/getLinesOfCode/${username}?ignore_dirs=${ignore_dirs}&ignore_extensions=${ignore_extensions}`)
  
    fetch(`${API_URL}/refreshAccountData/${username}`)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'progress') {
      setCurrentRepo(data.repo) 
      setProcessedRepos(data.processedRepos)
      setTotalRepos(data.totalRepos)
      setProgress((data.processedRepos / data.totalRepos) * 100)
      } else if (data.type === 'result') {
      setLinesOfCode(data.total_lines_of_code)
      setLinesOfCodePerLanguage(data.lines_of_code_per_language)
      } else if (data.type === 'complete') {
      setIsLoading(false)
      eventSource.close()
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error)
      setIsLoading(false)
      eventSource.close()
    }
    
    return () => {
      eventSource.close()
    }
  }

  return (
    <>
      <Navbar isTransparent/>
      <div className="min-h-screen bg-gray-900 dark:bg-[#101010] text-white p-8 py-12">
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              key="loading"
              className="min-h-screen w-full flex flex-col justify-center items-center py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-4xl font-semibold mb-8">Analyzing Repositories</h1>
              <div className="w-full max-w-md mb-4">
                <Progress value={progress} className="[&>*]:bg-white w-full" />
              </div>
              <p className="text-xl mb-2">
                {currentRepo ? `Current: ${currentRepo}` : 'Preparing...'}
              </p>
              <p className="text-lg mb-4">
                Processed: {processedRepos} / {totalRepos} repositories
              </p>  
              <div className="flex items-center text-blue-400">
                <Loader className="animate-spin mr-2" />
                <span>This may take a while. Only the first 100 repositories and under 150mb will be analyzed.</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                Developer Stats for {username}
              </h1>


              <div>
                {githubUser && (
                  <Card className="col-span-full lg:col-span-1 my-8">
                    <CardContent className="flex flex-col items-center pt-6">
                      <Avatar className="w-24 h-24 mb-4">
                      <AvatarImage src={githubUser.avatar_url} alt={githubUser.name} />
                      </Avatar>

                      <div className = "flex items-center gap-2 cursor-pointer">
                          <h2 className="text-2xl font-bold mb-2">{githubUser.name}</h2>
                      </div>
                       
                     
                      <p className="text-gray-400 mb-4 text-center">{githubUser.bio}</p>
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <p className="font-bold">{githubUser.public_repos}</p>
                          <p className="text-sm text-gray-400">Repos</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{githubUser.followers}</p>
                          <p className="text-sm text-gray-400">Followers</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{githubUser.following}</p>
                          <p className="text-sm text-gray-400">Following</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                <StatCard title="Total Lines of Code" value={linesOfCode.toLocaleString()} icon={Code} />
                <StatCard title="Total Characters (Approx.)" value={`${totalCharacters.toLocaleString()} Characters`} icon={Book} />
                <StatCard title="Total Words (Approx.)" value={`${totalWords.toLocaleString()} Words`} icon={Book} />
                <StatCard title="Shakespeare Equivalent" value={`${shakespeareEquivalent} Hamlet${shakespeareEquivalent !== 1 ? 's' : ''}`} icon={Book} />
                <StatCard title="Novel Equivalent" value={`${novelEquivalent} Novel${novelEquivalent !== 1 ? 's' : ''}`} icon={FileText} />
                <StatCard title="Harry Potter Series Equivalent" value={`${harryPotterEquivalent} Series`} icon={Book} />
              </div>

              <div className="grid grid-cols-1 gap-8 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-white font-semibold">Top 10 Languages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                          <XAxis type="number" />
                          <YAxis dataKey="language" type="category" />
                          <Tooltip />
                          <Bar dataKey="lines" fill="var(--color-lines)">
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Language Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chartData.map((lang, index) => (
                      <motion.div 
                        key={lang.language} 
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <span className="w-24 font-medium">{lang.language}:</span>
                        <div className="flex-1 bg-gray-700 h-4 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(lang.lines / totalLines) * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          ></motion.div>
                        </div>
                        <span className="ml-4 w-20 text-right">{((lang.lines / totalLines) * 100).toFixed(2)}%</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

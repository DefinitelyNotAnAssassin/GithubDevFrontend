'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Github, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_URL } from '@/constants/UrlConstant'
import Navbar from '@/components/ui/navbar'
import { Badge } from "@/components/ui/badge"
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

interface SearchOptions {
  ignore_dirs: string[];
  ignore_extensions: string[];
}

export default function LandingPage() {
  const [username, setUsername] = useState('')
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({ ignore_dirs: [], ignore_extensions: [] })
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [activeTab, setActiveTab] = useState<'ignore_dirs' | 'ignore_extensions'>('ignore_dirs')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSearchOptions = async () => {
      try {
        const storedSearchData = window.localStorage.getItem('searchData')
        if (storedSearchData) {
          const parsedData = JSON.parse(storedSearchData)
          setSearchOptions({
            ignore_dirs: parsedData.ignore_dirs || [],
            ignore_extensions: parsedData.ignore_extensions || []
          })
        } else {
          const response = await fetch(`${API_URL}/getExtensions`)
          const data = await response.json()
          setSearchOptions(data)
        }
      } catch (error) {
        console.error('Failed to fetch search options:', error)
        toast({
          title: "Error",
          description: "Failed to fetch search options. Please try again later.",
          variant: "destructive",
        })
      }
    }

    fetchSearchOptions()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      const searchData = {
        username,
        ignore_dirs: searchOptions.ignore_dirs.length ? searchOptions.ignore_dirs : ['None'],
        ignore_extensions: searchOptions.ignore_extensions.length ? searchOptions.ignore_extensions : ['None']
      }
      window.localStorage.setItem('searchData', JSON.stringify(searchData))
      navigate(`/user/${username}`)
    }
  }

  const addItem = (type: 'ignore_dirs' | 'ignore_extensions') => {
    if (newItem.trim()) {
      setSearchOptions(prev => ({
        ...prev,
        [type]: [...prev[type], newItem.trim()]
      }))
      setNewItem('')
    }
  }

  const removeItem = (type: 'ignore_dirs' | 'ignore_extensions', item: string) => {
    setSearchOptions(prev => ({
      ...prev,
      [type]: prev[type].filter(i => i !== item)
    }))
  }

  const clearAll = (type: 'ignore_dirs' | 'ignore_extensions') => {
    setSearchOptions(prev => ({
      ...prev,
      [type]: []
    }))
  }

  const toggleOption = (type: 'ignore_dirs' | 'ignore_extensions', value: string) => {
    setSearchOptions(prev => {
      const newOptions = { ...prev }
      const index = newOptions[type].indexOf(value)
      if (index > -1) {
        newOptions[type] = newOptions[type].filter(item => item !== value)
      } else {
        newOptions[type] = [...newOptions[type], value]
      }
      return newOptions
    })
  }

  return (
    <>
      <Navbar isTransparent />
      <div className="h-screen w-full flex flex-col justify-center items-center bg-gray-900 dark:bg-[#101010] p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="inline-block"
          >
            <Github className="w-20 h-20 text-white mb-4" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-6xl font-semibold text-white mb-2"
          >
            Github Dev
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-white"
          >
            Discover your total lines of code 
          </motion.p>
        </motion.div>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter GitHub username"
              value={username}
              name="github_username"
              autoComplete='on'
              onChange={(e) => setUsername(e.target.value)}
              className="flex-grow text-white"
            />
            <Button type="submit" className="bg-white text-[#101010] hover:bg-gray-200">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isCustomizeOpen ? 'auto' : 0, opacity: isCustomizeOpen ? 1 : 0, display: isCustomizeOpen ? 'block' : 'none' }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800 p-4 rounded-md">
              <h2 className="text-white font-semibold mb-2">Customize Search</h2>
              <div className="flex mb-4">
                <Button
                  onClick={() => setActiveTab('ignore_dirs')}
                  className={`mr-2 ${activeTab === 'ignore_dirs' ? 'bg-primary' : 'bg-gray-700'}`}
                >
                  Ignore Directories
                </Button>
                <Button
                  onClick={() => setActiveTab('ignore_extensions')}
                  className={activeTab === 'ignore_extensions' ? 'bg-primary' : 'bg-gray-700'}
                >
                  Ignore Extensions
                </Button>
              </div>
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    placeholder={`Add ${activeTab === 'ignore_dirs' ? 'directory' : 'extension'}`}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="flex-grow text-white"
                  />
                  <Button onClick={() => addItem(activeTab)} className="bg-primary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchOptions[activeTab].map((item) => (
                    <Badge key={item} variant="secondary" className="text-sm">
                      {item}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-4 w-4 p-0"
                        onClick={() => removeItem(activeTab, item)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
                {searchOptions[activeTab].length > 0 && (
                  <Button
                    onClick={() => clearAll(activeTab)}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          <Button
            type="button"
            onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
            className="w-full mt-2 bg-gray-700 text-white hover:bg-gray-600"
          >
            {isCustomizeOpen ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide Customize Options
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show Customize Options
              </>
            )}
          </Button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-4 text-gray-400 text-sm"
        >
          Enter a GitHub username to view their total lines of code on public repositories
        </motion.p>
      </div>
    </>
  )
}


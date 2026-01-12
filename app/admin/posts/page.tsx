"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function PostsManagement() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await authClient.getSession()
        if (sessionData) {
          setSession(sessionData)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Posts Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name || session?.name || session?.email || 'Admin'}
              </span>
              <button
                onClick={() => authClient.signOut().then(() => router.push('/auth/login'))}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Actions Bar */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex space-x-4">
              <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                Create New Post
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">
                Export Posts
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search posts..."
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option>All Posts</option>
                <option>Published</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Sample Post Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Published
                  </span>
                  <span className="text-sm text-gray-500">Jan 5, 2024</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Getting Started with Next.js
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Learn the basics of Next.js and how to build modern web applications...
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs">JD</span>
                    </div>
                    <span className="text-sm text-gray-600">John Doe</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                    <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Post Card 2 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-green-500 to-blue-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Draft
                  </span>
                  <span className="text-sm text-gray-500">Jan 4, 2024</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Advanced React Patterns
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Explore advanced React patterns and best practices for scalable applications...
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs">JS</span>
                    </div>
                    <span className="text-sm text-gray-600">Jane Smith</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                    <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Post Card 3 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Published
                  </span>
                  <span className="text-sm text-gray-500">Jan 3, 2024</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Building APIs with Node.js
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  A comprehensive guide to building RESTful APIs with Node.js and Express...
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                      <span className="text-white text-xs">MB</span>
                    </div>
                    <span className="text-sm text-gray-600">Mike Brown</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                    <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing 1 to 3 of 3 posts
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-white bg-green-600 hover:bg-green-700">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

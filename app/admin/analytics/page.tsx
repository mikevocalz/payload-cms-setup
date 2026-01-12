"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
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
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">1,234</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-green-600">+12% from last month</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                    <dd className="text-lg font-medium text-gray-900">456</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-green-600">+8% from last month</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">💬</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Comments</dt>
                    <dd className="text-lg font-medium text-gray-900">789</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-red-600">-3% from last month</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">👁️</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Page Views</dt>
                    <dd className="text-lg font-medium text-gray-900">12,345</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-green-600">+15% from last month</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Traffic Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Overview</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600">Traffic chart would go here</p>
                  <p className="text-sm text-gray-500">Integration with analytics service needed</p>
                </div>
              </div>
            </div>

            {/* Popular Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Content</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Getting Started with Next.js</h4>
                    <p className="text-xs text-gray-500">1,234 views</p>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Advanced React Patterns</h4>
                    <p className="text-xs text-gray-500">987 views</p>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Building APIs with Node.js</h4>
                    <p className="text-xs text-gray-500">654 views</p>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm text-gray-600">New user registered: john@example.com</div>
                  <div className="text-xs text-gray-400">2 hours ago</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="text-sm text-gray-600">New post published: "React Best Practices"</div>
                  <div className="text-xs text-gray-400">4 hours ago</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="text-sm text-gray-600">Comment awaiting moderation</div>
                  <div className="text-xs text-gray-400">6 hours ago</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="text-sm text-gray-600">Media file uploaded: hero-image.jpg</div>
                  <div className="text-xs text-gray-400">8 hours ago</div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Response Time</span>
                  <span className="text-sm text-gray-900">245ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <span className="text-sm text-gray-900">2.4 GB / 10 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm text-gray-900">99.9%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

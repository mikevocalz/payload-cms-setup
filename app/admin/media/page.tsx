"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function MediaManagement() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState([
    { id: 1, name: 'hero-image.jpg', type: 'image', size: '2.4 MB', uploaded: 'Jan 5, 2024', url: '/placeholder-image.jpg' },
    { id: 2, name: 'profile-photo.png', type: 'image', size: '890 KB', uploaded: 'Jan 4, 2024', url: '/placeholder-image.jpg' },
    { id: 3, name: 'document.pdf', type: 'document', size: '1.2 MB', uploaded: 'Jan 3, 2024', url: '/placeholder-doc.pdf' }
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
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

  const handleDeleteMedia = (mediaId: number) => {
    if (confirm('Are you sure you want to delete this media file?')) {
      setMedia(media.filter(item => item.id !== mediaId))
    }
  }

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All Types' || item.type === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

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
              <h1 className="text-2xl font-bold text-gray-900">Media Management</h1>
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
          
          <div className="mb-6 flex justify-between items-center">
            <div className="flex space-x-4">
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700">
                Upload Media
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">
                Bulk Actions
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option>All Types</option>
                <option>Image</option>
                <option>Document</option>
                <option>Video</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {item.type === 'image' ? (
                    <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-2xl">🖼️</span>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-2xl">📄</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.size} • {item.uploaded}</p>
                  <div className="mt-3 flex justify-between">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">View</button>
                    <button 
                      onClick={() => handleDeleteMedia(item.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredMedia.length} media files
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

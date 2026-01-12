"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function CommentsManagement() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([
    { id: 1, content: 'Great post! Really helpful information.', author: 'John Doe', post: 'Getting Started with Next.js', status: 'approved', created: 'Jan 5, 2024' },
    { id: 2, content: 'Thanks for sharing this. Looking forward to more content like this.', author: 'Jane Smith', post: 'Advanced React Patterns', status: 'pending', created: 'Jan 4, 2024' },
    { id: 3, content: 'This is spam content that should be removed.', author: 'Spam User', post: 'Building APIs with Node.js', status: 'spam', created: 'Jan 3, 2024' }
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Comments')
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

  const handleApproveComment = (commentId: number) => {
    setComments(comments.map(comment => 
      comment.id === commentId ? { ...comment, status: 'approved' } : comment
    ))
  }

  const handleRejectComment = (commentId: number) => {
    setComments(comments.map(comment => 
      comment.id === commentId ? { ...comment, status: 'rejected' } : comment
    ))
  }

  const handleDeleteComment = (commentId: number) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      setComments(comments.filter(comment => comment.id !== commentId))
    }
  }

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.post.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All Comments' || comment.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
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
              <h1 className="text-2xl font-bold text-gray-900">Comments Management</h1>
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
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700">
                Bulk Approve
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">
                Export Comments
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option>All Comments</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Rejected</option>
                <option>Spam</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{comment.author.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{comment.author}</h3>
                      <p className="text-xs text-gray-500">on "{comment.post}" • {comment.created}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    comment.status === 'approved' ? 'bg-green-100 text-green-800' :
                    comment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    comment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {comment.status}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{comment.content}</p>
                
                <div className="flex space-x-3">
                  {comment.status !== 'approved' && (
                    <button 
                      onClick={() => handleApproveComment(comment.id)}
                      className="text-green-600 hover:text-green-900 text-sm"
                    >
                      Approve
                    </button>
                  )}
                  {comment.status !== 'rejected' && (
                    <button 
                      onClick={() => handleRejectComment(comment.id)}
                      className="text-yellow-600 hover:text-yellow-900 text-sm"
                    >
                      Reject
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredComments.length} comments
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

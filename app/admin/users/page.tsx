"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function UsersManagement() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', username: 'johndoe', email: 'john@example.com', status: 'Active', joined: 'Jan 1, 2024' },
    { id: 2, name: 'Jane Smith', username: 'janesmith', email: 'jane@example.com', status: 'Active', joined: 'Dec 15, 2023' },
    { id: 3, name: 'Mike Brown', username: 'mikebrown', email: 'mike@example.com', status: 'Pending', joined: 'Jan 5, 2024' }
  ])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Users')
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

  // CRUD Functions
  const handleAddUser = () => {
    setEditingUser(null)
    setShowModal(true)
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId))
    }
  }

  const handleSaveUser = (userData: any) => {
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, ...userData } : user
      ))
    } else {
      // Add new user
      const newUser = {
        id: Math.max(...users.map(u => u.id)) + 1,
        ...userData,
        joined: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
      setUsers([...users, newUser])
    }
    setShowModal(false)
    setEditingUser(null)
  }

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All Users' || user.status === statusFilter
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
              <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
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
              <button 
                onClick={handleAddUser}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Add New User
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">
                Export Users
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option>All Users</option>
                <option>Active</option>
                <option>Pending</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500']
                  const bgColor = colors[user.id % colors.length]
                  
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center`}>
                              <span className="text-white font-medium">{initials}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'Active' ? 'bg-green-100 text-green-800' :
                          user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.joined}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing 1 to {filteredUsers.length} of {filteredUsers.length} results
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <UserForm 
                user={editingUser}
                onSave={handleSaveUser}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// User Form Component
function UserForm({ user, onSave, onCancel }: { user: any, onSave: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    status: user?.status || 'Active'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          required
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          {user ? 'Update' : 'Create'} User
        </button>
      </div>
    </form>
  )
}

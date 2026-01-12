"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    siteName: 'My CMS Site',
    siteDescription: 'A powerful content management system',
    allowRegistration: true,
    requireEmailVerification: true,
    moderateComments: true,
    maintenanceMode: false,
    maxFileSize: '10',
    allowedFileTypes: 'jpg,png,gif,pdf,doc,docx'
  })
  const [activeTab, setActiveTab] = useState('general')
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

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    alert('Settings saved successfully!')
  }

  const handleUpdateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
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
          
          <div className="bg-white shadow rounded-lg">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {['general', 'security', 'media', 'advanced'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => handleUpdateSetting('siteName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) => handleUpdateSetting('siteDescription', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleUpdateSetting('maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable maintenance mode
                    </label>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => handleUpdateSetting('allowRegistration', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Allow user registration
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => handleUpdateSetting('requireEmailVerification', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Require email verification
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.moderateComments}
                      onChange={(e) => handleUpdateSetting('moderateComments', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Moderate comments before publishing
                    </label>
                  </div>
                </div>
              )}

              {/* Media Settings */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum file size (MB)
                    </label>
                    <input
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => handleUpdateSetting('maxFileSize', e.target.value)}
                      className="w-32 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed file types (comma separated)
                    </label>
                    <input
                      type="text"
                      value={settings.allowedFileTypes}
                      onChange={(e) => handleUpdateSetting('allowedFileTypes', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="jpg,png,gif,pdf"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Advanced Settings
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>These settings can affect system performance and security. Only modify if you know what you're doing.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                      Clear Cache
                    </button>
                    
                    <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                      Export Data
                    </button>
                    
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700">
                      Import Data
                    </button>
                    
                    <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700">
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Loader2, Globe, User, CheckCircle, Clock } from 'lucide-react'
import './App.css'

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    url: '',
    userId: ''
  })

  // Fetch scans on component mount
  useEffect(() => {
    fetchScans()
  }, [])

  const fetchScans = async () => {
    try {
      const response = await fetch(`${API_URL}/scans`)
      if (response.ok) {
        const data = await response.json()
        setScans(data)
      }
    } catch (err) {
      console.error('Failed to fetch scans:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newScan = await response.json()
        setScans(prev => [...prev, newScan.data])
        setFormData({ url: '', userId: '' })
      } else {
        const errorData = await response.json()
        setError(errorData.message.join(', ') || 'Failed to create scan')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SentryPrime v2</h1>
          <p className="text-lg text-gray-600">Enterprise-grade Accessibility Scanning Platform</p>
        </div>

        {/* Create Scan Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Scan</CardTitle>
            <CardDescription>
              Enter a URL and user ID to start an accessibility scan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="url"
                      name="url"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.url}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="userId" className="text-sm font-medium">User ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="userId"
                      name="userId"
                      type="text"
                      placeholder="user123"
                      value={formData.userId}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Scan...
                  </>
                ) : (
                  'Create Scan'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scans List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>
              View and manage your accessibility scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No scans found. Create your first scan above.
              </div>
            ) : (
              <div className="space-y-4">
                {scans.map((scan, index) => (
                  <div key={scan.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="font-medium">{scan.url}</div>
                        <div className="text-sm text-gray-500">User: {scan.userId}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {scan.status === 'completed' ? (
                        <Badge variant="success" className="flex items-center">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App

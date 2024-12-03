'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [regNo, setRegNo] = useState('')
  const [idCard, setIdCard] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Here you would typically make an API call to your backend
    // For this example, we'll just simulate a signup process
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulated successful signup
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to sign up. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="regNo" className="text-gray-700 dark:text-gray-300">Registration Number</Label>
        <Input
          id="regNo"
          name="regNo"
          type="text"
          required
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="idCard" className="text-gray-700 dark:text-gray-300">ID Card Photo</Label>
        <Input
          id="idCard"
          name="idCard"
          type="file"
          accept="image/*"
          required
          onChange={(e) => setIdCard(e.target.files ? e.target.files[0] : null)}
          className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing up...
            </>
          ) : (
            'Sign up'
          )}
        </Button>
      </div>
    </form>
  )
}


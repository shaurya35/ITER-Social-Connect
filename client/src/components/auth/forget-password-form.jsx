"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BACKEND_URL } from "@/configs/index"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ForgetPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/forget-password`, { email }, { withCredentials: true })

      if (response.status === 200) {
        setSuccess("OTP sent to your email successfully!")
        // Redirect to verify OTP page after 2 seconds
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
        }, 2000)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to send OTP. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-0 h-auto text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sign In
        </Button>
      </div>

      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-white">
          Enter your email address and we&apos;ll send you an OTP to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
            Email address
          </Label>
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
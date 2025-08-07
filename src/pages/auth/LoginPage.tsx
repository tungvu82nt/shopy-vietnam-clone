import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import AuthLayout from '@/components/layout/AuthLayout'
import { analytics } from '@/lib/analytics'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const { signIn, userProfile, user } = useAuth()
  const navigate = useNavigate()

  // Theo dõi thay đổi userProfile sau khi đăng nhập thành công
  useEffect(() => {
    if (loginSuccess && userProfile && user) {
      // Kiểm tra role và chuyển hướng phù hợp
      if (userProfile.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
      setLoginSuccess(false) // Reset trạng thái
    }
  }, [loginSuccess, userProfile, user, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const result = await signIn(data.email, data.password)
      if (result.error) {
        toast.error(result.error.message || 'Đăng nhập thất bại')
        
        // Theo dõi đăng nhập thất bại
        analytics.trackLogin("login_failed", { method: "email", error: result.error.message || "Login failed" });
        
        return
      }
      
      toast.success('Đăng nhập thành công!')
      
      // Theo dõi đăng nhập thành công
      analytics.trackLogin("login", { method: "email", user_id: result.user?.id });
      
      setLoginSuccess(true) // Đánh dấu đăng nhập thành công để useEffect xử lý chuyển hướng
      
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại')
      
      // Theo dõi lỗi đăng nhập
      analytics.trackLogin("login_failed", {
        method: "email",
        error: error.message || "Unknown error"
      });
      
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập vào tài khoản của bạn"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              className="pl-10 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="remember" className="text-sm">
              Ghi nhớ đăng nhập
            </Label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
              Đăng ký ngay
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  )
}
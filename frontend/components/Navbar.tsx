'use client'

import { useAppSelector } from '@/redux/hooks'
import { RootState } from '@/redux/store'
import Link from 'next/link'
import { useGetCartItemsQuery } from '@/redux/services/cartApi'
import {
  Home,
  ShoppingBag,
  ClipboardList,
  ShoppingCart,
  User,
  LayoutDashboard,
  LogOut,
  Tag,
  Users,
  Sun,
  Moon,
  LogIn,
  Heart
} from 'lucide-react'
import { useTheme } from "next-themes"
import {logoutHandler } from '@/utils/api'
import { toast } from 'sonner'
import { logout } from '@/redux/slices/authSlice'
import { useRouter, usePathname } from 'next/navigation'
import clsx from 'clsx'

type Role = 'USER' | 'ADMIN'

interface NavbarProps {
  role?: Role
}

const Navbar = ({ role = 'USER' }: NavbarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  )
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const { data: cartData } = useGetCartItemsQuery(undefined, { 
    skip: !isAuthenticated || role !== 'USER' 
  });
  const cartItemsCount = cartData?.data?.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0;

  const userOptions = [
    {
      id: 1,
      label: 'Home',
      route: '/user/home',
      icon: Home,
    },
    {
      id: 2,
      label: 'Products',
      route: '/user/products',
      icon: ShoppingBag,
    },
    ...(isAuthenticated ? [
      {
        id: 4,
        label: 'Cart',
        route: '/user/cart',
        icon: ShoppingCart,
      },
      {
        id: 5,
        label: 'Profile',
        route: '/user/profile',
        icon: User,
      },
      {
        id: 6,
        label: 'Wishlist',
        route: '/user/wishlist',
        icon: Heart,
      },
    ] : [])
  ]

  const adminOptions = [
    {
      id: 1,
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 2,
      label: 'Products',
      route: '/admin/products',
      icon: ShoppingBag,
    },
    {
      id: 3,
      label: 'Categories',
      route: '/admin/categories',
      icon: Tag,
    },
    {
      id: 4,
      label: 'Orders',
      route: '/admin/orders',
      icon: ClipboardList,
    },
    {
      id: 5,
      label: 'Users',
      route: '/admin/users',
      icon: Users,
    },
    {
      id: 6,
      label: 'Profile',
      route: '/admin/profile',
      icon: User,
    },
  ]

  const options = role === 'USER' ? userOptions : adminOptions

  const handleLogout = async()=>{
    try {
      logoutHandler()
      logout()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout Error",error)
      toast.error("Something went wrong while logout")
    }
  }

  return (
    <header
      className="
        fixed z-50 w-full
        bottom-0 lg:top-0 lg:bottom-auto
        glass
        shadow-sm lg:shadow-md
      "
    >
      <nav className="max-w-7xl mx-auto px-4">
        <div className="h-[76px] flex items-center justify-between">
          {/* Logo */}
          <Link href={role === 'USER' ? "/user/home" : "/admin/dashboard"} className="hidden lg:flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20">
              <ShoppingBag size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gradient">
              DesiMarket
            </h1>
          </Link>

          {/* Menu */}
          <ul className="flex w-full lg:w-auto justify-around lg:justify-end gap-1 lg:gap-4">
            {options.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.route

              return (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className={clsx(
                      "flex flex-col lg:flex-row items-center gap-1 lg:gap-2",
                      "px-3 py-2 rounded-xl transition-all duration-300 font-medium text-xs lg:text-sm",
                      isActive 
                        ? "text-primary bg-primary/10 lg:shadow-sm" 
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    )}
                  >
                    <div className="relative">
                      <Icon 
                        className={clsx(
                          "h-6 w-6 lg:h-5 lg:w-5 transition-transform duration-300",
                          isActive && "scale-110"
                        )} 
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {item.label === 'Cart' && cartItemsCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold h-[18px] min-w-[18px] rounded-full flex items-center justify-center shadow-sm px-1">
                          {cartItemsCount > 99 ? '99+' : cartItemsCount}
                        </span>
                      )}
                    </div>

                    {/* Hide label on small screens */}
                    <span className="hidden sm:block lg:inline">
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-violet-500" />}
            </button>
            {isAuthenticated ? (
              <button 
                className='flex items-center gap-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 font-semibold rounded-full px-5 py-2.5 transition-all duration-300 hover:shadow-sm active:scale-95' 
                onClick={handleLogout}
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span>Logout</span>
              </button>
            ) : (
              <button 
                className='flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 font-semibold rounded-full px-5 py-2.5 transition-all duration-300 hover:shadow-sm active:scale-95' 
                onClick={() => router.push("/auth/login")}
              >
                <LogIn size={18} strokeWidth={2.5} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar

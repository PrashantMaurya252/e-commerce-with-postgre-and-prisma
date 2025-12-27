'use client'

import { useAppSelector } from '@/redux/hooks'
import { RootState } from '@/redux/store'
import Link from 'next/link'

type Role = 'USER' | 'ADMIN'

interface NavbarProps {
  role?: Role
}

const Navbar = ({ role = 'USER' }: NavbarProps) => {
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  )

  const userOptions = [
    {
      id: 1,
      label: 'Home',
      route: '/user/home',
      icon: 'mdi-light--home',
    },
    {
      id: 2,
      label: 'Products',
      route: '/user/products',
      icon: 'mdi-light--shopping',
    },
    {
      id: 3,
      label: 'Orders',
      route: '/user/orders',
      icon: 'mdi-light--clipboard-text',
    },
    {
      id: 4,
      label: 'Cart',
      route: '/user/carts',
      icon: 'mdi-light--cart',
    },
  ]

  const adminOptions = [
    {
      id: 1,
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: 'mdi-light--view-dashboard',
    },
    {
      id: 2,
      label: 'Products',
      route: '/admin/products',
      icon: 'mdi-light--shopping',
    },
    {
      id: 3,
      label: 'Orders',
      route: '/admin/orders',
      icon: 'mdi-light--clipboard-text',
    },
  ]

  const options = role === 'USER' ? userOptions : adminOptions

  return (
    <header
      className="
        fixed z-50 w-full
        bottom-0 lg:top-0 lg:bottom-auto
        bg-white/80 backdrop-blur-md
        border-t lg:border-b lg:border-t-0
        shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:shadow-sm
      "
    >
      <nav className="max-w-7xl mx-auto px-4">
        <div className="h-[70px] flex items-center justify-between">
          {/* Logo */}
          <h1 className="hidden lg:block text-2xl font-extrabold tracking-tight text-emerald-600">
            Desi<span className="text-gray-900">Market</span>
          </h1>

          {/* Menu */}
          <ul className="flex w-full lg:w-auto justify-around lg:justify-end gap-6">
            {options.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.route}
                  className="
                    flex flex-col lg:flex-row items-center gap-1 lg:gap-2
                    text-gray-600 hover:text-emerald-600
                    transition-all duration-200
                    font-medium text-xs lg:text-sm
                  "
                >
                  <span
                    className={`icon-[${item.icon}] text-2xl lg:text-xl`}
                  ></span>

                  {/* Hide label on small screens */}
                  <span className="hidden sm:block lg:inline">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}

export default Navbar

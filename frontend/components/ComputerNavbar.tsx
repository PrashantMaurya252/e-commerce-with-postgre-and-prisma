'use client'

import { useAppSelector } from '@/redux/hooks';
import { RootState } from '@/redux/store';
import React from 'react'

const ComputerNavbar = () => {
  const { user, isAuthenticated, accessToken } = useAppSelector(
      (state: RootState) => state.auth
    );

    // console.log(user,isLoggedIn,token)
    
    const userOptions = [
        {id:1,label:"Home",route:"/user/home",icon:""},
        {id:2,label:"Products",route:"/user/products",icon:""}
    ]

    const adminOptions = [
        {id:1,label:"Dashboard",route:"/admin/dashboard",icon:""},
        {id:2,label:"Products",route:"/admin/products",icon:""}
    ]





    if(isAuthenticated && user && !user.isAdmin){
      userOptions.push({id:3,label:"Orders",route:"/user/orders",icon:""})
      userOptions.push({id:3,label:"Carts",route:"/user/carts",icon:""}) 
    }

    const options = user && user.isAdmin ? adminOptions :userOptions
  return (
    <header className='h-[80px] bg-white w-full flex items-center justify-evenly'>
      <h1>Desi Market</h1>
      <div className='flex gap-2 items-center'>
        {options?.map((item)=>(
          <span key={item.id}>{item.label}</span>
        ))}
      </div>
    </header>
  )
}

export default ComputerNavbar
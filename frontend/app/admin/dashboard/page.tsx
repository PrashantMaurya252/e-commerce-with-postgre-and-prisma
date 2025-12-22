"use client"

import React from 'react'
import { UseSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { useAppSelector } from '@/redux/hooks'

const Dashboard = () => {

  const { user, isLoggedIn, token } = useAppSelector(
    (state: RootState) => state.auth
  );

  // console.log(user,isLoggedIn,token)
  return (
    <div>Dashboard</div>
  )
}

export default Dashboard
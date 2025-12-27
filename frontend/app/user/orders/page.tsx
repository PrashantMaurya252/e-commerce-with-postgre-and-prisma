'use client'

import { useAppSelector } from '@/redux/hooks';
import { RootState } from '@/redux/store';
import React from 'react'

const Orders = () => {
    const { user, isAuthenticated, accessToken } = useAppSelector(
      (state: RootState) => state.auth
    );
  
    console.log(user,isAuthenticated,accessToken)
  return (
    <div>Orders</div>
  )
}

export default Orders
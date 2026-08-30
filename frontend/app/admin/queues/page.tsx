"use client"
import React from 'react'

export default function QueuesDashboard() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  
  return (
    <div className="p-6 h-[calc(100vh-6rem)]">
      <div className="h-full w-full shadow-lg border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Job Queues Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor background jobs in real-time.
          </p>
        </div>
        <div className="flex-1 w-full relative">
          <iframe 
            src={`${backendUrl}/admin/queues`}
            className="absolute inset-0 w-full h-full border-0"
            title="Bull Dashboard"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  )
}

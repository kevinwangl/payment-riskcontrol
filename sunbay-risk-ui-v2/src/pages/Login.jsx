import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [error, setError] = useState(false)
  const nav = useNavigate()
  const handleLogin = (e) => { e.preventDefault(); localStorage.setItem('auth','1'); nav('/dashboard') }

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-white p-8 w-[400px]">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-primary text-xl">◆</span>
          <span className="text-lg font-semibold">SUNBAY Risk</span>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Username" defaultValue="admin" className={`w-full border-0 border-b ${error?'border-danger':'border-border'} pb-2 text-[13px] outline-none focus:border-primary`} />
          <input type="password" placeholder="Password" defaultValue="••••••" className={`w-full border-0 border-b ${error?'border-danger':'border-border'} pb-2 text-[13px] outline-none focus:border-primary`} />
          {error && <p className="text-danger text-[12px]">Invalid credentials</p>}
          <button type="submit" className="w-full py-2.5 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 mt-4">Sign In</button>
        </div>
      </form>
    </div>
  )
}

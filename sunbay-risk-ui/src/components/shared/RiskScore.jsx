import React from 'react'

export default function RiskScore({ score }) {
  const color = score >= 70 ? 'border-danger text-danger' : score >= 40 ? 'border-warning text-warning' : 'border-success text-success'
  return <span className={`inline-flex items-center justify-center w-8 h-8 border-2 font-mono text-sm font-medium ${color}`}>{score}</span>
}

"use client"

import { useEffect } from 'react'

export default function DisqusCount() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//site-grades.disqus.com/count.js'
    script.id = 'dsq-count-scr'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return null
}

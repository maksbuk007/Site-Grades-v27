"use client"

import { useEffect } from 'react'

export default function DisqusComments({ identifier, title }: { identifier: string; title: string }) {
  useEffect(() => {
    // Конфигурация Disqus
    window.disqus_config = function() {
      this.page.url = window.location.href
      this.page.identifier = identifier
      this.page.title = title
    }

    // Загрузка скрипта Disqus
    const script = document.createElement('script')
    script.src = 'https://site-grades.disqus.com/embed.js'
    script.setAttribute('data-timestamp', Date.now().toString())
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Очистка при размонтировании
      document.body.removeChild(script)
      delete window.disqus_config
    }
  }, [identifier, title])

  return (
    <div>
      <div id="disqus_thread" />
      <noscript>
        Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a>
      </noscript>
    </div>
  )
}

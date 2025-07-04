
export function LogoMobile() {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg transform rotate-6 scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-inner flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-extrabold h-5">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Campus</span>
          <span className="text-gray-800 dark:text-gray-200">Connect</span>
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Connecting Minds</span>
      </div>
    </div>
  )
}


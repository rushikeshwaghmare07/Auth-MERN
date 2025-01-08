import React from 'react'
import { Routes, Route} from "react-router-dom"
import Home from './pages/Home'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/email-verify' element={<EmailVerify/>}  />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
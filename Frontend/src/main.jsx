import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider } from 'react-router-dom'
import { router } from './Routes/Route.jsx'
import '@ant-design/v5-patch-for-react-19';
import "./App.css"
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <RouterProvider router={AppRouter}> */}
      <App /> 
    {/* </RouterProvider> */}
    
  </StrictMode>,
)

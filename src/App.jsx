import './App.css'
import { ProjectProvider } from './context/ProjectContext'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <ProjectProvider>
      <Dashboard />
    </ProjectProvider>
  )
}

export default App


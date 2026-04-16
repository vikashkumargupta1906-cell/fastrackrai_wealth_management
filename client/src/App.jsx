import { useRef, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom'
import { uploadApi } from './services/api'
import './App.css'

// Import page components
import HouseholdList from './pages/HouseholdList'
import HouseholdDetail from './pages/HouseholdDetail'
import Insights from './pages/Insights'

// Navigation component
const Navbar = () => {
  const excelInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const [uploadingType, setUploadingType] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)

  const handleUpload = async (file, type) => {
    if (!file) return
    
    setUploadingType(type)
    setStatusMessage(null)

    try {
      let response
      if (type === 'excel') {
        response = await uploadApi.uploadExcel(file)
      } else {
        response = await uploadApi.uploadAudio(file)
      }
      
      if (response.data.success) {
        setStatusMessage({ type: 'success', text: `${type === 'excel' ? 'Excel' : 'Audio'} processed and uploaded successfully!` })
        // Wait 3 seconds so they can see success before refresh
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setStatusMessage({ type: 'error', text: response.data.error || 'Upload failed' })
        setUploadingType(null)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setStatusMessage({ type: 'error', text: error.response?.data?.error || error.message })
      setUploadingType(null)
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = ''
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  return (
    <>
      {uploadingType && (
        <div className="processing-overlay">
          <div className="processing-card">
            <div className="processing-spinner"></div>
            <h3>AI is processing your {uploadingType}...</h3>
            <p>We are standardizing your data and extracting household insights. Please wait.</p>
          </div>
        </div>
      )}
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            Wealth Management
          </Link>
        </div>
        
        <div className="navbar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            Households
          </NavLink>
          <NavLink to="/insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Insights
          </NavLink>
        </div>

        {statusMessage && (
          <div className={`status-message ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="navbar-actions">
          <div className="upload-buttons">
            <input
              type="file"
              ref={excelInputRef}
              style={{ display: 'none' }}
              accept=".xlsx, .xls"
              onChange={(e) => handleUpload(e.target.files[0], 'excel')}
            />
            <input
              type="file"
              ref={audioInputRef}
              style={{ display: 'none' }}
              accept=".mp3, .wav, .m4a"
              onChange={(e) => handleUpload(e.target.files[0], 'audio')}
            />
            
            <button 
              className={`upload-btn excel-btn ${uploadingType ? 'disabled' : ''}`}
              onClick={() => excelInputRef.current?.click()}
              disabled={uploadingType !== null}
            >
              Upload Excel
            </button>
            <button 
              className={`upload-btn audio-btn ${uploadingType ? 'disabled' : ''}`}
              onClick={() => audioInputRef.current?.click()}
              disabled={uploadingType !== null}
            >
              Upload Audio
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

// Main App component
function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HouseholdList />} />
            <Route path="/households/:id" element={<HouseholdDetail />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

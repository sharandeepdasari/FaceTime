import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import {Route,BrowserRouter as Router,Routes} from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponenet from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';

function App() {

  return (
    <div className='App'>
      <Router> 
        <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage/>}/>
            <Route path='/authentication' element={<Authentication/>}/> 
            <Route path='/:meetingCode' element={<VideoMeetComponenet/>}/> 
            <Route path='/home' element={<HomeComponent/>}/>
            <Route path='/history' element={<History/>}/>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
};

export default App;

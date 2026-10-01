import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/common/Layout'
import Dashboard from '@/pages/Dashboard'
import NewProject from '@/pages/NewProject'
import ProjectDetail from '@/pages/ProjectDetail'
import Story from '@/pages/Story'
import StoryCard from '@/pages/StoryCard'
import Album from '@/pages/Album'
import Storybook from '@/pages/Storybook'
import PrintBook from '@/pages/PrintBook'

export default function App() {
  return (
    <Routes>
      <Route path="/print-book" element={<PrintBook />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/trips" replace />} />
        <Route path="/trips" element={<Dashboard />} />
        <Route path="/trips/new" element={<NewProject />} />
        <Route path="/trips/:projectId/build" element={<NewProject />} />
        <Route path="/trips/:projectId" element={<ProjectDetail />}>
          <Route index element={<Navigate to="photos" replace />} />
          <Route path="photos" element={<Album />} />
          <Route path="story" element={<Story />} />
          <Route path="story-card" element={<StoryCard />} />
          <Route path="storybook" element={<Storybook />} />
        </Route>
        <Route path="*" element={<Navigate to="/trips" replace />} />
      </Route>
    </Routes>
  )
}

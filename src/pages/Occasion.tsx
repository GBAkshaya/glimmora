import { useParams, Navigate } from 'react-router-dom'
import SectionCollection from '../components/SectionCollection'

export default function Occasion() {
  const { section } = useParams()

  if (section !== 'casual' && section !== 'ethnic') {
    return <Navigate to="/occasion/casual" replace />
  }

  return <SectionCollection section={section} />
}

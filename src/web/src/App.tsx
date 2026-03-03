import ErrorBoundary from './components/ErrorBoundary';
import OfficePage from './pages/OfficePage';

export default function App() {
  return (
    <ErrorBoundary>
      <OfficePage />
    </ErrorBoundary>
  );
}

import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHomeData } from '../hooks/useHomeData'
import { usePlaylists } from '../hooks/usePlaylists'
import { SearchResults } from '../components/search/SearchResults'
import { RecentlyPlayed } from '../components/home/RecentlyPlayed'
import { YourPlaylists } from '../components/home/YourPlaylists'
import { Recommendations } from '../components/home/Recommendations'
import { Spinner } from '../components/ui/Spinner'
import type { AppLayoutContext } from '../components/layout/AppLayout'

export function HomePage() {
  const { user } = useAuth()
  const { searchQuery, searchResults, searchLoading } = useOutletContext<AppLayoutContext>()
  const { recentTracks, recommendations, isLoading: homeLoading } = useHomeData()
  const { playlists } = usePlaylists()

  return (
    <div className="flex flex-col gap-10">
      {!searchQuery && (
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getTimeOfDay()}, {user?.display_name ?? 'there'}
          </h1>
          <p className="text-secondary text-sm mt-1">
            What do you want to listen to today?
          </p>
        </div>
      )}

      {searchQuery ? (
        <SearchResults
          query={searchQuery}
          results={searchResults}
          isLoading={searchLoading}
        />
      ) : homeLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <>
          <RecentlyPlayed tracks={recentTracks} />
          <YourPlaylists playlists={playlists} />
          <Recommendations tracks={recommendations} />
        </>
      )}
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { PlayerBar } from './PlayerBar'
import { GeneratorModal } from '../playlist/GeneratorModal'
import { useSearch } from '../../hooks/useSearch'

export interface AppLayoutContext {
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: ReturnType<typeof useSearch>['results']
  searchLoading: boolean
}

export function AppLayout() {
  const { query, setQuery, results, isLoading } = useSearch()
  const [generatorOpen, setGeneratorOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      <Navbar
        searchQuery={query}
        onSearchChange={setQuery}
        onOpenGenerator={() => setGeneratorOpen(true)}
      />
      <main className="flex-1 overflow-y-auto pb-20 px-8 py-6">
        <Outlet context={{ searchQuery: query, setSearchQuery: setQuery, searchResults: results, searchLoading: isLoading } satisfies AppLayoutContext} />
      </main>
      <PlayerBar />
      <GeneratorModal isOpen={generatorOpen} onClose={() => setGeneratorOpen(false)} />
    </div>
  )
}

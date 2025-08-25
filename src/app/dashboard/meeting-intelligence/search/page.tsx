'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Filter, FileText, CheckSquare, Users, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';

interface SearchResult {
  meetingId: number;
  title: string;
  excerpt: string;
  relevance: number;
  date: string;
  matchedIn: string
}

interface AgendaItemResult {
  id: number;
  topic: string;
  problemStatement?: string;
  status: string;
  meeting: {
    id: number;
    title: string;
    startTime?: string;
  };
}

interface ActionItemResult {
  id: number;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  meeting: {
    id: number;
    title: string
  };
  assignedTo: {
    name: string
  };
}

export default function MeetingSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'meetings' | 'agenda' | 'actions'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [meetings, setMeetings] = useState<SearchResult[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItemResult[]>([]);
  const [actionItems, setActionItems] = useState<ActionItemResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 500);
  const router = useRouter();
  
  // Fetch suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetch(`/api/meetings/search/suggestions?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.suggestions ?? []);
          setShowSuggestions(true);
        })
        .catch(console.error);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, searchType]);
  
  // Perform search
  const performSearch = useCallback(async () => {
    if (!debouncedQuery ?? debouncedQuery.length < 2) {
      setMeetings([]);
      setAgendaItems([]);
      setActionItems([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        type: searchType
      });
      
      const response = await fetch(`/api/meeting-intelligence/search?${params}`);
      const data = await response.json();
      
      if (searchType === 'all' || searchType === 'meetings') {
        setMeetings(data.meetings ?? []);
      }
      if (searchType === 'all' || searchType === 'agenda') {
        const safeAgendaItems = (data.agendaItems ?? []).map((item: { meeting?: { id: number; title: string; startTime: string }; [key: string]: unknown }) => ({
          ...item,
          meeting: item.meeting || { id: 0, title: 'Unknown', startTime: new Date().toISOString() }
        }));
        setAgendaItems(safeAgendaItems);
      }
      if (searchType === 'all' || searchType === 'actions') {
        const safeActionItems = (data.actionItems ?? []).map((item: { meeting?: { id: number; title: string }; assignedTo?: { name: string }; [key: string]: unknown }) => ({
          ...item,
          meeting: item.meeting || { id: 0, title: 'Unknown' },
          assignedTo: item.assignedTo || { name: 'Unassigned' }
        }));
        setActionItems(safeActionItems);
      }
    } catch (error: unknown) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, searchType]);
  
  useEffect(() => {
    performSearch();
  }, [performSearch]);
  
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };
  
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase()
        ? <span key={i} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">{part}</span>
        : part
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <BackLink href="/dashboard/meeting-intelligence" label="Return to Meeting Intelligence" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Meeting Search
        </h1>
        <p className="text-muted-foreground">
          Search across all meetings, agenda items, and action items
        </p>
      </div>
      
      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                placeholder="Search meetings, agenda items, action items..."
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-foreground hover:text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search Type Filter */}
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'all' | 'meetings' | 'agenda' | 'actions')}
              className="px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All</option>
              <option value="meetings">Meetings</option>
              <option value="agenda">Agenda Items</option>
              <option value="actions">Action Items</option>
            </select>
          </div>
        </div>
        
        {isSearching && (
          <div className="mt-4 text-center text-muted-foreground">
            Searching...
          </div>
        )}
      </div>
      
      {/* Search Results */}
      <div className="space-y-6">
        {/* Meetings Results */}
        {meetings.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meetings ({meetings.length})
            </h2>
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Link
                  key={meeting.meetingId}
                  href={`/dashboard/meetings/${meeting.meetingId}`}
                  className="block p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {highlightMatch(meeting.title, searchQuery)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {meeting.excerpt}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(meeting.date).toLocaleDateString()}
                        </span>
                        <span>Matched in: {meeting.matchedIn}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Agenda Items Results */}
        {agendaItems.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Agenda Items ({agendaItems.length})
            </h2>
            <div className="space-y-3">
              {agendaItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.meeting ? `/dashboard/meetings/${item.meeting.id}` : '#'}
                  className="block p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {highlightMatch(item.topic, searchQuery)}
                      </h3>
                      {item.problemStatement && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.problemStatement}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>meeting: {item.meeting?.title ?? 'Unknown'}</span>
                        <span className={`px-2 py-1 rounded ${
                          item.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Items Results */}
        {actionItems.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Action Items ({actionItems.length})
            </h2>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.meeting ? `/dashboard/meetings/${item.meeting.id}` : '#'}
                  className="block p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {highlightMatch(item.title, searchQuery)}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.assignedTo.name}
                        </span>
                        {item.dueDate && (
                          <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                        )}
                        <span className={`px-2 py-1 rounded ${
                          item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          item.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* No Results */}
        {!isSearching && debouncedQuery && meetings.length === 0 && agendaItems.length === 0 && actionItems.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No results found for "{debouncedQuery}"
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try different keywords or filters
            </p>
          </div>
        )}
        
        {/* Initial State */}
        {!debouncedQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start typing to search across meetings, agenda items, and action items
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setSearchQuery('budget')}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
              >
                Try: "budget"
              </button>
              <button
                onClick={() => setSearchQuery('planning')}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
              >
                Try: "planning"
              </button>
              <button
                onClick={() => setSearchQuery('staff')}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
              >
                Try: "staff"
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
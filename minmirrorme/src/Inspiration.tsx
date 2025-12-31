import { useState, useEffect, useRef } from 'react';
import { get, post, del, put } from 'aws-amplify/api';

// Define the structure of an inspiration item
type InspirationItem = {
  SK: string;
  title: string;
  author: string;
  insights: string[];
  createdAt: string;
};

// Define types for the API responses
type AddInspirationResponse = {
    status: 'success' | 'duplicate';
    message: string;
    inspiration: InspirationItem;
}

type FineTuneResponse = {
    status: 'success';
    message: string;
    newInsights: string[];
}

function Inspiration() {
  const [newTitle, setNewTitle] = useState('');
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // State to manage inline editing
  const [editingInsight, setEditingInsight] = useState<{ inspirationSK: string; index: number } | null>(null);
  const [editText, setEditText] = useState('');

  // --- RE-IMPLEMENTED: State for filters ---
  const [titleFilter, setTitleFilter] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<InspirationItem[]>([]);
  
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const fetchInspirations = async (filter = titleFilter) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      // We'll fetch all inspirations now to power the autocomplete
      if (filter) {
        params.append('title', filter);
      }
      
      const path = `/inspirations?${params.toString()}`;

      const { body } = await get({ apiName: 'Blueprint-API', path }).response;
      const data = (await body.json()) as InspirationItem[];
      setInspirations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('GET call failed:', error);
      setStatusMessage('Error: Could not fetch inspirations.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchInspirations(''); // Fetch all on initial load
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setTitleSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [autocompleteRef]);

  const handleAddInspiration = async () => {
    if (!newTitle.trim()) {
      setStatusMessage('Please enter a title.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Analyzing inspiration...');
    try {
      const { body } = await post({
        apiName: 'Blueprint-API',
        path: '/inspiration',
        options: { body: { title: newTitle } },
      }).response;
      const response = (await body.json()) as AddInspirationResponse;

      if (response.status === 'duplicate') {
        if (window.confirm(response.message)) {
          handleFineTune(response.inspiration);
        }
      } else {
        setStatusMessage(`Success! Insights for "${response.inspiration.title}" have been saved.`);
        await fetchInspirations('');
      }
      setNewTitle('');
    } catch (error) {
      console.error('POST call failed:', error);
      setStatusMessage('Error: Could not add inspiration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInspiration = async (inspirationId: string) => {
    if (!window.confirm('Are you sure you want to delete this inspiration?')) return;
    try {
      await del({
        apiName: 'Blueprint-API',
        path: `/inspirations/${encodeURIComponent(inspirationId)}`,
      }).response;
      setInspirations(prev => prev.filter(item => item.SK !== inspirationId));
      setStatusMessage('Inspiration deleted successfully.');
    } catch (error) {
      console.error('DELETE call failed:', error);
      setStatusMessage('Error: Could not delete inspiration.');
    }
  };

  const handleFineTune = async (inspiration: InspirationItem) => {
    setStatusMessage(`Fine-tuning insights for "${inspiration.title}"...`);
    setIsLoading(true);
    try {
        const { body } = await post({
            apiName: 'Blueprint-API',
            path: `/inspirations/${encodeURIComponent(inspiration.SK)}/finetune`,
            options: { body: { title: inspiration.title, author: inspiration.author, insights: inspiration.insights } }
        }).response;
        const response = (await body.json()) as FineTuneResponse;
        
        await handleUpdateInspiration(inspiration.SK, response.newInsights);
        setStatusMessage("Principles successfully fine-tuned and saved!");

    } catch (error) {
        console.error('Fine-tune call failed:', error);
        setStatusMessage('Error: Could not fine-tune principles.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateInspiration = async (inspirationSK: string, newInsights: string[]) => {
    try {
      await put({
        apiName: 'Blueprint-API',
        path: `/inspirations/${encodeURIComponent(inspirationSK)}`,
        options: { body: { insights: newInsights } }
      }).response;

      setInspirations(prev => prev.map(item => 
        item.SK === inspirationSK ? { ...item, insights: newInsights } : item
      ));
      setEditingInsight(null);
    } catch (error) {
      console.error('Update call failed:', error);
      setStatusMessage('Error: Could not save the updated principles.');
    }
  };

  const startEditing = (inspiration: InspirationItem, index: number) => {
    setEditingInsight({ inspirationSK: inspiration.SK, index });
    setEditText(inspiration.insights[index]);
  };

  const saveEdit = () => {
    if (!editingInsight) return;
    const { inspirationSK, index } = editingInsight;
    const inspirationToUpdate = inspirations.find(item => item.SK === inspirationSK);
    if (inspirationToUpdate) {
      const newInsights = [...inspirationToUpdate.insights];
      newInsights[index] = editText;
      handleUpdateInspiration(inspirationSK, newInsights);
    }
  };

  const toggleActionsDropdown = (inspirationSK: string) => {
    const dropdown = document.getElementById(`actions-dropdown-${inspirationSK}`);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  };
  
  // --- RE-IMPLEMENTED: Autocomplete handlers ---
  const handleTitleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitleFilter(value);

    if (value.length > 0) {
      const matches = inspirations.filter(item =>
        item.title.toLowerCase().includes(value.toLowerCase()) ||
        item.author.toLowerCase().includes(value.toLowerCase())
      );
      setTitleSuggestions(matches);
    } else {
      setTitleSuggestions([]);
      fetchInspirations(''); // Fetch all results when filter is cleared
    }
  };

  const handleSuggestionClick = (title: string) => {
    setTitleFilter(title);
    setTitleSuggestions([]);
    fetchInspirations(title); // Trigger a filter with the selected title
  };

  return (
    <div className="inspiration-container">
      <h2>Gather Wisdom</h2>
      <p>What moves you? Share a book or movie, and we will distill its essence into your Core.</p>
      
      <div className="form-group">
        <label>Add an Inspiring Book or Movie</label>
        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., The Alchemist by Paulo Coelho" />
      </div>
      <button onClick={handleAddInspiration} disabled={isLoading}>{isLoading ? 'Analyzing...' : 'Extract Wisdom'}</button>

      <div className="entries-list">
        <h3>Saved Wisdom</h3>
        <div className="filter-controls">
          <div className="autocomplete-container" ref={autocompleteRef}>
            <input 
              type="text" 
              value={titleFilter}
              onChange={handleTitleFilterChange}
              placeholder="Filter by title or author..."
            />
            {titleSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {titleSuggestions.map(suggestion => (
                  <li key={suggestion.SK} onClick={() => handleSuggestionClick(suggestion.title)}>
                    {suggestion.title} - <span className="author-text">{suggestion.author}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Search button is now removed */}
        </div>

        {isFetching ? <p>Loading inspirations...</p> : (
          inspirations.map((item) => (
            <div key={item.SK} className="entry-item inspiration-card">
              <div className="entry-header">
                <h4>{item.title} <span className="author-text">by {item.author}</span></h4>
                <div className="actions-container">
                  <button onClick={() => toggleActionsDropdown(item.SK)} className="actions-button">•••</button>
                  <div id={`actions-dropdown-${item.SK}`} className="actions-dropdown hidden">
                    <div onClick={() => handleFineTune(item)}>Fine-Tune Core Wisdom</div>
                    <div onClick={() => handleDeleteInspiration(item.SK)} className="delete-action">Delete</div>
                  </div>
                </div>
              </div>
              <ul>
                {item.insights.map((insight, index) => (
                  <li key={index}>
                    {editingInsight?.inspirationSK === item.SK && editingInsight.index === index ? (
                      <div className="edit-insight-form">
                        <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={() => setEditingInsight(null)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        {insight}
                        <button onClick={() => startEditing(item, index)} className="edit-button-inline">
                          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <span>Added on: {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
      {statusMessage && <p className={`status-message ${statusMessage.startsWith('Error') ? 'error' : 'success'}`}>{statusMessage}</p>}
    </div>
  );
}

export default Inspiration;

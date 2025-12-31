import { useState, useEffect } from 'react';
import { get, post, del, put } from 'aws-amplify/api';

// A type definition for our journal entries
type JournalEntry = {
  SK: string;
  content: string;
  createdAt: string;
};

// Helper function to format dates
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

function Journal() {
  const [journalContent, setJournalContent] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedEntrySK, setExpandedEntrySK] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchEntries = async (start?: string, end?: string) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams();
      if (start && end) {
        params.append('startDate', start);
        params.append('endDate', end);
      } else {
        params.append('limit', '2');
      }
      const path = `/journals?${params.toString()}`;

      const { body } = await get({ apiName: 'Blueprint-API', path }).response;
      const response = (await body.json()) as JournalEntry[];
      setEntries(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('GET call failed:', error);
      setStatusMessage('Error: Could not fetch entries.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    const defaultEndDate = formatDate(today);
    const defaultStartDate = formatDate(twoDaysAgo);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    fetchEntries(defaultStartDate, defaultEndDate);
  }, []);

  const handleSaveJournal = async () => {
    if (!journalContent.trim()) {
      setStatusMessage('Please enter something before saving.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Saving your thought...');
    try {
      await post({
        apiName: 'Blueprint-API',
        path: '/journal',
        options: { body: { content: journalContent } },
      }).response;
      setStatusMessage('Success! Your thought has been saved.');
      setJournalContent('');
      await fetchEntries(startDate, endDate); 
    } catch (error) {
      console.error('POST call failed:', error);
      setStatusMessage('Error: Could not save entry. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (journalId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await del({
        apiName: 'Blueprint-API',
        path: `/journals/${encodeURIComponent(journalId)}`,
      }).response;
      setEntries(prev => prev.filter(item => item.SK !== journalId));
      setStatusMessage('Entry deleted successfully.');
    } catch (error) {
      console.error('DELETE call failed:', error);
      setStatusMessage('Error: Could not delete entry.');
    }
  };

  const startEditing = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditText(entry.content);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editText.trim()) return;
    setStatusMessage('Updating entry...');
    try {
      await put({
        apiName: 'Blueprint-API',
        path: `/journals/${encodeURIComponent(editingEntry.SK)}`,
        options: { body: { content: editText } }
      }).response;
      setEntries(prev => prev.map(entry => 
        entry.SK === editingEntry.SK ? { ...entry, content: editText } : entry
      ));
      setStatusMessage('Entry updated successfully.');
      setEditingEntry(null);
    } catch (error) {
      console.error('PUT call failed:', error);
      setStatusMessage('Error: Could not update entry.');
    }
  };

  const toggleActionsDropdown = (journalSK: string) => {
    const dropdown = document.getElementById(`journal-actions-${journalSK}`);
    dropdown?.classList.toggle('hidden');
  };

  return (
    <div className="journal-container">
      <h2>Quiet Reflection</h2>
      <p>Unload your mental clutter. Writing it down helps clear the noise.</p>
      <textarea
        value={journalContent}
        onChange={(e) => setJournalContent(e.target.value)}
        placeholder="Write your thoughts here..."
        rows={5}
        disabled={isLoading}
      />
      <button onClick={handleSaveJournal} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Keep this Memory'}
      </button>
      {statusMessage && <p className={`status-message ${statusMessage.startsWith('Error') ? 'error' : 'success'}`}>{statusMessage}</p>}

      <div className="entries-list">
        <h3>Your Past Thoughts</h3>
        
        <div className="filter-controls">
          <label>From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label>To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button onClick={() => fetchEntries(startDate, endDate)}>Filter</button>
        </div>
        
        {isFetching ? <p>Loading entries...</p> : entries.length > 0 ? (
          // --- NEW: iMessage style container ---
          <div className="imessage-container">
            {entries.map((entry) => {
              const isExpanded = expandedEntrySK === entry.SK;
              const isTruncated = entry.content.length > 200;
              const displayText = isExpanded || !isTruncated ? entry.content : `${entry.content.substring(0, 200)}...`;

              return (
                <div key={entry.SK} className="journal-bubble-wrapper">
                  <div className="journal-bubble">
                    {editingEntry?.SK === entry.SK ? (
                      <div className="edit-journal-form">
                        <textarea 
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={5}
                        />
                        <button onClick={handleUpdateEntry}>Save</button>
                        <button onClick={() => setEditingEntry(null)} className="clear-button">Cancel</button>
                      </div>
                    ) : (
                      <p>{displayText}</p>
                    )}
                    {isTruncated && !editingEntry && (
                      <button className="read-more-button" onClick={() => setExpandedEntrySK(isExpanded ? null : entry.SK)}>
                        {isExpanded ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                    <div className="journal-bubble-footer">
                      <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="actions-container">
                        <button onClick={() => toggleActionsDropdown(entry.SK)} className="actions-button-bubble">✏️</button>
                        <div id={`journal-actions-${entry.SK}`} className="actions-dropdown hidden">
                          <div onClick={() => startEditing(entry)}>Edit</div>
                          <div onClick={() => handleDeleteEntry(entry.SK)} className="delete-action">Delete</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No entries found for the selected criteria.</p>
        )}
      </div>
    </div>
  );
}

export default Journal;

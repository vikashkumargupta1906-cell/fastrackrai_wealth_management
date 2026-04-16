import React, { useState } from 'react';

const AudioNotesTab = ({ household }) => {
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  if (!household) {
    return <div className="tab-loading">Loading audio notes...</div>;
  }

  const toggleNoteExpansion = (index) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedNotes(newExpanded);
  };

  // Parse audio notes from the household's audioNotes field
  // Expected format: "[timestamp] Audio Transcript:\n{transcript text}\n\n[timestamp] Audio Transcript:\n{transcript text}\n\n..."
  const parseAudioNotes = (audioNotes) => {
    if (!audioNotes) return [];
    
    const notes = [];
    const sections = audioNotes.split(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    const timestamps = audioNotes.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/g) || [];
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      if (section.startsWith('Audio Transcript:')) {
        const transcript = section.replace('Audio Transcript:', '').trim();
        const timestamp = timestamps[i - 1];
        
        if (transcript && timestamp) {
          notes.push({
            timestamp: timestamp.replace(/[\[\]]/g, ''),
            transcript: transcript
          });
        }
      }
    }
    
    return notes.reverse(); // Show newest first
  };

  const audioNotes = parseAudioNotes(household.audioNotes);

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return timestamp;
    }
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });
  };

  const downloadNotes = () => {
    const content = audioNotes.map(note => 
      `[${note.timestamp}]\n${note.transcript}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${household.name}_audio_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audio-notes-tab">
      <div className="tab-header">
        <h3>Audio Notes ({audioNotes.length})</h3>
        {audioNotes.length > 0 && (
          <button className="download-btn" onClick={downloadNotes}>
            Download All Notes
          </button>
        )}
      </div>

      {audioNotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">mic</div>
          <h4>No Audio Notes</h4>
          <p>No audio transcripts have been recorded for this household.</p>
          <p>Upload an audio file to get started with voice notes.</p>
        </div>
      ) : (
        <div className="notes-container">
          {audioNotes.map((note, index) => (
            <div key={index} className="note-card">
              <div className="note-header">
                <div className="note-timestamp">
                  <span className="timestamp-icon">clock</span>
                  {formatDate(note.timestamp)}
                </div>
                <div className="note-actions">
                  <button 
                    className="action-btn"
                    onClick={() => copyToClipboard(note.transcript)}
                    title="Copy transcript"
                  >
                    copy
                  </button>
                  <button 
                    className="action-btn expand-btn"
                    onClick={() => toggleNoteExpansion(index)}
                    title={expandedNotes.has(index) ? 'Collapse' : 'Expand'}
                  >
                    {expandedNotes.has(index) ? 'expand_less' : 'expand_more'}
                  </button>
                </div>
              </div>
              
              <div className="note-content">
                <div className="transcript">
                  {expandedNotes.has(index) ? (
                    <pre className="transcript-text full">{note.transcript}</pre>
                  ) : (
                    <div className="transcript-text truncated">
                      {truncateText(note.transcript)}
                    </div>
                  )}
                </div>
                
                {note.transcript.length > 200 && (
                  <button 
                    className="read-more-btn"
                    onClick={() => toggleNoteExpansion(index)}
                  >
                    {expandedNotes.has(index) ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .audio-notes-tab {
          padding: 1rem;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .tab-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .download-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .download-btn:hover {
          background: #0056b3;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .empty-icon {
          font-size: 3rem;
          color: #6c757d;
          margin-bottom: 1rem;
        }

        .empty-state h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .empty-state p {
          margin: 0.5rem 0;
          color: #6c757d;
        }

        .notes-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .note-card {
          background: white;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }

        .note-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1rem 0.5rem 1rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .note-timestamp {
          display: flex;
          align-items: center;
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .timestamp-icon {
          margin-right: 0.5rem;
          font-size: 1rem;
        }

        .note-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: transparent;
          border: 1px solid #dee2e6;
          color: #6c757d;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: #f8f9fa;
          color: #495057;
          border-color: #adb5bd;
        }

        .expand-btn {
          font-family: 'Material Icons', sans-serif;
        }

        .note-content {
          padding: 1rem;
        }

        .transcript {
          margin-bottom: 0.5rem;
        }

        .transcript-text {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid #e9ecef;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #2c3e50;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .transcript-text.full {
          max-height: none;
        }

        .transcript-text.truncated {
          max-height: 100px;
          overflow: hidden;
          position: relative;
        }

        .read-more-btn {
          background: transparent;
          border: 1px solid #007bff;
          color: #007bff;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .read-more-btn:hover {
          background: #007bff;
          color: white;
        }

        .tab-loading {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .tab-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .note-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .note-actions {
            align-self: flex-end;
          }
          
          .transcript-text {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioNotesTab;

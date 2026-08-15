import { useState } from 'react';
import { getReport } from '../api/client.js';

export function ReportModal({ onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  const [format, setFormat] = useState('markdown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getReport(fromDate, toDate, format);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdown = () => {
    if (!result?.markdown) return;
    const blob = new Blob([result.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neighbornode-report-${fromDate}-${toDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="modal__title" id="report-title">Generate Report</div>

        <div className="modal__field">
          <label className="modal__label" htmlFor="report-from">From</label>
          <input id="report-from" type="date" className="modal__input" value={fromDate} onChange={e => setFromDate(e.target.value)} max={toDate} />
        </div>
        <div className="modal__field">
          <label className="modal__label" htmlFor="report-to">To</label>
          <input id="report-to" type="date" className="modal__input" value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate} max={today} />
        </div>
        <div className="modal__field">
          <label className="modal__label" htmlFor="report-format">Format</label>
          <select id="report-format" className="modal__input" value={format} onChange={e => setFormat(e.target.value)}>
            <option value="markdown">Markdown</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {error && <div style={{ color: 'var(--flag-red)', fontSize: 'var(--text-small)' }}>{error}</div>}

        {result?.markdown && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono)', background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>
              {result.markdown}
            </div>
            <button className="btn btn--report btn--sm" onClick={downloadMarkdown} id="download-report">
              Download .md
            </button>
          </div>
        )}

        <div className="modal__actions">
          <button className="btn btn--reject" onClick={onClose} id="close-report-modal">Cancel</button>
          <button className="btn btn--report" onClick={generate} disabled={loading} id="generate-report">
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}

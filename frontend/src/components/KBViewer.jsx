import { useState, useEffect } from 'react';
import { fetchKB } from '../services/api';

function KBViewer() {
  const [kbItems, setKbItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadKB();
  }, []);

  const loadKB = async () => {
    try {
      const data = await fetchKB();
      setKbItems(data);
    } catch (error) {
      console.error('Error loading KB:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(kbItems.map(item => item.category))];

  const filteredItems = kbItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="kb-viewer">Loading knowledge base...</div>;
  }

  return (
    <div className="kb-viewer">
      <div className="kb-header">
        <h2>Knowledge Base</h2>
        <p>Browse our knowledge base for answers to common questions</p>
      </div>

      <div className="kb-filters">
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="kb-search"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="kb-category-filter"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      <div className="kb-items">
        {filteredItems.length === 0 ? (
          <p>No items found matching your search.</p>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="kb-item">
              <div className="kb-item-header">
                <h3>{item.title}</h3>
                <span className="kb-category-badge">{item.category}</span>
              </div>
              <p className="kb-item-content">{item.content}</p>
              {item.keywords && item.keywords.length > 0 && (
                <div className="kb-item-keywords">
                  <strong>Keywords:</strong> {item.keywords.join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="kb-stats">
        <p>Showing {filteredItems.length} of {kbItems.length} items</p>
      </div>
    </div>
  );
}

export default KBViewer;


import { debug } from 'utils/debug';
import React, { useState } from 'react';
function SimpleApp() {
    const [count, setCount] = useState(0);
    return (<div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: '#333' }}>🎉 VybeSuite Test - LIVE RELOADING ACTIVE!</h1>
      <p style={{ color: '#666' }}>If you can see this, React is working!</p>
      <p style={{ color: '#666' }}>Development server is running successfully.</p>
      
      <div style={{ margin: '20px 0' }}>
        <button onClick={() => setCount(count + 1)} style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        }}>
          Click me! Count: {count}
        </button>
      </div>
      
      <p style={{ color: '#28a745', fontWeight: 'bold' }}>
        ✨ This page updates INSTANTLY when you save code changes! ✨
      </p>
    </div>);
}
export default SimpleApp;

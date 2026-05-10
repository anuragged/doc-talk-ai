import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        padding: '2rem 3rem',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;

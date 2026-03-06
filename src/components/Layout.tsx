import React from "react";
import BottomNav from "./BottomNav";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="safe-bottom">{children}</main>
      <BottomNav />
    </div>
  );
};

export default Layout;

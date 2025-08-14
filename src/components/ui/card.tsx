import * as React from "react";

const Card = ({ className, children }:{className:string,children:React.ReactNode}) => {
  return (
    <div className={`border rounded-lg shadow-md p-4 bg-white ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children }:{children:React.ReactNode}) => {
  return <div className="p-2">{children}</div>;
};

export { Card, CardContent };
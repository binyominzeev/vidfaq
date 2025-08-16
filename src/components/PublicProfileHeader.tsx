import React from "react";

interface PublicProfileHeaderProps {
  name: string;
  description?: string;
  subdomain: string;
}

const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({ name, description, subdomain }) => (
  <a href={`https://${subdomain}.vidfaq.com`} className="block text-center mb-8 no-underline">
    <h1 className="text-2xl font-bold text-gray-900 mb-2 hover:underline">{name}</h1>
    {description && (
      <p className="text-base text-muted-foreground mb-2">{description}</p>
    )}
  </a>
);

export default PublicProfileHeader;

import React from 'react';

interface TagBadgeProps {
  name: string;
  color: string;
}

/**
 * A small, colored badge for displaying a tag.
 * The background color is determined by the tag's color property.
 * Text color is automatically determined to be black or white for contrast.
 */
export function TagBadge({ name, color }: TagBadgeProps) {
  // Simple algorithm to determine text color (black or white) based on background luminance.
  // This ensures readability.
  const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: color,
    color: getContrastYIQ(color),
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
  };

  return (
    <div style={badgeStyle}>
      {name}
    </div>
  );
}
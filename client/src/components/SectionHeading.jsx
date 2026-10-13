import { Link } from 'react-router-dom';
import { ChevronRight } from './Icons.jsx';

// "Grab the best deal on <Smartphones>" with the blue underline from Figma.
export function SectionHeading({ lead, highlight, to, as: Tag = 'h2' }) {
  return (
    <div className="section-heading">
      <Tag className="section-heading__title">
        {lead && `${lead} `}
        <span>{highlight}</span>
      </Tag>
      {to && (
        <Link to={to} className="section-heading__link">
          View All <ChevronRight />
        </Link>
      )}
    </div>
  );
}

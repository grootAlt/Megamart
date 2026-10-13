// Stroke icons drawn at 24×24, sized by font-size via 1em.
const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const make = (paths) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {paths}
      </svg>
    );
  };

export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const CartIcon = make(<><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>);
export const UserIcon = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const MenuIcon = make(<path d="M4 6h16M4 12h16M4 18h10" />);
export const ListIcon = make(<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />);
export const ChevronDown = make(<path d="m6 9 6 6 6-6" />);
export const ChevronRight = make(<path d="m9 6 6 6-6 6" />);
export const ChevronLeft = make(<path d="m15 6-6 6 6 6" />);
export const PinIcon = make(<><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>);
export const TruckIcon = make(<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></>);
export const OfferIcon = make(<><circle cx="12" cy="12" r="9" /><path d="m9 15 6-6M9.5 9.5h.01M14.5 14.5h.01" /></>);
export const MinusIcon = make(<path d="M5 12h14" />);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const TrashIcon = make(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
export const FilterIcon = make(<path d="M4 5h16l-6 7v6l-4 2v-8z" />);
export const AlertIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>);
export const CheckIcon = make(<path d="m5 12 5 5 9-10" />);
export const PhoneIcon = make(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />);
export const BagIcon = make(<><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>);

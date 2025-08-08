// Mock for lucide-react icons
const React = require('react');

// Create a mock component for all icons
const createMockIcon = (name) => {
  const Component = React.forwardRef((props, ref) => {
    return React.createElement('svg', { 
      ...props, 
      ref,
      'data-testid': `icon-${name}`,
      'aria-label': name 
    });
  });
  Component.displayName = name;
  return Component;
};

// List of all icons used in the app
const iconNames = [
  'Search', 'Users', 'Calendar', 'Video', 'Repeat', 'Link', 'CalendarDays', 'FolderOpen',
  'Plus', 'Save', 'ArrowLeft', 'ArrowRight', 'Clock', 'Trash2', 'ChevronUp', 'ChevronDown',
  'GripVertical', 'Target', 'List', 'ChevronLeft', 'ChevronRight', 'MessageSquare', 'Send',
  'User', 'Loader2', 'ActivityIcon', 'DatabaseIcon', 'AlertCircle', 'Check', 'X', 'Edit',
  'Eye', 'EyeOff', 'Lock', 'Mail', 'Phone', 'MapPin', 'Building', 'Shield', 'Settings',
  'LogOut', 'Menu', 'Home', 'FileText', 'BarChart3', 'Sun', 'Moon', 'Palette', 'Leaf',
  'CheckCircle', 'XCircle', 'Info', 'AlertTriangle', 'Filter', 'Download', 'Upload',
  'RefreshCw', 'Copy', 'Clipboard', 'Paperclip', 'File', 'Folder', 'FolderOpen', 'Hash',
  'Star', 'Archive', 'Inbox', 'GitBranch', 'GitCommit', 'GitPullRequest', 'Terminal',
  'Code', 'ExternalLink', 'Share2', 'Printer', 'Zap', 'TrendingUp', 'TrendingDown',
  'Package', 'Layers', 'Grid', 'Columns', 'Sidebar', 'Layout', 'Monitor', 'Smartphone',
  'Tablet', 'Laptop', 'HardDrive', 'Cpu', 'Server', 'Wifi', 'WifiOff', 'Globe', 'Navigation',
  'Compass', 'Map', 'Book', 'BookOpen', 'Bookmark', 'Award', 'Bell', 'BellOff', 'Flag',
  'Heart', 'ThumbsUp', 'ThumbsDown', 'MessageCircle', 'MoreHorizontal', 'MoreVertical',
  'Circle', 'Square', 'Triangle', 'Hexagon', 'Octagon', 'Play', 'Pause', 'SkipForward',
  'SkipBack', 'FastForward', 'Rewind', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Mic',
  'MicOff', 'Camera', 'CameraOff', 'Image', 'Film', 'Radio', 'Tv', 'Music', 'Headphones',
  'Cloud', 'CloudDrizzle', 'CloudRain', 'CloudSnow', 'CloudLightning', 'Sunrise', 'Sunset',
  'Command', 'CloudOff', 'Database', 'HelpCircle', 'Activity', 'Airplay', 'AlertOctagon',
  'AlignCenter', 'AlignJustify', 'AlignLeft', 'AlignRight', 'Anchor', 'Aperture', 'ArrowDown',
  'ArrowUp', 'AtSign', 'Battery', 'Bluetooth', 'Bold', 'Box', 'Briefcase', 'Cast', 'CheckSquare',
  'ChevronRight', 'Chrome', 'Codesandbox', 'Coffee', 'Columns', 'Copy', 'CornerDownLeft',
  'CornerDownRight', 'CornerLeftDown', 'CornerLeftUp', 'CornerRightDown', 'CornerRightUp',
  'CornerUpLeft', 'CornerUpRight', 'CreditCard', 'Crop', 'Crosshair', 'Delete', 'Disc',
  'DollarSign', 'DownloadCloud', 'Droplet', 'Edit2', 'Edit3', 'Feather', 'Figma', 'FileMinus',
  'FilePlus', 'FileX', 'Film', 'Filter', 'Flag', 'FolderMinus', 'FolderPlus', 'Framer', 'Frown',
  'Gift', 'GitMerge', 'Github', 'Gitlab', 'Grid', 'HardDrive', 'Hash', 'Headphones', 'HelpCircle',
  'Home', 'Image', 'Inbox', 'Info', 'Instagram', 'Italic', 'Key', 'Layers', 'Layout', 'LifeBuoy',
  'Link2', 'Linkedin', 'List', 'Loader', 'Lock', 'LogIn', 'LogOut', 'Mail', 'MapPin', 'Maximize',
  'Maximize2', 'Meh', 'Menu', 'MessageCircle', 'MessageSquare', 'Minimize', 'Minimize2', 'Minus',
  'MinusCircle', 'MinusSquare', 'Monitor', 'Moon', 'MoreHorizontal', 'MoreVertical', 'MousePointer',
  'Move', 'Music', 'Navigation', 'Navigation2', 'Octagon', 'Package', 'Paperclip', 'Pause',
  'PauseCircle', 'PenTool', 'Percent', 'Phone', 'PhoneCall', 'PhoneForwarded', 'PhoneIncoming',
  'PhoneMissed', 'PhoneOff', 'PhoneOutgoing', 'PieChart', 'Play', 'PlayCircle', 'Plus', 'PlusCircle',
  'PlusSquare', 'Pocket', 'Power', 'Printer', 'Radio', 'RefreshCcw', 'RefreshCw', 'Repeat', 'Rewind',
  'RotateCcw', 'RotateCw', 'Rss', 'Save', 'Scissors', 'Search', 'Send', 'Server', 'Settings', 'Share',
  'Share2', 'Shield', 'ShieldOff', 'ShoppingBag', 'ShoppingCart', 'Shuffle', 'Sidebar', 'SkipBack',
  'SkipForward', 'Slack', 'Slash', 'Sliders', 'Smartphone', 'Smile', 'Speaker', 'Square', 'Star',
  'StopCircle', 'Sun', 'Sunrise', 'Sunset', 'Tablet', 'Tag', 'Target', 'Terminal', 'Thermometer',
  'ThumbsDown', 'ThumbsUp', 'ToggleLeft', 'ToggleRight', 'Tool', 'Trash', 'Trash2', 'Trello',
  'TrendingDown', 'TrendingUp', 'Triangle', 'Truck', 'Tv', 'Twitch', 'Twitter', 'Type', 'Umbrella',
  'Underline', 'Unlock', 'Upload', 'UploadCloud', 'User', 'UserCheck', 'UserMinus', 'UserPlus',
  'UserX', 'Users', 'Video', 'VideoOff', 'Voicemail', 'Volume', 'Volume1', 'Volume2', 'VolumeX',
  'Watch', 'Wifi', 'WifiOff', 'Wind', 'X', 'XCircle', 'XOctagon', 'XSquare', 'Youtube', 'Zap',
  'ZapOff', 'ZoomIn', 'ZoomOut'
];

// Create and export all icon mocks
const mocks = {};
iconNames.forEach(name => {
  mocks[name] = createMockIcon(name);
});

module.exports = mocks;
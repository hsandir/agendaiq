// Mock for next/dynamic
const React = require('react');

module.exports = function dynamic(dynamicOptions, options) {
  // If dynamicOptions is a function (import), try to get the component
  if (typeof dynamicOptions === 'function') {
    // Return a mock component for now
    const DynamicComponent = (props) => {
      return React.createElement('div', { ...props });
    };
    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  }
  
  // Return the component directly if it's already a component
  return dynamicOptions;
};
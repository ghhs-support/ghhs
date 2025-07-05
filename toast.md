# React Hot Toast with Modals

## Problem
When using react-hot-toast with modals, toast notifications often appear behind the modal instead of above it. This happens because modals create their own stacking context, and the Toaster component is rendered outside of this context.

## Solution
There are two main approaches to fix this issue:

### Option 1: Add Toaster Inside Modal Component (Recommended)

Add the Toaster component inside your modal component to ensure it's rendered within the same stacking context:

```tsx
// In your modal component (e.g., components/ui/modal/index.tsx)
import { Toaster } from 'react-hot-toast';

export const Modal = ({ isOpen, onClose, children }) => {
  // ... existing modal code ...

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999 p-4 sm:p-8">
      {/* Modal backdrop */}
      <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]" onClick={onClose}></div>
      
      {/* Modal content */}
      <div className="relative rounded-3xl bg-white dark:bg-gray-900 max-w-2xl w-full">
        {children}
      </div>
      
      {/* Toaster inside modal to ensure it appears above the modal */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            zIndex: 999999,
          },
        }}
      />
    </div>
  );
};
```

### Option 2: Use Portal (Alternative)

If you prefer to keep the Toaster separate, you can use a portal to render it at the document body level with a higher z-index:

```tsx
// In your App.tsx or main layout
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            zIndex: 999999, // Higher than modal z-index
          },
        }}
        containerStyle={{
          zIndex: 999999,
        }}
      />
      {/* Rest of your app */}
    </>
  );
}
```

## Key Points

1. **Stacking Context**: Modals create their own stacking context, which can cause z-index issues
2. **Toaster Placement**: Placing the Toaster inside the modal ensures it's in the same stacking context
3. **Z-Index**: Always set a z-index higher than your modal's z-index
4. **Portal Alternative**: Using a portal can also work but requires careful z-index management

## Implementation Steps

1. Import `Toaster` from 'react-hot-toast' in your modal component
2. Add the `<Toaster />` component inside your modal's return statement
3. Configure the position and z-index as needed
4. Test with toast notifications to ensure they appear above the modal

## Example Usage in Modal

```tsx
// In your modal form component
import toast from 'react-hot-toast';

const handleTestToast = () => {
  toast.success('This should appear above the modal!');
};

// In your JSX
<button onClick={handleTestToast}>
  Test Toast
</button>
```

## Notes

- The Toaster component can be safely included in multiple modals - react-hot-toast will handle this gracefully
- Make sure your modal's z-index is lower than the Toaster's z-index
- Test with different toast types (success, error, info) to ensure all work properly 
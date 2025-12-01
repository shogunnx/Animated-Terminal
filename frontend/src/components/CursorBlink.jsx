import { useEffect } from 'react';

/**
 * Cursor Blink Component
 * Adds a blinking terminal cursor to the page
 */
export default function CursorBlink() {
  useEffect(() => {
    // Add cursor blink style to document
    const style = document.createElement('style');
    style.innerHTML = `
      .tsv-cursor-blink::after {
        content: '_';
        animation: cursorBlink 1s step-end infinite;
        margin-left: 2px;
        color: #76FFE1;
        opacity: 0.8;
      }
      
      @keyframes cursorBlink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      
      /* Add cursor to input fields */
      input:focus, textarea:focus {
        caret-color: #76FFE1;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  return null;
}

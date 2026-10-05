import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if a mobile soft keyboard is currently open on screen.
 * Automatically hides fixed bottom navigation bars when keyboard is active,
 * and restores them instantly as soon as the keyboard is dismissed, input is blurred,
 * or user scrolls the page.
 */
export function useKeyboardStatus(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const isInputElement = (el: Element | null): boolean => {
      if (!el) return false;
      const tagName = el.tagName;
      return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        (el as HTMLElement).isContentEditable
      );
    };

    const updateKeyboardState = () => {
      const activeEl = document.activeElement;
      const hasInputFocus = isInputElement(activeEl);

      // Check visualViewport height collapse on mobile devices
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const heightDifference = windowHeight - viewportHeight;
        const heightRatio = viewportHeight / windowHeight;

        // Soft mobile keyboard collapses visualViewport by >12% or >90px
        const isViewportCollapsed = heightRatio < 0.88 || heightDifference > 90;

        if (isViewportCollapsed && hasInputFocus) {
          setIsKeyboardVisible(true);
        } else {
          // If viewport is full height OR input lost focus => keyboard is closed!
          setIsKeyboardVisible(false);
        }
      } else {
        // Fallback for desktop or environments without visualViewport
        setIsKeyboardVisible(hasInputFocus);
      }
    };

    // Auto-blur active input when user scrolls page (closing soft keyboard and bringing bottom bar back)
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (Math.abs(window.scrollY - lastScrollY) > 15) {
        const active = document.activeElement;
        if (isInputElement(active)) {
          (active as HTMLElement).blur();
        }
      }
      lastScrollY = window.scrollY;
      updateKeyboardState();
    };

    const handleFocusChange = () => {
      setTimeout(updateKeyboardState, 50);
    };

    window.addEventListener('focusin', handleFocusChange);
    window.addEventListener('focusout', handleFocusChange);
    window.addEventListener('resize', updateKeyboardState);
    window.addEventListener('scroll', handleScroll, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardState);
      window.visualViewport.addEventListener('scroll', updateKeyboardState);
    }

    // Run initial check
    updateKeyboardState();

    return () => {
      window.removeEventListener('focusin', handleFocusChange);
      window.removeEventListener('focusout', handleFocusChange);
      window.removeEventListener('resize', updateKeyboardState);
      window.removeEventListener('scroll', handleScroll);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardState);
        window.visualViewport.removeEventListener('scroll', updateKeyboardState);
      }
    };
  }, []);

  return isKeyboardVisible;
}

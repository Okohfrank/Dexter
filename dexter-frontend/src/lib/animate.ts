import { useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* Shared 200ms ease-out layout transition for selection state changes
 * (segmented controls, tab switches). Subtle by design: these fire tens
 * of times daily, so the animation only marks the state change. */
export function animateSelectionChange(duration = 200) {
  LayoutAnimation.configureNext({
    duration,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

/* Press physics for every tappable CTA (the animate-ui button feel):
 * scale to 0.97 + slight fade while pressed, via state + static styles
 * (never a style callback). Spread `bind` onto the Pressable and merge
 * `feedback` into its style array.
 *
 *   const fb = usePressFeedback();
 *   <Pressable {...fb.bind} style={[styles.cta, fb.feedback]} ... />
 */
export function usePressFeedback() {
  const [pressed, setPressed] = useState(false);
  return {
    bind: {
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
    },
    feedback: pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 },
  } as const;
}

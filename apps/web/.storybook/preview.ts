import type { Preview } from "@storybook/react";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f1a' },
        { name: 'dark-modern', value: '#141820' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    layout: 'centered',
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        current: "",
        modern: "modern",
      },
      defaultTheme: "current",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;

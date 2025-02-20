# FourSPM Web Application

This project was created using DevExtreme CLI and has been updated to use modern Sass practices.

## Initial Project Setup

1. Set Node.js version:
```bash
nvm use 16.20.2
```

2. Create new DevExtreme React application:
```bash
npx devextreme-cli@1.3.0 new react-app fourspm_web
```
This will create a project using:
- DevExtreme version 21.2.15
- React version 17.0.2
- Create React App version 4

3. Install additional dependencies:
```bash
npm install --save-dev ajv@^7
```

## Sass Migration Guide

The project has been updated to use modern Sass practices and eliminate deprecation warnings. Here's what was done:

### 1. Install Dependencies
```bash
# Remove old dependencies
npm uninstall sass sass-loader

# Install new dependencies with specific versions
npm install --save-dev sass@^1.69.7 sass-loader@^13.3.3 @craco/craco
```

### 2. Create CRACO Configuration
Create a new file `craco.config.js` in the root directory:

```javascript
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const sassRule = webpackConfig.module.rules.find(
        (rule) => rule.test && rule.test.toString().includes('scss|sass')
      );

      if (sassRule) {
        sassRule.use = sassRule.use.map((loader) => {
          if (loader.loader && loader.loader.includes('sass-loader')) {
            return {
              ...loader,
              options: {
                ...loader.options,
                implementation: require('sass'),
                sassOptions: {
                  fiber: false,
                  implementation: require('sass'),
                }
              }
            };
          }
          return loader;
        });
      }

      return webpackConfig;
    },
  },
};
```

### 3. Update package.json Scripts
Replace the existing scripts section with:

```json
"scripts": {
  "start": "craco start",
  "build": "craco build",
  "test": "craco test",
  "eject": "react-scripts eject",
  "build-themes": "devextreme build",
  "postinstall": "npm run build-themes"
}
```

### 4. Update SCSS Files
The following SCSS files were updated to use modern Sass syntax:

1. Replace all `@import` statements with `@use`:
```scss
// Old
@import "../../../themes/generated/variables.base.scss";

// New
@use "../../../themes/generated/variables.base.scss" as *;
```

2. Update variable references to use namespace:
```scss
// Old
$base-text-color

// New
vars.$base-text-color
```

3. Replace deprecated color functions:
```scss
// Old
rgba($base-text-color, 0.7)

// New
color.adjust($base-text-color, $alpha: -0.3)
```

Files updated:
- `src/layouts/single-card/single-card.scss`
- `src/layouts/side-nav-inner-toolbar/side-nav-inner-toolbar.scss`
- `src/components/user-panel/user-panel.scss`
- `src/components/reset-password-form/reset-password-form.scss`
- `src/components/login-form/login-form.scss`
- `src/components/header/header.scss`
- `src/components/footer/footer.scss`
- `src/components/create-account-form/create-account-form.scss`
- `src/utils/patches.scss`

### 5. Fix React ESLint Warnings
Two React-related warnings were also fixed:

1. In `src/components/user-panel/user-panel.js`:
   - Wrapped `navigateToProfile` function in `useCallback` hook
   - Added proper dependencies to `useMemo` hook

2. In `src/utils/default-user.js`:
   - Changed anonymous default export to named export

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run build-themes`

Builds the DevExtreme themes.

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

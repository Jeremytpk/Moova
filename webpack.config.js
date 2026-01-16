const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add Node.js polyfills for browser
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
  };

  // Exclude native-only packages from web build
  config.resolve.alias = config.resolve.alias || {};
  config.resolve.alias['@stripe/stripe-react-native'] = false;
  config.resolve.alias['@react-native-community/datetimepicker'] = false;

  return config;
};

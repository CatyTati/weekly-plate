// Adds settings to app.json that depend on .env.
// Google's native sign-in on iOS needs the iOS client's URL scheme registered in the app.
// Android needs no plugin. Without the scheme the iPhone signs in through the browser.
module.exports = ({ config }) => {
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  const plugins = [...(config.plugins || [])];
  if (iosUrlScheme) plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  return { ...config, plugins };
};

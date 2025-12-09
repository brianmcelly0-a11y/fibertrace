const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const nativeOnlyModules = [
  'react-native-maps',
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    for (const nativeModule of nativeOnlyModules) {
      if (moduleName === nativeModule || moduleName.startsWith(nativeModule + '/')) {
        return {
          type: 'empty',
        };
      }
    }
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

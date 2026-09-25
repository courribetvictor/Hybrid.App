const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Ensure SVG and other assets resolve correctly
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg')

module.exports = config

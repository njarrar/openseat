// Lets the app import the language files in languages/ at the repo root. An
// .xml file becomes a module whose default export is its text; every other
// file goes to Expo's usual transformer.

const upstream = require('@expo/metro-config/babel-transformer');

module.exports.transform = (props) => {
  if (props.filename.endsWith('.xml')) {
    return upstream.transform({ ...props, src: `export default ${JSON.stringify(props.src)};` });
  }
  return upstream.transform(props);
};

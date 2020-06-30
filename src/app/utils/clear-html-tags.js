/**
 * Remove tags from html code
 * @param html
 * @param tags to be removed
 * @returns {string}
 */
module.exports = (html, tags = []) => {
  let result = html;

  for (const tag of tags) {
    const regExp = new RegExp(`<${tag}(\/|\\s.*?)?\>(.*?<\/${tag}>)?`, "g");
    result = result.replace(regExp, "");
  }

  return result;
};

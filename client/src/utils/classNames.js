// client/src/utils/classNames.js
/**
 * Utility function to conditionally join Tailwind CSS class names.
 * Filters out falsy values and joins the remaining strings with a space.
 * @param {...(string|boolean|null|undefined)} classes - A list of class names or conditional values.
 * @returns {string} A string of joined class names.
 */
export const cx = (...classes) => classes.filter(Boolean).join(" ");
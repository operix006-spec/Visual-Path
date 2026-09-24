const str1 = "جيم ستايل 123";
const str2 = "Cinematic Style!!";

const clean = (str) => str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

console.log("str1 clean:", clean(str1));
console.log("str2 clean:", clean(str2));

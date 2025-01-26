const response = await fetch("https://transparency.flocksafety.com/flock-safety-sales");
// https://transparency.flocksafety.com/flock-safety-admins
// https://transparency.flocksafety.com/flock-safety-le-training
// https://transparency.flocksafety.com/florida-le-flock-training

console.log(response.status); // => 200

const text = await response.text();

console.log(text);